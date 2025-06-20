/*
  # Artist Unveil Feature Schema

  1. New Tables
    - `artists` - Store artist information and bio
    - `artist_social_links` - Store artist social media links
    - `track_streaming_links` - Store streaming platform links for tracks
    - `user_artist_subscriptions` - Track which artists users follow
    - `user_streaming_preferences` - Store user's preferred streaming platform

  2. Schema Updates
    - Add `artist_id` to tracks table to reference artists

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for public read access and user data management

  4. Sample Data
    - Artists with rich profiles and social links
    - Streaming links for all tracks across multiple platforms
*/

-- Create artists table
CREATE TABLE IF NOT EXISTS artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bio text,
  location text,
  genres text[] DEFAULT '{}',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create artist social links table
CREATE TABLE IF NOT EXISTS artist_social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  platform text NOT NULL, -- 'instagram', 'twitter', 'facebook', 'website', etc.
  url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(artist_id, platform)
);

-- Create track streaming links table
CREATE TABLE IF NOT EXISTS track_streaming_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  platform text NOT NULL, -- 'spotify', 'soundcloud', 'bandcamp', 'apple_music', etc.
  url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(track_id, platform)
);

-- Create user artist subscriptions table
CREATE TABLE IF NOT EXISTS user_artist_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  subscribed_at timestamptz DEFAULT now(),
  discovered_track_id uuid REFERENCES tracks(id),
  UNIQUE(profile_id, artist_id)
);

-- Create user streaming preferences table
CREATE TABLE IF NOT EXISTS user_streaming_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_platform text NOT NULL DEFAULT 'spotify', -- 'spotify', 'apple_music', 'soundcloud', etc.
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(profile_id)
);

-- Add artist_id to tracks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'artist_id'
  ) THEN
    ALTER TABLE tracks ADD COLUMN artist_id uuid REFERENCES artists(id);
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_streaming_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_artist_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaming_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for artists (public read access)
CREATE POLICY "Anyone can read artists"
  ON artists
  FOR SELECT
  TO public
  USING (true);

-- Create policies for artist social links (public read access)
CREATE POLICY "Anyone can read artist social links"
  ON artist_social_links
  FOR SELECT
  TO public
  USING (true);

-- Create policies for track streaming links (public read access)
CREATE POLICY "Anyone can read track streaming links"
  ON track_streaming_links
  FOR SELECT
  TO public
  USING (true);

-- Create policies for user artist subscriptions
CREATE POLICY "Users can read own artist subscriptions"
  ON user_artist_subscriptions
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own artist subscriptions"
  ON user_artist_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete own artist subscriptions"
  ON user_artist_subscriptions
  FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- Create policies for user streaming preferences
