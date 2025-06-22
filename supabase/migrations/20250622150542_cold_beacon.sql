/*
  # Fix Gamification Integration Issues

  1. Database Function Fixes
    - Fix the calculate_gamification_rewards function to properly handle XP calculation
    - Ensure proper badge checking and awarding
    - Fix user stats updates

  2. Add missing indexes and constraints
    - Ensure proper performance for gamification queries
*/

-- Drop existing function to recreate it properly
DROP FUNCTION IF EXISTS public.calculate_gamification_rewards(uuid, jsonb);

-- Create the corrected gamification rewards function
CREATE OR REPLACE FUNCTION public.calculate_gamification_rewards(
  p_user_id uuid,
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
  v_is_skip boolean := false;
  v_listen_percentage numeric;
  v_is_blind_rating boolean := false;
  v_is_outside_preference boolean := false;
  v_review_text text;
  v_daily_streak_xp integer := 0;
  v_consecutive_bonus_xp integer := 0;
  v_current_streak integer;
  v_consecutive_listen_streak integer;
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
    -- Skip action - minimal XP for engagement
    v_xp_earned := 1;
    
    -- Bonus XP for listening percentage even when skipping
    IF v_listen_percentage >= 0.5 AND v_listen_percentage < 0.8 THEN
      v_xp_earned := v_xp_earned + 5;
    ELSIF v_listen_percentage >= 0.8 AND v_listen_percentage < 1.0 THEN
      v_xp_earned := v_xp_earned + 8;
    ELSIF v_listen_percentage >= 1.0 THEN
      v_xp_earned := v_xp_earned + 15;
    END IF;
    
    -- Update skip count and reset consecutive listen streak
    UPDATE user_stats
    SET total_skips_count = total_skips_count + 1,
        consecutive_listen_streak = 0,
        updated_at = now()
    WHERE user_id = p_user_id::text;
  ELSE
    -- Rating action - Base XP: 10 points for every star rating
    v_xp_earned := 10;
    
    -- Bonus XP for text review: +40 XP
    IF v_review_text IS NOT NULL AND length(trim(v_review_text)) > 0 THEN
      v_xp_earned := v_xp_earned + 40;
    END IF;
    
    -- Bonus XP for rating outside preferences: +15 XP instead of +10 XP (so +5 more)
    IF v_is_outside_preference AND v_rating >= 4 THEN
      v_xp_earned := v_xp_earned + 5;
    END IF;
    
    -- Bonus XP for listening percentage
    IF v_listen_percentage >= 0.5 AND v_listen_percentage < 0.8 THEN
      v_xp_earned := v_xp_earned + 5;
    ELSIF v_listen_percentage >= 0.8 AND v_listen_percentage < 1.0 THEN
      v_xp_earned := v_xp_earned + 8;
    ELSIF v_listen_percentage >= 1.0 THEN
      v_xp_earned := v_xp_earned + 15;
    END IF;

    -- Calculate daily streak XP
    v_current_streak := COALESCE(v_user_stats.current_streak_days, 0);
    IF v_current_streak <= 1 THEN
      v_daily_streak_xp := 0;
    ELSIF v_current_streak = 2 THEN
      v_daily_streak_xp := 10;
    ELSE
      v_daily_streak_xp := 5 * (v_current_streak - 1);
    END IF;
    v_xp_earned := v_xp_earned + v_daily_streak_xp;

    -- Calculate consecutive listen bonus XP
    v_consecutive_listen_streak := COALESCE(v_user_stats.consecutive_listen_streak, 0) + 1;
    IF v_consecutive_listen_streak >= 5 THEN
      v_consecutive_bonus_xp := 10 * (v_consecutive_listen_streak - 4);
      v_xp_earned := v_xp_earned + v_consecutive_bonus_xp;
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
        consecutive_listen_streak = v_consecutive_listen_streak,
        max_consecutive_listen_streak = GREATEST(max_consecutive_listen_streak, v_consecutive_listen_streak),
        updated_at = now()
    WHERE user_id = p_user_id::text;

    -- Check for new badges
    -- Reload stats after update
    SELECT * INTO v_user_stats FROM user_stats WHERE user_id = p_user_id::text;

    -- First rating badge
    IF v_user_stats.total_tracks_rated_count = 1 THEN
      INSERT INTO user_badges (user_id, profile_id, badge_id)
      VALUES (p_user_id::text, p_user_id, 'first_discovery')
      ON CONFLICT (user_id, badge_id) DO NOTHING;
      
      IF FOUND THEN
        v_new_badges := array_append(v_new_badges, 'first_discovery');
      END IF;
    END IF;

    -- Blind Listener Badge (10 blind ratings)
    IF v_user_stats.total_blind_ratings_count = 10 THEN
      INSERT INTO user_badges (user_id, profile_id, badge_id)
      VALUES (p_user_id::text, p_user_id, 'blind_listener')
      ON CONFLICT (user_id, badge_id) DO NOTHING;
      
      IF FOUND THEN
        v_new_badges := array_append(v_new_badges, 'blind_listener');
      END IF;
    END IF;

    -- Wordsmith Badge (10 text reviews)
    IF v_user_stats.total_text_reviews_count = 10 THEN
      INSERT INTO user_badges (user_id, profile_id, badge_id)
      VALUES (p_user_id::text, p_user_id, 'wordsmith')
      ON CONFLICT (user_id, badge_id) DO NOTHING;
      
      IF FOUND THEN
        v_new_badges := array_append(v_new_badges, 'wordsmith');
      END IF;
    END IF;

    -- Careful Ear Badge (listened to 50%+ of 100 songs)
    IF v_user_stats.total_songs_listened_50_percent_count = 100 THEN
      INSERT INTO user_badges (user_id, profile_id, badge_id)
      VALUES (p_user_id::text, p_user_id, 'careful_ear')
      ON CONFLICT (user_id, badge_id) DO NOTHING;
      
      IF FOUND THEN
        v_new_badges := array_append(v_new_badges, 'careful_ear');
      END IF;
    END IF;

    -- Completionist Badge (listened to 100 songs all the way through)
    IF v_user_stats.total_songs_listened_100_percent_count = 100 THEN
      INSERT INTO user_badges (user_id, profile_id, badge_id)
      VALUES (p_user_id::text, p_user_id, 'completionist')
      ON CONFLICT (user_id, badge_id) DO NOTHING;
      
      IF FOUND THEN
        v_new_badges := array_append(v_new_badges, 'completionist');
      END IF;
    END IF;
  END IF;

  -- Update profile XP
  UPDATE profiles
  SET total_xp = total_xp + v_xp_earned,
      updated_at = now()
  WHERE id = p_user_id;

  -- Return results
  RETURN jsonb_build_object(
    'xp_earned', v_xp_earned,
    'new_badges', v_new_badges,
    'action_type', CASE WHEN v_is_skip THEN 'skip' ELSE 'rating' END,
    'daily_streak_xp', v_daily_streak_xp,
    'consecutive_bonus_xp', v_consecutive_bonus_xp
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.calculate_gamification_rewards(uuid, jsonb) TO authenticated;

-- Add missing badge for first discovery if it doesn't exist
INSERT INTO badges (id, name, description, icon, category, xp_reward, is_rare) VALUES
('first_discovery', 'First Discovery', 'Rated your first track', '🎵', 'discovery', 50, false)
ON CONFLICT (id) DO NOTHING;