/*
  # Add spotify_url column to tracks table

  1. Changes
    - Add `spotify_url` column to `tracks` table as optional text field
    - This provides a direct way to store Spotify URLs on tracks for easier querying

  2. Notes
    - This complements the existing `track_streaming_links` table
    - The column is nullable to maintain compatibility with existing data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'spotify_url'
  ) THEN
    ALTER TABLE tracks ADD COLUMN spotify_url text;
  END IF;
END $$;