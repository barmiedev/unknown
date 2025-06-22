/*
  # Gamification System Implementation

  1. Schema Updates
    - Add total_xp to profiles table
    - Update user_stats table with new gamification counters
    - Add gamification flags to user_ratings table
    - Add track statistics for badge calculations
    - Create badges table for available badges
    - Update user_badges table structure

  2. Functions
    - Create calculate_gamification_rewards function for XP and badge logic
    - Create get_user_leaderboard function for rankings

  3. Security
    - Update RLS policies for new tables and columns
    - Grant appropriate permissions to functions
*/

-- Add total_xp to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'total_xp'
  ) THEN
    ALTER TABLE profiles ADD COLUMN total_xp INTEGER DEFAULT 0;
  END IF;
END $$;

-- Update user_stats table with new gamification counters
DO $$
BEGIN
  -- Rename existing column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'total_tracks_rated'
  ) THEN
    ALTER TABLE user_stats RENAME COLUMN total_tracks_rated TO total_tracks_rated_count;
  END IF;

  -- Add new columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'total_text_reviews_count'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN total_text_reviews_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'total_star_ratings_count'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN total_star_ratings_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'total_songs_listened_50_percent_count'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN total_songs_listened_50_percent_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'total_songs_listened_80_percent_count'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN total_songs_listened_80_percent_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'total_songs_listened_100_percent_count'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN total_songs_listened_100_percent_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'total_blind_ratings_count'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN total_blind_ratings_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'total_outside_preference_ratings_count'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN total_outside_preference_ratings_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'total_skips_count'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN total_skips_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'total_artists_discovered_count'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN total_artists_discovered_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'total_genres_rated_count'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN total_genres_rated_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'consecutive_listen_streak'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN consecutive_listen_streak INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'max_consecutive_listen_streak'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN max_consecutive_listen_streak INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add gamification flags to user_ratings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_ratings' AND column_name = 'is_blind_rating'
  ) THEN
    ALTER TABLE user_ratings ADD COLUMN is_blind_rating BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_ratings' AND column_name = 'is_outside_preference'
  ) THEN
    ALTER TABLE user_ratings ADD COLUMN is_outside_preference BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_ratings' AND column_name = 'listen_percentage'
  ) THEN
    ALTER TABLE user_ratings ADD COLUMN listen_percentage NUMERIC DEFAULT 0;
  END IF;
END $$;

-- Add track statistics for badge calculations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'total_ratings_count'
  ) THEN
    ALTER TABLE tracks ADD COLUMN total_ratings_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'average_rating'
  ) THEN
    ALTER TABLE tracks ADD COLUMN average_rating NUMERIC DEFAULT 0.0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'last_rated_at'
  ) THEN
    ALTER TABLE tracks ADD COLUMN last_rated_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'first_rated_by'
  ) THEN
    ALTER TABLE tracks ADD COLUMN first_rated_by UUID REFERENCES profiles(id);
  END IF;
END $$;

-- Create badges table for available badges
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 0,
  is_rare BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on badges table
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- Create policy for badges (public read access)
CREATE POLICY "Anyone can read badges"
  ON badges
  FOR SELECT
  TO public
  USING (true);

-- Insert all available badges
INSERT INTO badges (id, name, description, icon, category, xp_reward, is_rare) VALUES
-- Discovery Badges
('blind_listener', 'Blind Listener', 'Rated 10 songs without revealing artist info', '🧭', 'discovery', 100, false),
('the_dig', 'The Dig', 'Listened to 100 different artists', '⛏️', 'discovery', 200, false),
('first_impressionist', 'First Impressionist', 'First to rate a song', '🥇', 'discovery', 50, false),
('across_the_spectrum', 'Across the Spectrum', 'Rated songs in 10+ different genres', '🌈', 'discovery', 150, false),
('one_hit_wonder', 'One-Hit Wonder', 'Rated a song 5 stars that no one else did', '⭐', 'discovery', 300, true),
('deep_cuts', 'Deep Cuts', 'Rated 50 songs with <100 listens', '💎', 'discovery', 200, false),
('open_ears', 'Open Ears', 'Rated 20 songs with <5 ratings total', '👂', 'discovery', 150, false),

