/*
  # Fix gamification function ambiguity

  1. Database Changes
    - Drop the ambiguous calculate_gamification_rewards function with text parameter
    - Ensure only the UUID version remains
    - This resolves the PGRST203 error when calling the RPC function

  2. Function Cleanup
    - Remove any duplicate function definitions
    - Maintain only the version that accepts p_user_id as UUID type
*/

-- Drop the function with text parameter to resolve ambiguity
DROP FUNCTION IF EXISTS public.calculate_gamification_rewards(p_user_id text, p_rating_data jsonb);

-- Ensure the UUID version exists and is properly defined
-- This function should already exist from previous migrations, but we'll recreate it to be safe
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
  v_rating integer;
  v_is_skip boolean;
  v_listen_percentage numeric;
  v_is_blind_rating boolean;
  v_is_outside_preference boolean;
  v_track_id uuid;
  v_review_text text;
BEGIN
  -- Extract data from JSON parameter
  v_rating := (p_rating_data->>'rating')::integer;
  v_is_skip := COALESCE((p_rating_data->>'is_skip')::boolean, false);
  v_listen_percentage := COALESCE((p_rating_data->>'listen_percentage')::numeric, 0);
  v_is_blind_rating := COALESCE((p_rating_data->>'is_blind_rating')::boolean, false);
  v_is_outside_preference := COALESCE((p_rating_data->>'is_outside_preference')::boolean, false);
  v_track_id := (p_rating_data->>'track_id')::uuid;
  v_review_text := p_rating_data->>'review_text';

  -- Get current user stats
  SELECT * INTO v_user_stats
  FROM user_stats
  WHERE profile_id = p_user_id;

  -- If no stats record exists, create one
  IF v_user_stats IS NULL THEN
    INSERT INTO user_stats (profile_id, user_id)
    VALUES (p_user_id, p_user_id::text)
    RETURNING * INTO v_user_stats;
  END IF;

  -- Calculate XP based on action
  IF v_is_skip THEN
    -- Skip: 1 XP
    v_xp_earned := 1;
  ELSE
    -- Base rating XP: 5 points
    v_xp_earned := 5;
    
    -- Bonus for high ratings (4-5 stars): +3 XP
    IF v_rating >= 4 THEN
      v_xp_earned := v_xp_earned + 3;
    END IF;
    
    -- Bonus for text review: +2 XP
    IF v_review_text IS NOT NULL AND LENGTH(TRIM(v_review_text)) > 0 THEN
      v_xp_earned := v_xp_earned + 2;
    END IF;
    
    -- Bonus for listening to most of the track: +2 XP
    IF v_listen_percentage >= 0.8 THEN
      v_xp_earned := v_xp_earned + 2;
    END IF;
    
    -- Bonus for blind rating: +3 XP
    IF v_is_blind_rating THEN
      v_xp_earned := v_xp_earned + 3;
    END IF;
    
    -- Bonus for rating outside preferences: +5 XP
    IF v_is_outside_preference THEN
      v_xp_earned := v_xp_earned + 5;
    END IF;
  END IF;

  -- Update user stats and profile XP
  UPDATE user_stats SET
    total_tracks_rated_count = CASE WHEN NOT v_is_skip THEN total_tracks_rated_count + 1 ELSE total_tracks_rated_count END,
    total_skips_count = CASE WHEN v_is_skip THEN total_skips_count + 1 ELSE total_skips_count END,
    total_text_reviews_count = CASE WHEN NOT v_is_skip AND v_review_text IS NOT NULL AND LENGTH(TRIM(v_review_text)) > 0 THEN total_text_reviews_count + 1 ELSE total_text_reviews_count END,
    total_star_ratings_count = CASE WHEN NOT v_is_skip THEN total_star_ratings_count + 1 ELSE total_star_ratings_count END,
    total_songs_listened_80_percent_count = CASE WHEN v_listen_percentage >= 0.8 THEN total_songs_listened_80_percent_count + 1 ELSE total_songs_listened_80_percent_count END,
    total_songs_listened_100_percent_count = CASE WHEN v_listen_percentage >= 1.0 THEN total_songs_listened_100_percent_count + 1 ELSE total_songs_listened_100_percent_count END,
    total_blind_ratings_count = CASE WHEN v_is_blind_rating THEN total_blind_ratings_count + 1 ELSE total_blind_ratings_count END,
    total_outside_preference_ratings_count = CASE WHEN v_is_outside_preference THEN total_outside_preference_ratings_count + 1 ELSE total_outside_preference_ratings_count END,
    updated_at = now()
  WHERE profile_id = p_user_id;

  -- Update profile XP
  UPDATE profiles SET
    total_xp = total_xp + v_xp_earned,
    updated_at = now()
  WHERE id = p_user_id;

  -- Check for new badges (simplified badge logic)
  -- First rating badge
  IF v_user_stats.total_tracks_rated_count = 0 AND NOT v_is_skip THEN
    v_new_badges := array_append(v_new_badges, 'first_rating');
  END IF;

  -- Return results
  RETURN jsonb_build_object(
    'xp_earned', v_xp_earned,
    'new_badges', v_new_badges
  );
END;
$$;