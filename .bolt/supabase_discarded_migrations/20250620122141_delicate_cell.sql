/*
  # Artist Unveiling Schema Update

  1. New Tables
    - `artists` - Store artist information separately from tracks
    - `artist_social_links` - Store artist social media links
    - `track_streaming_links` - Store streaming platform links for tracks
    - `user_artist_subscriptions` - Track user subscriptions to artists
    - `user_streaming_preferences` - Store user's preferred streaming platform

  2. Schema Changes
    - Add artist_id to tracks table
    - Update existing data to create artist records

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies
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

-- Insert sample artists data
INSERT INTO artists (id, name, bio, location, genres, avatar_url) VALUES
('a1111111-1111-1111-1111-111111111111', 'Pixel Dreams', 'Electronic music producer exploring the intersection of digital soundscapes and human emotion. Creating immersive experiences through carefully crafted beats and atmospheric textures.', 'Berlin, Germany', '{"Electronic", "Ambient", "Experimental"}', 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg'),
('a2222222-2222-2222-2222-222222222222', 'Synthwave Collective', 'A collective of artists bringing back the nostalgic sounds of the 80s with a modern twist. Neon-soaked melodies meet cutting-edge production.', 'Los Angeles, CA', '{"Electronic", "Synthwave", "Retro"}', 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg'),
('a3333333-3333-3333-3333-333333333333', 'Code Runner', 'Programmer by day, electronic music producer by night. Blending algorithmic composition with emotional storytelling.', 'Tokyo, Japan', '{"Electronic", "Ambient", "Lo-Fi"}', 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg'),
('a4444444-4444-4444-4444-444444444444', 'The Basement Tapes', 'Raw, unfiltered indie rock from a garage in Portland. Capturing the essence of underground music culture.', 'Portland, OR', '{"Indie", "Rock", "Alternative"}', 'https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg'),
('a5555555-5555-5555-5555-555555555555', 'Static Noise', 'High-energy rock band pushing the boundaries of sound. Loud, proud, and unapologetically raw.', 'Detroit, MI', '{"Rock", "Punk", "Alternative"}', 'https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg'),
('a6666666-6666-6666-6666-666666666666', 'Whisper Lane', 'Intimate acoustic performances that speak to the soul. Coffee shop confessions turned into musical poetry.', 'Nashville, TN', '{"Indie", "Folk", "Acoustic"}', 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg'),
('a7777777-7777-7777-7777-777777777777', 'MC Wordsmith', 'Underground hip-hop artist with a passion for storytelling. Every verse is a journey through urban landscapes.', 'New York, NY', '{"Hip-Hop", "Rap", "Underground"}', 'https://images.pexels.com/photos/1749303/pexels-photo-1749303.jpeg'),
('a8888888-8888-8888-8888-888888888888', 'The Smooth Collective', 'Bringing back the golden age of R&B with modern production. Velvet voices meet contemporary beats.', 'Atlanta, GA', '{"R&B", "Soul", "Neo-Soul"}', 'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg'),
('a9999999-9999-9999-9999-999999999999', 'Forest Path', 'Nature-inspired folk music recorded in remote cabins. Acoustic guitars meet mountain echoes.', 'Colorado Springs, CO', '{"Folk", "Acoustic", "Nature"}', 'https://images.pexels.com/photos/1076758/pexels-photo-1076758.jpeg'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'The Wanderers', 'Traveling musicians collecting stories from around the world. Every song is a postcard from a different place.', 'Various Locations', '{"Folk", "World", "Acoustic"}', 'https://images.pexels.com/photos/1445161/pexels-photo-1445161.jpeg'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'The Late Night Trio', 'Jazz musicians keeping the midnight spirit alive. Smoky venues and intimate performances.', 'New Orleans, LA', '{"Jazz", "Blues", "Traditional"}', 'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Blue Note Collective', 'Modern jazz with a melancholic twist. Saxophone dreams and piano poetry.', 'Chicago, IL', '{"Jazz", "Contemporary", "Experimental"}', 'https://images.pexels.com/photos/1644775/pexels-photo-1644775.jpeg'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Deep Blue', 'Ambient soundscapes inspired by ocean depths. Meditative music for deep contemplation.', 'San Francisco, CA', '{"Ambient", "Meditation", "Experimental"}', 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Urban Soundscape', 'Field recordings meet electronic production. The city as an instrument.', 'London, UK', '{"Ambient", "Electronic", "Field Recording"}', 'https://images.pexels.com/photos/1107717/pexels-photo-1107717.jpeg'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'The Experimenters', 'Pushing the boundaries of what music can be. Sound art meets emotional expression.', 'Montreal, Canada', '{"Experimental", "Alternative", "Avant-garde"}', 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg'),
('gggggggg-gggg-gggg-gggg-gggggggggggg', 'Fragile Sounds', 'Delicate compositions that explore vulnerability and strength. Glass house acoustics.', 'Seattle, WA', '{"Alternative", "Indie", "Experimental"}', 'https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg'),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'Lo-Fi Collective', 'Study beats and chill vibes. Background music for life''s quiet moments.', 'Portland, OR', '{"Lo-Fi", "Chill", "Hip-Hop"}', 'https://images.pexels.com/photos/1181403/pexels-photo-1181403.jpeg'),
('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'Bedroom Producer', 'DIY ethics meet professional sound. Rainy day vibes from a home studio.', 'Austin, TX', '{"Lo-Fi", "Indie", "Bedroom Pop"}', 'https://images.pexels.com/photos/1529659/pexels-photo-1529659.jpeg'),
('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 'The Outcasts', 'Basement punk with a message. Raw energy and social commentary.', 'Philadelphia, PA', '{"Punk", "Hardcore", "Alternative"}', 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg'),
('kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', 'Street Voices', 'Punk rock rebellion with a purpose. Music as a form of protest.', 'Oakland, CA', '{"Punk", "Rock", "Political"}', 'https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg'),
('llllllll-llll-llll-llll-llllllllllll', 'Cosmic Travelers', 'Psychedelic journeys through sound and space. Mind-expanding musical experiences.', 'San Francisco, CA', '{"Psychedelic", "Experimental", "Rock"}', 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg');

-- Update tracks with artist_id references
UPDATE tracks SET artist_id = 'a1111111-1111-1111-1111-111111111111' WHERE title = 'Digital Echoes';
UPDATE tracks SET artist_id = 'a2222222-2222-2222-2222-222222222222' WHERE title = 'Neon Nights';
UPDATE tracks SET artist_id = 'a3333333-3333-3333-3333-333333333333' WHERE title = 'Binary Sunset';
UPDATE tracks SET artist_id = 'a4444444-4444-4444-4444-444444444444' WHERE title = 'Velvet Underground Vibes';
UPDATE tracks SET artist_id = 'a5555555-5555-5555-5555-555555555555' WHERE title = 'Garage Dreams';
UPDATE tracks SET artist_id = 'a6666666-6666-6666-6666-666666666666' WHERE title = 'Coffee Shop Confessions';
UPDATE tracks SET artist_id = 'a7777777-7777-7777-7777-777777777777' WHERE title = 'Underground Cipher';
UPDATE tracks SET artist_id = 'a8888888-8888-8888-8888-888888888888' WHERE title = 'Velvet Soul';
UPDATE tracks SET artist_id = 'a9999999-9999-9999-9999-999999999999' WHERE title = 'Mountain Whispers';
UPDATE tracks SET artist_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' WHERE title = 'Campfire Stories';
UPDATE tracks SET artist_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' WHERE title = 'Midnight Jazz Cafe';
UPDATE tracks SET artist_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' WHERE title = 'Saxophone Dreams';
UPDATE tracks SET artist_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' WHERE title = 'Ocean Depths';
UPDATE tracks SET artist_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' WHERE title = 'City Rain';
UPDATE tracks SET artist_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff' WHERE title = 'Frequency Shift';
UPDATE tracks SET artist_id = 'gggggggg-gggg-gggg-gggg-gggggggggggg' WHERE title = 'Glass House';
UPDATE tracks SET artist_id = 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh' WHERE title = 'Study Session';
UPDATE tracks SET artist_id = 'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii' WHERE title = 'Rainy Day Vibes';
UPDATE tracks SET artist_id = 'jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj' WHERE title = 'Basement Show';
UPDATE tracks SET artist_id = 'kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk' WHERE title = 'Rebellion Rising';
UPDATE tracks SET artist_id = 'llllllll-llll-llll-llll-llllllllllll' WHERE title = 'Kaleidoscope Mind';

-- Insert sample social media links for artists
INSERT INTO artist_social_links (artist_id, platform, url) VALUES
-- Pixel Dreams
('a1111111-1111-1111-1111-111111111111', 'instagram', 'https://instagram.com/pixeldreamsmusic'),
('a1111111-1111-1111-1111-111111111111', 'twitter', 'https://twitter.com/pixeldreams'),
('a1111111-1111-1111-1111-111111111111', 'website', 'https://pixeldreamsmusic.com'),
-- Synthwave Collective
('a2222222-2222-2222-2222-222222222222', 'instagram', 'https://instagram.com/synthwavecollective'),
('a2222222-2222-2222-2222-222222222222', 'twitter', 'https://twitter.com/synthwavecoll'),
('a2222222-2222-2222-2222-222222222222', 'youtube', 'https://youtube.com/synthwavecollective'),
-- Code Runner
('a3333333-3333-3333-3333-333333333333', 'instagram', 'https://instagram.com/coderunnermusic'),
('a3333333-3333-3333-3333-333333333333', 'github', 'https://github.com/coderunner'),
('a3333333-3333-3333-3333-333333333333', 'website', 'https://coderunnermusic.dev'),
-- The Basement Tapes
('a4444444-4444-4444-4444-444444444444', 'instagram', 'https://instagram.com/basementtapesband'),
('a4444444-4444-4444-4444-444444444444', 'facebook', 'https://facebook.com/basementtapes'),
-- Static Noise
('a5555555-5555-5555-5555-555555555555', 'instagram', 'https://instagram.com/staticnoiseband'),
('a5555555-5555-5555-5555-555555555555', 'twitter', 'https://twitter.com/staticnoise'),
-- Whisper Lane
('a6666666-6666-6666-6666-666666666666', 'instagram', 'https://instagram.com/whisperlanemusic'),
('a6666666-6666-6666-6666-666666666666', 'website', 'https://whisperlane.music'),
-- MC Wordsmith
('a7777777-7777-7777-7777-777777777777', 'instagram', 'https://instagram.com/mcwordsmith'),
('a7777777-7777-7777-7777-777777777777', 'twitter', 'https://twitter.com/mcwordsmith'),
-- The Smooth Collective
('a8888888-8888-8888-8888-888888888888', 'instagram', 'https://instagram.com/smoothcollective'),
('a8888888-8888-8888-8888-888888888888', 'facebook', 'https://facebook.com/smoothcollective'),
-- Forest Path
('a9999999-9999-9999-9999-999999999999', 'instagram', 'https://instagram.com/forestpathmusic'),
('a9999999-9999-9999-9999-999999999999', 'website', 'https://forestpath.music'),
-- The Wanderers
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'instagram', 'https://instagram.com/thewanderersband'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'youtube', 'https://youtube.com/thewanderers');

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