/*
  # Remove Spotify Streams and Add Internal Tracking Fields

  1. Database Changes
    - Remove spotify_streams column from tracks table
    - Remove spotify_url column from tracks table (since we're not using Spotify integration)
    - Add in_app_streams_count for tracking internal plays
    - Add reviews_data JSONB array for storing all reviews with ratings
    - Update existing track statistics

  2. Data Migration
    - Safely remove spotify-related columns
    - Initialize new tracking fields with default values
*/

-- Remove spotify-related columns from tracks table
DO $$
BEGIN
  -- Remove spotify_streams column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'spotify_streams'
  ) THEN
    ALTER TABLE tracks DROP COLUMN spotify_streams;
  END IF;

  -- Remove spotify_url column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'spotify_url'
  ) THEN
    ALTER TABLE tracks DROP COLUMN spotify_url;
  END IF;
END $$;

-- Add new internal tracking columns
DO $$
BEGIN
  -- Add in_app_streams_count for tracking internal plays
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'in_app_streams_count'
  ) THEN
    ALTER TABLE tracks ADD COLUMN in_app_streams_count INTEGER DEFAULT 0;
  END IF;

  -- Add reviews_data JSONB array for storing all reviews with ratings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'reviews_data'
  ) THEN
    ALTER TABLE tracks ADD COLUMN reviews_data JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_tracks_in_app_streams_count ON tracks(in_app_streams_count DESC);
CREATE INDEX IF NOT EXISTS idx_tracks_reviews_data ON tracks USING GIN(reviews_data);

-- Create function to update track statistics when a rating is added
CREATE OR REPLACE FUNCTION update_track_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total_ratings_count, average_rating, and reviews_data
  UPDATE tracks
  SET
    total_ratings_count = (
      SELECT COUNT(*)
      FROM user_ratings
      WHERE track_id = NEW.track_id
    ),
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM user_ratings
      WHERE track_id = NEW.track_id
    ),
    reviews_data = (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'rating', rating,
            'review_text', review_text,
            'created_at', created_at,
            'user_id', user_id,
            'is_blind_rating', COALESCE(is_blind_rating, false),
            'is_outside_preference', COALESCE(is_outside_preference, false),
            'listen_percentage', COALESCE(listen_percentage, 0)
          )
          ORDER BY created_at DESC
        ),
        '[]'::jsonb
      )
      FROM user_ratings
      WHERE track_id = NEW.track_id
    ),
    last_rated_at = now()
  WHERE id = NEW.track_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update track statistics
DROP TRIGGER IF EXISTS trigger_update_track_statistics ON user_ratings;
CREATE TRIGGER trigger_update_track_statistics
  AFTER INSERT OR UPDATE ON user_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_track_statistics();

-- Create function to increment in-app streams count
CREATE OR REPLACE FUNCTION increment_track_streams(track_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE tracks
  SET in_app_streams_count = in_app_streams_count + 1
  WHERE id = track_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_track_streams(UUID) TO authenticated;

-- Populate reviews_data for existing ratings
UPDATE tracks
SET reviews_data = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'rating', ur.rating,
        'review_text', ur.review_text,
        'created_at', ur.created_at,
        'user_id', ur.user_id,
        'is_blind_rating', COALESCE(ur.is_blind_rating, false),
        'is_outside_preference', COALESCE(ur.is_outside_preference, false),
        'listen_percentage', COALESCE(ur.listen_percentage, 0)
      )
      ORDER BY ur.created_at DESC
    ),
    '[]'::jsonb
  )
  FROM user_ratings ur
  WHERE ur.track_id = tracks.id
)
WHERE EXISTS (
  SELECT 1 FROM user_ratings ur WHERE ur.track_id = tracks.id
);