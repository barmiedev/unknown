/*
  # Populate Track Statistics Data

  1. Data Updates
    - Add realistic in-app stream counts to existing tracks
    - Update streaming links to remove Spotify references
    - Add sample streaming links for other platforms
*/

-- Update existing tracks to add realistic in-app streams
UPDATE tracks SET 
  in_app_streams_count = FLOOR(RANDOM() * 1000) + 50 -- Random streams between 50-1050
WHERE in_app_streams_count = 0;

-- Update track streaming links to remove spotify references if they exist
-- (Keep other platforms like SoundCloud, Bandcamp, etc.)
DELETE FROM track_streaming_links WHERE platform = 'spotify';

-- Update sample tracks data to remove any remaining spotify references
UPDATE tracks SET 
  audio_url = CASE 
    WHEN audio_url LIKE '%spotify%' THEN 'https://example.com/audio/' || LOWER(REPLACE(title, ' ', '-')) || '.mp3'
    ELSE audio_url
  END;

-- Add some sample streaming links for non-Spotify platforms
INSERT INTO track_streaming_links (track_id, platform, url) 
SELECT 
  t.id, 
  'soundcloud', 
  'https://soundcloud.com/' || LOWER(REPLACE(t.artist, ' ', '-')) || '/' || LOWER(REPLACE(t.title, ' ', '-'))
FROM tracks t 
WHERE NOT EXISTS (
  SELECT 1 FROM track_streaming_links tsl 
  WHERE tsl.track_id = t.id AND tsl.platform = 'soundcloud'
)
LIMIT 10;

-- Add some Bandcamp links for indie/alternative tracks
INSERT INTO track_streaming_links (track_id, platform, url) 
SELECT 
  t.id, 
  'bandcamp', 
  'https://' || LOWER(REPLACE(t.artist, ' ', '')) || '.bandcamp.com/track/' || LOWER(REPLACE(t.title, ' ', '-'))
FROM tracks t 
WHERE t.genre IN ('Indie', 'Folk', 'Alternative', 'Punk')
AND NOT EXISTS (
  SELECT 1 FROM track_streaming_links tsl 
  WHERE tsl.track_id = t.id AND tsl.platform = 'bandcamp'
)
LIMIT 15;