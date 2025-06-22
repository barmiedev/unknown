/*
  # Fix gamification function overload ambiguity

  1. Database Changes
    - Drop the text version of calculate_gamification_rewards function
    - Ensure only the UUID version remains to eliminate ambiguity
    - This resolves the PGRST203 error when calling the RPC function

  2. Function Cleanup
    - Remove any duplicate function definitions
    - Maintain only the version that accepts p_user_id as UUID type
*/

-- Drop the text version of the function if it exists
DROP FUNCTION IF EXISTS public.calculate_gamification_rewards(p_user_id text, p_rating_data jsonb);

-- Ensure the UUID version exists and is properly defined
-- This function should already exist from previous migrations, but we'll recreate it to be safe
CREATE OR REPLACE FUNCTION public.calculate_gamification_rewards(
  p_user_id uuid,
  p_rating_data jsonb
) RETURNS jsonb AS $$
DECLARE
  v_xp_earned integer := 0;
  v_new_badges text[] := '{}';
  v_user_stats record;
  v_track_id uuid;
  v_rating integer;
  v_is_skip boolean := false;
  v_listen_percentage numeric;
  v_is_blind_rating boolean := false;
  v_is_outside_preference boolean := false;
  v_review_text text;
BEGIN
  -- Extract data from JSON parameter
  v_track_id := (p_rating_data->>'track_id')::uuid;
  v_rating := (p_rating_data->>'rating')::integer;
  v_is_skip := COALESCE((p_rating_data->>'is_skip')::boolean, false);
  v_listen_percentage := COALESCE((p_rating_data->>'listen_percentage')::numeric, 0);
  v_is_blind_rating := COALESCE((p_rating_data->>'is_blind_rating')::boolean, false);
  v_is_outside_preference := COALESCE((p_rating_data->>'is_outside_preference')::boolean, false);
  v_review_text := p_rating_data->>'review_text';

  -- Get current user stats
  SELECT * INTO v_user_stats
  FROM user_stats
  WHERE user_id = p_user_id::text;

  -- If no stats record exists, create one
  IF v_user_stats IS NULL THEN
    INSERT INTO user_stats (user_id, profile_id)
    VALUES (p_user_id::text, p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT * INTO v_user_stats
    FROM user_stats
    WHERE user_id = p_user_id::text;
  END IF;

  -- Calculate XP based on action
  IF v_is_skip THEN
    -- Skip action - minimal XP
    v_xp_earned := 1;
    
    -- Update skip count
    UPDATE user_stats
    SET total_skips_count = total_skips_count + 1,
        updated_at = now()
    WHERE user_id = p_user_id::text;
  ELSE
    -- Rating action
    v_xp_earned := 5; -- Base XP for rating
    
    -- Bonus XP for high ratings
    IF v_rating >= 4 THEN
      v_xp_earned := v_xp_earned + 3;
    END IF;
    
    -- Bonus XP for blind rating
    IF v_is_blind_rating THEN
      v_xp_earned := v_xp_earned + 2;
    END IF;
    
    -- Bonus XP for rating outside preferences
    IF v_is_outside_preference THEN
      v_xp_earned := v_xp_earned + 3;
    END IF;
    
    -- Bonus XP for writing a review
    IF v_review_text IS NOT NULL AND length(trim(v_review_text)) > 0 THEN
      v_xp_earned := v_xp_earned + 2;
    END IF;
    
    -- Bonus XP for listening percentage
    IF v_listen_percentage >= 0.8 THEN
      v_xp_earned := v_xp_earned + 2;
    ELSIF v_listen_percentage >= 0.5 THEN
      v_xp_earned := v_xp_earned + 1;
    END IF;

    -- Update user stats
    UPDATE user_stats
    SET total_tracks_rated_count = total_tracks_rated_count + 1,
        total_star_ratings_count = total_star_ratings_count + 1,
        total_text_reviews_count = CASE 
          WHEN v_review_text IS NOT NULL AND length(trim(v_review_text)) > 0 
          THEN total_text_reviews_count + 1 
          ELSE total_text_reviews_count 
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
        updated_at = now()
    WHERE user_id = p_user_id::text;
  END IF;

  -- Update profile XP
  UPDATE profiles
  SET total_xp = total_xp + v_xp_earned,
      updated_at = now()
  WHERE id = p_user_id;

  -- Return results
  RETURN jsonb_build_object(
    'xp_earned', v_xp_earned,
    'new_badges', v_new_badges
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;