CREATE POLICY "Users can read own streaming preferences"
  ON user_streaming_preferences
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own streaming preferences"
  ON user_streaming_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own streaming preferences"
  ON user_streaming_preferences
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_artists_name ON artists(name);
CREATE INDEX IF NOT EXISTS idx_artist_social_links_artist_id ON artist_social_links(artist_id);
CREATE INDEX IF NOT EXISTS idx_track_streaming_links_track_id ON track_streaming_links(track_id);
CREATE INDEX IF NOT EXISTS idx_user_artist_subscriptions_profile_id ON user_artist_subscriptions(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_artist_subscriptions_artist_id ON user_artist_subscriptions(artist_id);
CREATE INDEX IF NOT EXISTS idx_tracks_artist_id ON tracks(artist_id);

-- Insert sample artists data with proper UUIDs
INSERT INTO artists (id, name, bio, location, genres, avatar_url) VALUES
('01234567-89ab-cdef-0123-456789abcdef', 'Pixel Dreams', 'Electronic music producer exploring the intersection of digital soundscapes and human emotion. Creating immersive experiences through carefully crafted beats and atmospheric textures.', 'Berlin, Germany', '{"Electronic", "Ambient", "Experimental"}', 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg'),
('12345678-9abc-def0-1234-56789abcdef0', 'Synthwave Collective', 'A collective of artists bringing back the nostalgic sounds of the 80s with a modern twist. Neon-soaked melodies meet cutting-edge production.', 'Los Angeles, CA', '{"Electronic", "Synthwave", "Retro"}', 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg'),
('23456789-abcd-ef01-2345-6789abcdef01', 'Code Runner', 'Programmer by day, electronic music producer by night. Blending algorithmic composition with emotional storytelling.', 'Tokyo, Japan', '{"Electronic", "Ambient", "Lo-Fi"}', 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg'),
('3456789a-bcde-f012-3456-789abcdef012', 'The Basement Tapes', 'Raw, unfiltered indie rock from a garage in Portland. Capturing the essence of underground music culture.', 'Portland, OR', '{"Indie", "Rock", "Alternative"}', 'https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg'),
('456789ab-cdef-0123-4567-89abcdef0123', 'Static Noise', 'High-energy rock band pushing the boundaries of sound. Loud, proud, and unapologetically raw.', 'Detroit, MI', '{"Rock", "Punk", "Alternative"}', 'https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg'),
('56789abc-def0-1234-5678-9abcdef01234', 'Whisper Lane', 'Intimate acoustic performances that speak to the soul. Coffee shop confessions turned into musical poetry.', 'Nashville, TN', '{"Indie", "Folk", "Acoustic"}', 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg'),
('6789abcd-ef01-2345-6789-abcdef012345', 'MC Wordsmith', 'Underground hip-hop artist with a passion for storytelling. Every verse is a journey through urban landscapes.', 'New York, NY', '{"Hip-Hop", "Rap", "Underground"}', 'https://images.pexels.com/photos/1749303/pexels-photo-1749303.jpeg'),
('789abcde-f012-3456-789a-bcdef0123456', 'The Smooth Collective', 'Bringing back the golden age of R&B with modern production. Velvet voices meet contemporary beats.', 'Atlanta, GA', '{"R&B", "Soul", "Neo-Soul"}', 'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg'),
('89abcdef-0123-4567-89ab-cdef01234567', 'Forest Path', 'Nature-inspired folk music recorded in remote cabins. Acoustic guitars meet mountain echoes.', 'Colorado Springs, CO', '{"Folk", "Acoustic", "Nature"}', 'https://images.pexels.com/photos/1076758/pexels-photo-1076758.jpeg'),
('9abcdef0-1234-5678-9abc-def012345678', 'The Wanderers', 'Traveling musicians collecting stories from around the world. Every song is a postcard from a different place.', 'Various Locations', '{"Folk", "World", "Acoustic"}', 'https://images.pexels.com/photos/1445161/pexels-photo-1445161.jpeg'),
('abcdef01-2345-6789-abcd-ef0123456789', 'The Late Night Trio', 'Jazz musicians keeping the midnight spirit alive. Smoky venues and intimate performances.', 'New Orleans, LA', '{"Jazz", "Blues", "Traditional"}', 'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg'),
('bcdef012-3456-789a-bcde-f01234567890', 'Blue Note Collective', 'Modern jazz with a melancholic twist. Saxophone dreams and piano poetry.', 'Chicago, IL', '{"Jazz", "Contemporary", "Experimental"}', 'https://images.pexels.com/photos/1644775/pexels-photo-1644775.jpeg'),
('cdef0123-4567-89ab-cdef-012345678901', 'Deep Blue', 'Ambient soundscapes inspired by ocean depths. Meditative music for deep contemplation.', 'San Francisco, CA', '{"Ambient", "Meditation", "Experimental"}', 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg'),
('def01234-5678-9abc-def0-123456789012', 'Urban Soundscape', 'Field recordings meet electronic production. The city as an instrument.', 'London, UK', '{"Ambient", "Electronic", "Field Recording"}', 'https://images.pexels.com/photos/1107717/pexels-photo-1107717.jpeg'),
('ef012345-6789-abcd-ef01-234567890123', 'The Experimenters', 'Pushing the boundaries of what music can be. Sound art meets emotional expression.', 'Montreal, Canada', '{"Experimental", "Alternative", "Avant-garde"}', 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg'),
('f0123456-789a-bcde-f012-345678901234', 'Fragile Sounds', 'Delicate compositions that explore vulnerability and strength. Glass house acoustics.', 'Seattle, WA', '{"Alternative", "Indie", "Experimental"}', 'https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg'),
('01234567-89ab-cdef-0123-456789abcd00', 'Lo-Fi Collective', 'Study beats and chill vibes. Background music for life''s quiet moments.', 'Portland, OR', '{"Lo-Fi", "Chill", "Hip-Hop"}', 'https://images.pexels.com/photos/1181403/pexels-photo-1181403.jpeg'),
('12345678-9abc-def0-1234-56789abcd001', 'Bedroom Producer', 'DIY ethics meet professional sound. Rainy day vibes from a home studio.', 'Austin, TX', '{"Lo-Fi", "Indie", "Bedroom Pop"}', 'https://images.pexels.com/photos/1529659/pexels-photo-1529659.jpeg'),
('23456789-abcd-ef01-2345-6789abcd0012', 'The Outcasts', 'Basement punk with a message. Raw energy and social commentary.', 'Philadelphia, PA', '{"Punk", "Hardcore", "Alternative"}', 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg'),
('3456789a-bcde-f012-3456-789abcd00123', 'Street Voices', 'Punk rock rebellion with a purpose. Music as a form of protest.', 'Oakland, CA', '{"Punk", "Rock", "Political"}', 'https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg'),
('456789ab-cdef-0123-4567-89abcd001234', 'Cosmic Travelers', 'Psychedelic journeys through sound and space. Mind-expanding musical experiences.', 'San Francisco, CA', '{"Psychedelic", "Experimental", "Rock"}', 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg');

-- Update tracks with artist_id references
UPDATE tracks SET artist_id = '01234567-89ab-cdef-0123-456789abcdef' WHERE title = 'Digital Echoes';
UPDATE tracks SET artist_id = '12345678-9abc-def0-1234-56789abcdef0' WHERE title = 'Neon Nights';
UPDATE tracks SET artist_id = '23456789-abcd-ef01-2345-6789abcdef01' WHERE title = 'Binary Sunset';
UPDATE tracks SET artist_id = '3456789a-bcde-f012-3456-789abcdef012' WHERE title = 'Velvet Underground Vibes';
UPDATE tracks SET artist_id = '456789ab-cdef-0123-4567-89abcdef0123' WHERE title = 'Garage Dreams';
UPDATE tracks SET artist_id = '56789abc-def0-1234-5678-9abcdef01234' WHERE title = 'Coffee Shop Confessions';
UPDATE tracks SET artist_id = '6789abcd-ef01-2345-6789-abcdef012345' WHERE title = 'Underground Cipher';
UPDATE tracks SET artist_id = '789abcde-f012-3456-789a-bcdef0123456' WHERE title = 'Velvet Soul';
UPDATE tracks SET artist_id = '89abcdef-0123-4567-89ab-cdef01234567' WHERE title = 'Mountain Whispers';
UPDATE tracks SET artist_id = '9abcdef0-1234-5678-9abc-def012345678' WHERE title = 'Campfire Stories';
UPDATE tracks SET artist_id = 'abcdef01-2345-6789-abcd-ef0123456789' WHERE title = 'Midnight Jazz Cafe';
UPDATE tracks SET artist_id = 'bcdef012-3456-789a-bcde-f01234567890' WHERE title = 'Saxophone Dreams';
UPDATE tracks SET artist_id = 'cdef0123-4567-89ab-cdef-012345678901' WHERE title = 'Ocean Depths';
UPDATE tracks SET artist_id = 'def01234-5678-9abc-def0-123456789012' WHERE title = 'City Rain';
UPDATE tracks SET artist_id = 'ef012345-6789-abcd-ef01-234567890123' WHERE title = 'Frequency Shift';
UPDATE tracks SET artist_id = 'f0123456-789a-bcde-f012-345678901234' WHERE title = 'Glass House';
UPDATE tracks SET artist_id = '01234567-89ab-cdef-0123-456789abcd00' WHERE title = 'Study Session';
UPDATE tracks SET artist_id = '12345678-9abc-def0-1234-56789abcd001' WHERE title = 'Rainy Day Vibes';
UPDATE tracks SET artist_id = '23456789-abcd-ef01-2345-6789abcd0012' WHERE title = 'Basement Show';
UPDATE tracks SET artist_id = '3456789a-bcde-f012-3456-789abcd00123' WHERE title = 'Rebellion Rising';
UPDATE tracks SET artist_id = '456789ab-cdef-0123-4567-89abcd001234' WHERE title = 'Kaleidoscope Mind';

-- Insert sample social media links for artists
INSERT INTO artist_social_links (artist_id, platform, url) VALUES
-- Pixel Dreams
('01234567-89ab-cdef-0123-456789abcdef', 'instagram', 'https://instagram.com/pixeldreamsmusic'),
('01234567-89ab-cdef-0123-456789abcdef', 'twitter', 'https://twitter.com/pixeldreams'),
('01234567-89ab-cdef-0123-456789abcdef', 'website', 'https://pixeldreamsmusic.com'),
-- Synthwave Collective
('12345678-9abc-def0-1234-56789abcdef0', 'instagram', 'https://instagram.com/synthwavecollective'),
('12345678-9abc-def0-1234-56789abcdef0', 'twitter', 'https://twitter.com/synthwavecoll'),
('12345678-9abc-def0-1234-56789abcdef0', 'youtube', 'https://youtube.com/synthwavecollective'),
-- Code Runner
('23456789-abcd-ef01-2345-6789abcdef01', 'instagram', 'https://instagram.com/coderunnermusic'),
('23456789-abcd-ef01-2345-6789abcdef01', 'github', 'https://github.com/coderunner'),
('23456789-abcd-ef01-2345-6789abcdef01', 'website', 'https://coderunnermusic.dev'),
-- The Basement Tapes
('3456789a-bcde-f012-3456-789abcdef012', 'instagram', 'https://instagram.com/basementtapesband'),
('3456789a-bcde-f012-3456-789abcdef012', 'facebook', 'https://facebook.com/basementtapes'),
-- Static Noise
('456789ab-cdef-0123-4567-89abcdef0123', 'instagram', 'https://instagram.com/staticnoiseband'),
('456789ab-cdef-0123-4567-89abcdef0123', 'twitter', 'https://twitter.com/staticnoise'),
-- Whisper Lane
('56789abc-def0-1234-5678-9abcdef01234', 'instagram', 'https://instagram.com/whisperlanemusic'),
('56789abc-def0-1234-5678-9abcdef01234', 'website', 'https://whisperlane.music'),
-- MC Wordsmith
('6789abcd-ef01-2345-6789-abcdef012345', 'instagram', 'https://instagram.com/mcwordsmith'),
('6789abcd-ef01-2345-6789-abcdef012345', 'twitter', 'https://twitter.com/mcwordsmith'),
-- The Smooth Collective
('789abcde-f012-3456-789a-bcdef0123456', 'instagram', 'https://instagram.com/smoothcollective'),
('789abcde-f012-3456-789a-bcdef0123456', 'facebook', 'https://facebook.com/smoothcollective'),
-- Forest Path
('89abcdef-0123-4567-89ab-cdef01234567', 'instagram', 'https://instagram.com/forestpathmusic'),
('89abcdef-0123-4567-89ab-cdef01234567', 'website', 'https://forestpath.music'),
-- The Wanderers
('9abcdef0-1234-5678-9abc-def012345678', 'instagram', 'https://instagram.com/thewanderersband'),
('9abcdef0-1234-5678-9abc-def012345678', 'youtube', 'https://youtube.com/thewanderers');

-- Insert sample streaming links for tracks
INSERT INTO track_streaming_links (track_id, platform, url) 
SELECT t.id, 'spotify', 'https://open.spotify.com/track/' || LOWER(REPLACE(t.title, ' ', '-'))
FROM tracks t;

INSERT INTO track_streaming_links (track_id, platform, url) 
SELECT t.id, 'apple_music', 'https://music.apple.com/album/' || LOWER(REPLACE(t.title, ' ', '-'))
FROM tracks t;

INSERT INTO track_streaming_links (track_id, platform, url) 
SELECT t.id, 'soundcloud', 'https://soundcloud.com/' || LOWER(REPLACE(t.artist, ' ', '-')) || '/' || LOWER(REPLACE(t.title, ' ', '-'))
FROM tracks t;

-- Add some bandcamp links for indie artists
INSERT INTO track_streaming_links (track_id, platform, url) 
SELECT t.id, 'bandcamp', 'https://' || LOWER(REPLACE(t.artist, ' ', '')) || '.bandcamp.com/track/' || LOWER(REPLACE(t.title, ' ', '-'))
FROM tracks t 
WHERE t.genre IN ('Indie', 'Folk', 'Alternative', 'Punk');