-- Engagement & Streak Badges
('fresh_daily', 'Fresh Daily', 'Logged in and rated a song 7 days in a row', '📅', 'engagement', 100, false),
('the_long_haul', 'The Long Haul', '30-day streak', '🏃', 'engagement', 500, false),
('xp_grinder', 'XP Grinder', 'Earned 1000 XP in one week', '⚡', 'engagement', 200, false),
('first_listen_of_day', 'First Listen of the Day', 'First user to rate a new song in a day', '🌅', 'engagement', 75, false),
('power_listener', 'Power Listener', 'Listened to 1000 songs total', '🎧', 'engagement', 300, false),
('night_owl', 'Night Owl', 'Listened to 10+ songs between 1am–4am', '🦉', 'engagement', 100, false),
('skipless', 'Skipless', 'Rated 10 songs in a row without skipping', '🎯', 'engagement', 150, false),

-- Reviewer / Critic Badges
('wordsmith', 'Wordsmith', 'Wrote 10 text reviews', '✍️', 'critic', 100, false),
('critics_voice', 'Critic''s Voice', 'Wrote a review that received 10+ likes', '📢', 'critic', 200, false),
('too_honest', 'Too Honest', 'Gave 1-star ratings 10 times in a week', '😤', 'critic', 100, false),
('golden_ear', 'Golden Ear', 'Gave 5 stars to a song that later trended', '👂', 'critic', 300, true),
('balanced_reviewer', 'Balanced Reviewer', 'Given every star rating (1–5) at least 5 times', '⚖️', 'critic', 150, false),

-- Listening Behavior Badges
('careful_ear', 'Careful Ear', 'Listened to 50%+ of 100 songs', '👂', 'listening', 150, false),
('completionist', 'Completionist', 'Listened to 100 songs all the way through', '✅', 'listening', 200, false),
('quick_judge', 'Quick Judge', 'Skipped within 10 seconds 50 times', '⚡', 'listening', 100, false),
('patient_soul', 'Patient Soul', 'Listened to full length of 50 songs before rating', '🧘', 'listening', 200, false),

-- Social & Community Badges
('inviter', 'Inviter', 'Invited one friend', '👥', 'social', 200, false),
('talent_scout', 'Talent Scout', 'Your invitee uploaded a song', '🔍', 'social', 300, false),
('word_spreader', 'Word Spreader', 'Invited 10+ users', '📣', 'social', 500, false),
('the_connector', 'The Connector', 'Sent 10 song recommendations', '🔗', 'social', 200, false),
('shared_taste', 'Shared Taste', 'You and another user rated the same song identically 50 times', '🤝', 'social', 250, false),

-- Special / Rare Badges
('early_bird', 'Early Bird', 'Joined during early access / beta', '🐦', 'special', 500, true),
('first_100', 'First 100', 'Among the first 100 users', '💯', 'special', 1000, true),
('collector', 'Collector', 'Earned 20 different badges', '🏆', 'special', 300, false),
('featured_reviewer', 'Featured Reviewer', 'Your review was featured by the team', '⭐', 'special', 500, true),
('first_upload', 'First Upload', 'You uploaded a song to the platform', '📤', 'special', 300, false),
('tastemaker', 'Tastemaker', 'Rated a song that later became a staff pick', '👑', 'special', 400, true),
('silent_supporter', 'Silent Supporter', 'Gave high ratings but no reviews', '🤫', 'special', 150, false),
('mystery_solver', 'Mystery Solver', 'Correctly guessed 10 artists', '🕵️', 'special', 200, false),

-- Experimental & Fun Badges
('contrarian', 'Contrarian', 'Frequently rate the opposite of popular opinion', '🔄', 'experimental', 200, false),
('underdog_fan', 'Underdog Fan', '5-star rating on a track with mostly low ratings', '🐕', 'experimental', 250, false),
('the_ghost', 'The Ghost', 'Listens often, but never writes reviews', '👻', 'experimental', 100, false),
('rising_star', 'Rising Star', 'Gained 500 XP in 24 hours', '🌟', 'experimental', 200, false),
('echo_chamber', 'Echo Chamber', 'Repeatedly rated the same genre highly for a week', '🔊', 'experimental', 150, false),
('eclectic_soul', 'Eclectic Soul', 'Rated equally across multiple genres', '🎨', 'experimental', 200, false),
('minimalist', 'Minimalist', 'Only gives 1–2 word reviews', '✂️', 'experimental', 100, false),
('emoji_critic', 'Emoji Critic', 'Wrote 10 reviews using only emojis', '😀', 'experimental', 150, false)
ON CONFLICT (id) DO NOTHING;

