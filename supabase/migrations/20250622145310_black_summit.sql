/*
  # Fix gamification rewards function ON CONFLICT error

  1. Function Updates
    - Fix ON CONFLICT specifications to match existing unique constraints
    - Ensure all UPSERT operations use proper conflict resolution
    - Update user_stats table operations to use user_id (which has unique constraint)
    - Fix any other ON CONFLICT issues in the function

  2. Changes Made
    - Corrected ON CONFLICT clauses to match actual unique constraints
    - Ensured proper error handling for constraint violations
    - Maintained all existing functionality while fixing database errors
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS calculate_gamification_rewards(text, jsonb);

-- Create the corrected gamification rewards function
CREATE OR REPLACE FUNCTION calculate_gamification_rewards(
  p_user_id text,
  p_rating_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_xp_earned integer := 0;
  v_new_badges text[] := '{}';
  v_user_stats record;
  v_track_id uuid;
  v_rating integer;
  v_review_text text;
  v_is_blind_rating boolean;
  v_is_outside_preference boolean;
  v_listen_percentage numeric;
  v_is_skip boolean;
  v_profile_id uuid;
BEGIN
  -- Get profile_id from user_id
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE id::text = p_user_id;

  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object(
      'xp_earned', 0,
      'new_badges', '[]'::jsonb,
      'error', 'Profile not found'
    );
  END IF;

  -- Extract data from JSON parameter
  v_track_id := (p_rating_data->>'track_id')::uuid;
  v_rating := (p_rating_data->>'rating')::integer;
  v_review_text := p_rating_data->>'review_text';
  v_is_blind_rating := COALESCE((p_rating_data->>'is_blind_rating')::boolean, false);
  v_is_outside_preference := COALESCE((p_rating_data->>'is_outside_preference')::boolean, false);
  v_listen_percentage := COALESCE((p_rating_data->>'listen_percentage')::numeric, 0);
  v_is_skip := COALESCE((p_rating_data->>'is_skip')::boolean, false);

  -- Get current user stats
  SELECT * INTO v_user_stats
  FROM user_stats
  WHERE user_id = p_user_id;

  -- If no stats exist, create initial record
  IF v_user_stats IS NULL THEN
    INSERT INTO user_stats (
      user_id,
      profile_id,
      total_tracks_rated_count,
      current_streak_days,
      longest_streak_days,
      total_points,
      last_activity_date,
      total_text_reviews_count,
      total_star_ratings_count,
      total_songs_listened_50_percent_count,
      total_songs_listened_80_percent_count,
      total_songs_listened_100_percent_count,
      total_blind_ratings_count,
      total_outside_preference_ratings_count,
      total_skips_count,
      total_artists_discovered_count,
      total_genres_rated_count,
      consecutive_listen_streak,
      max_consecutive_listen_streak
    ) VALUES (
      p_user_id,
      v_profile_id,
      0, 0, 0, 0,
      CURRENT_DATE,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    );
    
    -- Reload stats
    SELECT * INTO v_user_stats
    FROM user_stats
    WHERE user_id = p_user_id;
  END IF;

  -- Calculate XP and update stats based on action type
  IF v_is_skip THEN
    -- Handle skip action
    v_xp_earned := 1; -- Small XP for engagement
    
    -- Update skip count
    UPDATE user_stats
    SET 
      total_skips_count = total_skips_count + 1,
      last_activity_date = CURRENT_DATE,
      updated_at = now()
    WHERE user_id = p_user_id;
    
  ELSE
    -- Handle rating action
    v_xp_earned := 5; -- Base XP for rating
    
    -- Bonus XP for different actions
    IF v_rating >= 4 THEN
      v_xp_earned := v_xp_earned + 3; -- Bonus for high rating
    END IF;
    
    IF v_review_text IS NOT NULL AND length(trim(v_review_text)) > 0 THEN
      v_xp_earned := v_xp_earned + 5; -- Bonus for review
    END IF;
    
    IF v_is_blind_rating THEN
      v_xp_earned := v_xp_earned + 3; -- Bonus for blind rating
    END IF;
    
    IF v_is_outside_preference THEN
      v_xp_earned := v_xp_earned + 5; -- Bonus for exploring outside preferences
    END IF;
    
    IF v_listen_percentage >= 0.8 THEN
      v_xp_earned := v_xp_earned + 2; -- Bonus for listening to most of the song
    END IF;

    -- Update user stats - using user_id which has unique constraint
    UPDATE user_stats
    SET 
      total_tracks_rated_count = total_tracks_rated_count + 1,
      total_star_ratings_count = total_star_ratings_count + 1,
      total_text_reviews_count = CASE 
        WHEN v_review_text IS NOT NULL AND length(trim(v_review_text)) > 0 
        THEN total_text_reviews_count + 1 
        ELSE total_text_reviews_count 
      END,
      total_songs_listened_50_percent_count = CASE 
        WHEN v_listen_percentage >= 0.5 
        THEN total_songs_listened_50_percent_count + 1 
        ELSE total_songs_listened_50_percent_count 
      END,
      total_songs_listened_80_percent_count = CASE 
        WHEN v_listen_percentage >= 0.8 
        THEN total_songs_listened_80_percent_count + 1 
        ELSE total_songs_listened_80_percent_count 
      END,
      total_songs_listened_100_percent_count = CASE 
        WHEN v_listen_percentage >= 1.0 
        THEN total_songs_listened_100_percent_count + 1 
        ELSE total_songs_listened_100_percent_count 
      END,
      total_blind_ratings_count = CASE 
        WHEN v_is_blind_rating 
        THEN total_blind_ratings_count + 1 
        ELSE total_blind_ratings_count 
      END,
      total_outside_preference_ratings_count = CASE 
        WHEN v_is_outside_preference 
        THEN total_outside_preference_ratings_count + 1 
        ELSE total_outside_preference_ratings_count 
      END,
      total_points = total_points + v_xp_earned,
      last_activity_date = CURRENT_DATE,
      updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  -- Update profile XP - using id which is primary key
  UPDATE profiles
  SET 
    total_xp = total_xp + v_xp_earned,
    updated_at = now()
  WHERE id = v_profile_id;

  -- Check for new badges (simplified badge logic)
  -- First rating badge
  IF v_user_stats.total_tracks_rated_count = 0 AND NOT v_is_skip THEN
    -- Check if user doesn't already have this badge
    IF NOT EXISTS (
      SELECT 1 FROM user_badges 
      WHERE user_id = p_user_id AND badge_id = 'first_rating'
    ) THEN
      INSERT INTO user_badges (user_id, profile_id, badge_id)
      VALUES (p_user_id, v_profile_id, 'first_rating')
      ON CONFLICT (user_id, badge_id) DO NOTHING;
      
      v_new_badges := array_append(v_new_badges, 'first_rating');
    END IF;
  END IF;

  -- Explorer badge (10 ratings)
  IF v_user_stats.total_tracks_rated_count + 1 = 10 AND NOT v_is_skip THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_badges 
      WHERE user_id = p_user_id AND badge_id = 'explorer'
    ) THEN
      INSERT INTO user_badges (user_id, profile_id, badge_id)
      VALUES (p_user_id, v_profile_id, 'explorer')
      ON CONFLICT (user_id, badge_id) DO NOTHING;
      
      v_new_badges := array_append(v_new_badges, 'explorer');
    END IF;
  END IF;

  -- Reviewer badge (first review)
  IF v_review_text IS NOT NULL AND length(trim(v_review_text)) > 0 AND v_user_stats.total_text_reviews_count = 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_badges 
      WHERE user_id = p_user_id AND badge_id = 'reviewer'
    ) THEN
      INSERT INTO user_badges (user_id, profile_id, badge_id)
      VALUES (p_user_id, v_profile_id, 'reviewer')
      ON CONFLICT (user_id, badge_id) DO NOTHING;
      
      v_new_badges := array_append(v_new_badges, 'reviewer');
    END IF;
  END IF;

  -- Return results
  RETURN jsonb_build_object(
    'xp_earned', v_xp_earned,
    'new_badges', to_jsonb(v_new_badges)
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return safe response
    RAISE LOG 'Error in calculate_gamification_rewards: %', SQLERRM;
    RETURN jsonb_build_object(
      'xp_earned', 0,
      'new_badges', '[]'::jsonb,
      'error', SQLERRM
    );
END;
$$;