-- Create function to calculate daily streak XP
CREATE OR REPLACE FUNCTION calculate_daily_streak_xp(day_streak INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF day_streak <= 1 THEN
    RETURN 0;
  ELSIF day_streak = 2 THEN
    RETURN 10;
  ELSE
    RETURN 5 * (day_streak - 1);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate consecutive listen bonus XP
CREATE OR REPLACE FUNCTION calculate_consecutive_listen_bonus(consecutive_count INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF consecutive_count < 5 THEN
    RETURN 0;
  ELSE
    RETURN 10 * (consecutive_count - 4);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create comprehensive gamification rewards function
CREATE OR REPLACE FUNCTION calculate_gamification_rewards(
  p_user_id UUID,
  p_rating_data JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_xp_earned INTEGER := 0;
  v_new_badges TEXT[] := '{}';
  v_current_user_stats user_stats;
  v_current_profile profiles;
  v_track_id UUID := (p_rating_data->>'track_id')::UUID;
  v_rating INTEGER := (p_rating_data->>'rating')::INTEGER;
  v_review_text TEXT := p_rating_data->>'review_text';
  v_is_blind_rating BOOLEAN := COALESCE((p_rating_data->>'is_blind_rating')::BOOLEAN, FALSE);
  v_is_outside_preference BOOLEAN := COALESCE((p_rating_data->>'is_outside_preference')::BOOLEAN, FALSE);
  v_listen_percentage NUMERIC := COALESCE((p_rating_data->>'listen_percentage')::NUMERIC, 0);
  v_is_skip BOOLEAN := COALESCE((p_rating_data->>'is_skip')::BOOLEAN, FALSE);
  v_track_genre TEXT;
  v_track_mood TEXT;
  v_track_artist_id UUID;
  v_current_streak INTEGER;
  v_daily_streak_xp INTEGER;
  v_consecutive_bonus_xp INTEGER;
  v_unique_genres_count INTEGER;
  v_unique_artists_count INTEGER;
  v_track_rating_count INTEGER;
  v_is_first_rating BOOLEAN := FALSE;
BEGIN
  -- Fetch current user stats and profile
  SELECT * INTO v_current_user_stats FROM user_stats WHERE profile_id = p_user_id;
  SELECT * INTO v_current_profile FROM profiles WHERE id = p_user_id;

  -- Initialize user_stats if not exists
  IF v_current_user_stats IS NULL THEN
    INSERT INTO user_stats (profile_id, user_id) VALUES (p_user_id, p_user_id::TEXT);
    SELECT * INTO v_current_user_stats FROM user_stats WHERE profile_id = p_user_id;
  END IF;

  -- Fetch track details
  SELECT genre, mood, artist_id, total_ratings_count 
  INTO v_track_genre, v_track_mood, v_track_artist_id, v_track_rating_count
  FROM tracks WHERE id = v_track_id;

  -- Check if this is the first rating for this track
  v_is_first_rating := (v_track_rating_count = 0);

  -- Handle skip action
  IF v_is_skip THEN
    -- Update skip count
    UPDATE user_stats
    SET 
      total_skips_count = total_skips_count + 1,
      consecutive_listen_streak = 0,
      updated_at = now()
    WHERE profile_id = p_user_id;

    -- XP for listening carefully (even when skipping)
    IF v_listen_percentage >= 0.5 AND v_listen_percentage < 0.8 THEN
      v_xp_earned := v_xp_earned + 5;
    ELSIF v_listen_percentage >= 0.8 AND v_listen_percentage < 1.0 THEN
      v_xp_earned := v_xp_earned + 8;
    ELSIF v_listen_percentage >= 1.0 THEN
      v_xp_earned := v_xp_earned + 15;
    END IF;

    -- Update profile XP
    UPDATE profiles SET total_xp = total_xp + v_xp_earned WHERE id = p_user_id;

    RETURN jsonb_build_object(
      'xp_earned', v_xp_earned,
      'new_badges', v_new_badges,
      'action_type', 'skip'
    );
  END IF;

  -- XP for Rating
  v_xp_earned := v_xp_earned + 10; -- +10XP for every star rating

  -- XP for Text Review
  IF v_review_text IS NOT NULL AND LENGTH(TRIM(v_review_text)) > 0 THEN
    v_xp_earned := v_xp_earned + 40; -- +40XP for every text review
  END IF;

  -- XP for Discovery-Based (outside preferences)
  IF v_is_outside_preference THEN
    v_xp_earned := v_xp_earned + 5; -- +15XP instead of +10XP (already added 10, so add 5 more)
  END IF;

  -- XP for Listening carefully
  IF v_listen_percentage >= 0.5 AND v_listen_percentage < 0.8 THEN
    v_xp_earned := v_xp_earned + 5;
  ELSIF v_listen_percentage >= 0.8 AND v_listen_percentage < 1.0 THEN
    v_xp_earned := v_xp_earned + 8;
  ELSIF v_listen_percentage >= 1.0 THEN
    v_xp_earned := v_xp_earned + 15;
  END IF;

  -- Calculate daily streak XP
  v_current_streak := COALESCE(v_current_user_stats.current_streak_days, 0);
  v_daily_streak_xp := calculate_daily_streak_xp(v_current_streak);
  v_xp_earned := v_xp_earned + v_daily_streak_xp;

  -- Calculate consecutive listen bonus XP
  v_consecutive_bonus_xp := calculate_consecutive_listen_bonus(v_current_user_stats.consecutive_listen_streak + 1);
  v_xp_earned := v_xp_earned + v_consecutive_bonus_xp;

  -- Update user_stats counters
  UPDATE user_stats
  SET
    total_tracks_rated_count = total_tracks_rated_count + 1,
    total_star_ratings_count = total_star_ratings_count + 1,
    total_text_reviews_count = total_text_reviews_count + CASE WHEN v_review_text IS NOT NULL AND LENGTH(TRIM(v_review_text)) > 0 THEN 1 ELSE 0 END,
    total_blind_ratings_count = total_blind_ratings_count + CASE WHEN v_is_blind_rating THEN 1 ELSE 0 END,
    total_outside_preference_ratings_count = total_outside_preference_ratings_count + CASE WHEN v_is_outside_preference THEN 1 ELSE 0 END,
    total_songs_listened_50_percent_count = total_songs_listened_50_percent_count + CASE WHEN v_listen_percentage >= 0.5 THEN 1 ELSE 0 END,
    total_songs_listened_80_percent_count = total_songs_listened_80_percent_count + CASE WHEN v_listen_percentage >= 0.8 THEN 1 ELSE 0 END,
    total_songs_listened_100_percent_count = total_songs_listened_100_percent_count + CASE WHEN v_listen_percentage >= 1.0 THEN 1 ELSE 0 END,
    consecutive_listen_streak = consecutive_listen_streak + 1,
    max_consecutive_listen_streak = GREATEST(max_consecutive_listen_streak, consecutive_listen_streak + 1),
    updated_at = now()
  WHERE profile_id = p_user_id;

  -- Update profiles total_xp
  UPDATE profiles
  SET total_xp = total_xp + v_xp_earned
  WHERE id = p_user_id;

  -- Update tracks stats
  UPDATE tracks
  SET
    total_ratings_count = total_ratings_count + 1,
    average_rating = CASE 
      WHEN total_ratings_count = 0 THEN v_rating::NUMERIC
      ELSE ((average_rating * total_ratings_count) + v_rating) / (total_ratings_count + 1)
    END,
    last_rated_at = now(),
    first_rated_by = CASE WHEN v_is_first_rating THEN p_user_id ELSE first_rated_by END
  WHERE id = v_track_id;

  -- Calculate unique genres and artists for badges
  SELECT COUNT(DISTINCT genre) INTO v_unique_genres_count
  FROM user_ratings ur
  JOIN tracks t ON ur.track_id = t.id
  WHERE ur.profile_id = p_user_id;

  SELECT COUNT(DISTINCT artist_id) INTO v_unique_artists_count
  FROM user_ratings ur
  JOIN tracks t ON ur.track_id = t.id
  WHERE ur.profile_id = p_user_id AND t.artist_id IS NOT NULL;

  -- Update unique counts in user_stats
  UPDATE user_stats
  SET
    total_genres_rated_count = v_unique_genres_count,
    total_artists_discovered_count = v_unique_artists_count
  WHERE profile_id = p_user_id;

  -- Badge Logic
  -- Refresh current stats after updates
  SELECT * INTO v_current_user_stats FROM user_stats WHERE profile_id = p_user_id;

  -- First Discovery Badge (first rating ever)
  IF v_current_user_stats.total_tracks_rated_count = 1 THEN
    INSERT INTO user_badges (profile_id, user_id, badge_id)
    VALUES (p_user_id, p_user_id::TEXT, 'first_discovery')
    ON CONFLICT (profile_id, badge_id) DO NOTHING;
    IF FOUND THEN
      v_new_badges := array_append(v_new_badges, 'first_discovery');
    END IF;
  END IF;

  -- Blind Listener Badge (10 blind ratings)
  IF v_current_user_stats.total_blind_ratings_count = 10 THEN
    INSERT INTO user_badges (profile_id, user_id, badge_id)
    VALUES (p_user_id, p_user_id::TEXT, 'blind_listener')
    ON CONFLICT (profile_id, badge_id) DO NOTHING;
    IF FOUND THEN
      v_new_badges := array_append(v_new_badges, 'blind_listener');
    END IF;
  END IF;

  -- Wordsmith Badge (10 text reviews)
  IF v_current_user_stats.total_text_reviews_count = 10 THEN
    INSERT INTO user_badges (profile_id, user_id, badge_id)
    VALUES (p_user_id, p_user_id::TEXT, 'wordsmith')
    ON CONFLICT (profile_id, badge_id) DO NOTHING;
    IF FOUND THEN
      v_new_badges := array_append(v_new_badges, 'wordsmith');
    END IF;
  END IF;

  -- The Dig Badge (100 different artists)
  IF v_current_user_stats.total_artists_discovered_count = 100 THEN
    INSERT INTO user_badges (profile_id, user_id, badge_id)
    VALUES (p_user_id, p_user_id::TEXT, 'the_dig')
    ON CONFLICT (profile_id, badge_id) DO NOTHING;
    IF FOUND THEN
      v_new_badges := array_append(v_new_badges, 'the_dig');
    END IF;
  END IF;

  -- Across the Spectrum Badge (10+ different genres)
  IF v_current_user_stats.total_genres_rated_count = 10 THEN
    INSERT INTO user_badges (profile_id, user_id, badge_id)
    VALUES (p_user_id, p_user_id::TEXT, 'across_the_spectrum')
    ON CONFLICT (profile_id, badge_id) DO NOTHING;
    IF FOUND THEN
      v_new_badges := array_append(v_new_badges, 'across_the_spectrum');
    END IF;
  END IF;

  -- First Impressionist Badge (first to rate a song)
  IF v_is_first_rating THEN
    INSERT INTO user_badges (profile_id, user_id, badge_id)
    VALUES (p_user_id, p_user_id::TEXT, 'first_impressionist')
    ON CONFLICT (profile_id, badge_id) DO NOTHING;
    IF FOUND THEN
      v_new_badges := array_append(v_new_badges, 'first_impressionist');
    END IF;
  END IF;

  -- Careful Ear Badge (listened to 50%+ of 100 songs)
  IF v_current_user_stats.total_songs_listened_50_percent_count = 100 THEN
    INSERT INTO user_badges (profile_id, user_id, badge_id)
    VALUES (p_user_id, p_user_id::TEXT, 'careful_ear')
    ON CONFLICT (profile_id, badge_id) DO NOTHING;
    IF FOUND THEN
      v_new_badges := array_append(v_new_badges, 'careful_ear');
    END IF;
  END IF;

  -- Completionist Badge (listened to 100 songs all the way through)
  IF v_current_user_stats.total_songs_listened_100_percent_count = 100 THEN
    INSERT INTO user_badges (profile_id, user_id, badge_id)
    VALUES (p_user_id, p_user_id::TEXT, 'completionist')
    ON CONFLICT (profile_id, badge_id) DO NOTHING;
    IF FOUND THEN
      v_new_badges := array_append(v_new_badges, 'completionist');
    END IF;
  END IF;

  -- Power Listener Badge (1000 songs total)
  IF v_current_user_stats.total_tracks_rated_count = 1000 THEN
    INSERT INTO user_badges (profile_id, user_id, badge_id)
    VALUES (p_user_id, p_user_id::TEXT, 'power_listener')
    ON CONFLICT (profile_id, badge_id) DO NOTHING;
    IF FOUND THEN
      v_new_badges := array_append(v_new_badges, 'power_listener');
    END IF;
  END IF;

  -- Fresh Daily Badge (7-day streak)
  IF v_current_user_stats.current_streak_days = 7 THEN
    INSERT INTO user_badges (profile_id, user_id, badge_id)
    VALUES (p_user_id, p_user_id::TEXT, 'fresh_daily')
    ON CONFLICT (profile_id, badge_id) DO NOTHING;
    IF FOUND THEN
      v_new_badges := array_append(v_new_badges, 'fresh_daily');
    END IF;
  END IF;

  -- The Long Haul Badge (30-day streak)
  IF v_current_user_stats.current_streak_days = 30 THEN
    INSERT INTO user_badges (profile_id, user_id, badge_id)
    VALUES (p_user_id, p_user_id::TEXT, 'the_long_haul')
    ON CONFLICT (profile_id, badge_id) DO NOTHING;
    IF FOUND THEN
      v_new_badges := array_append(v_new_badges, 'the_long_haul');
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'xp_earned', v_xp_earned,
    'new_badges', v_new_badges,
    'action_type', 'rating',
    'daily_streak_xp', v_daily_streak_xp,
    'consecutive_bonus_xp', v_consecutive_bonus_xp
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user leaderboard
CREATE OR REPLACE FUNCTION get_user_leaderboard(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_rank INTEGER;
  v_user_xp INTEGER;
  v_leaderboard JSONB;
  v_start_rank INTEGER;
  v_end_rank INTEGER;
BEGIN
  -- Get user's current rank and XP
  SELECT rank, total_xp INTO v_user_rank, v_user_xp
  FROM (
    SELECT 
      id,
      total_xp,
      ROW_NUMBER() OVER (ORDER BY total_xp DESC, created_at ASC) as rank
    FROM profiles
    WHERE total_xp > 0
  ) ranked_users
  WHERE id = p_user_id;

  -- If user not found or has no XP, return empty result
  IF v_user_rank IS NULL THEN
    RETURN jsonb_build_object(
      'user_rank', 0,
      'user_xp', 0,
      'leaderboard', '[]'::jsonb
    );
  END IF;

  -- Calculate the range to show (user in middle of 5, unless top 2 or bottom 2)
  IF v_user_rank <= 2 THEN
    v_start_rank := 1;
    v_end_rank := 5;
  ELSIF v_user_rank >= (SELECT COUNT(*) FROM profiles WHERE total_xp > 0) - 1 THEN
    v_start_rank := GREATEST(1, (SELECT COUNT(*) FROM profiles WHERE total_xp > 0) - 4);
    v_end_rank := (SELECT COUNT(*) FROM profiles WHERE total_xp > 0);
  ELSE
    v_start_rank := v_user_rank - 2;
    v_end_rank := v_user_rank + 2;
  END IF;

  -- Get the leaderboard data
  SELECT jsonb_agg(
    jsonb_build_object(
      'rank', rank,
      'display_name', COALESCE(display_name, username, 'Anonymous'),
      'total_xp', total_xp,
      'is_current_user', id = p_user_id
    ) ORDER BY rank
  ) INTO v_leaderboard
  FROM (
    SELECT 
      id,
      COALESCE(display_name, username, 'Anonymous') as display_name,
      username,
      total_xp,
      ROW_NUMBER() OVER (ORDER BY total_xp DESC, created_at ASC) as rank
    FROM profiles
    WHERE total_xp > 0
  ) ranked_users
  WHERE rank BETWEEN v_start_rank AND v_end_rank;

  RETURN jsonb_build_object(
    'user_rank', v_user_rank,
    'user_xp', v_user_xp,
    'leaderboard', COALESCE(v_leaderboard, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_gamification_rewards(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_leaderboard(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_daily_streak_xp(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_consecutive_listen_bonus(INTEGER) TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_total_xp ON profiles(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_ratings_listen_percentage ON user_ratings(listen_percentage);
CREATE INDEX IF NOT EXISTS idx_user_ratings_is_blind_rating ON user_ratings(is_blind_rating);
CREATE INDEX IF NOT EXISTS idx_user_ratings_is_outside_preference ON user_ratings(is_outside_preference);
CREATE INDEX IF NOT EXISTS idx_tracks_total_ratings_count ON tracks(total_ratings_count);
CREATE INDEX IF NOT EXISTS idx_tracks_first_rated_by ON tracks(first_rated_by);
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);