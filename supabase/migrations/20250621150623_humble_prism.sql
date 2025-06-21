/*
  # Add More Sample Tracks for Discovery

  1. Additional Tracks
    - Add 30 more diverse tracks across different genres and moods
    - Ensure variety in preferences to reduce "no tracks available" scenarios
    - Use existing artist IDs and create new ones as needed

  2. Track Variety
    - Cover all mood and genre combinations
    - Different duration ranges
    - Various stream counts under 5K (underground criteria)
*/

-- Insert additional sample tracks
INSERT INTO tracks (title, artist, audio_url, artwork_url, genre, mood, duration, spotify_streams, spotify_url, artist_id) VALUES
-- More Electronic tracks
('Midnight Protocol', 'Pixel Dreams', 'https://example.com/audio/midnight-protocol.mp3', 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg', 'Electronic', 'Dark', 198, 1234, 'https://open.spotify.com/track/midnight-protocol', '01234567-89ab-cdef-0123-456789abcdef'),
('Cyber Drift', 'Code Runner', 'https://example.com/audio/cyber-drift.mp3', 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg', 'Electronic', 'Dreamy', 267, 2847, 'https://open.spotify.com/track/cyber-drift', '23456789-abcd-ef01-2345-6789abcdef01'),
('Data Stream', 'Synthwave Collective', 'https://example.com/audio/data-stream.mp3', 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg', 'Electronic', 'Intense', 189, 3421, 'https://open.spotify.com/track/data-stream', '12345678-9abc-def0-1234-56789abcdef0'),

-- More Indie/Alternative tracks
('Broken Satellites', 'The Basement Tapes', 'https://example.com/audio/broken-satellites.mp3', 'https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg', 'Indie', 'Melancholic', 234, 1876, 'https://open.spotify.com/track/broken-satellites', '3456789a-bcde-f012-3456-789abcdef012'),
('Paper Planes', 'Whisper Lane', 'https://example.com/audio/paper-planes.mp3', 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg', 'Indie', 'Uplifting', 201, 2156, 'https://open.spotify.com/track/paper-planes', '56789abc-def0-1234-5678-9abcdef01234'),
('Static Hearts', 'Static Noise', 'https://example.com/audio/static-hearts.mp3', 'https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg', 'Alternative', 'Romantic', 223, 3294, 'https://open.spotify.com/track/static-hearts', '456789ab-cdef-0123-4567-89abcdef0123'),

-- More Hip-Hop/R&B tracks
('Street Poetry', 'MC Wordsmith', 'https://example.com/audio/street-poetry.mp3', 'https://images.pexels.com/photos/1749303/pexels-photo-1749303.jpeg', 'Hip-Hop', 'Contemplative', 178, 2934, 'https://open.spotify.com/track/street-poetry', '6789abcd-ef01-2345-6789-abcdef012345'),
('Golden Hour', 'The Smooth Collective', 'https://example.com/audio/golden-hour.mp3', 'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg', 'R&B', 'Peaceful', 245, 1567, 'https://open.spotify.com/track/golden-hour', '789abcde-f012-3456-789a-bcdef0123456'),

-- More Folk/Acoustic tracks
('River Song', 'Forest Path', 'https://example.com/audio/river-song.mp3', 'https://images.pexels.com/photos/1076758/pexels-photo-1076758.jpeg', 'Folk', 'Contemplative', 298, 1234, 'https://open.spotify.com/track/river-song', '89abcdef-0123-4567-89ab-cdef01234567'),
('Desert Wind', 'The Wanderers', 'https://example.com/audio/desert-wind.mp3', 'https://images.pexels.com/photos/1445161/pexels-photo-1445161.jpeg', 'Folk', 'Mysterious', 267, 2587, 'https://open.spotify.com/track/desert-wind', '9abcdef0-1234-5678-9abc-def012345678'),

-- More Jazz tracks
('Blue Monday', 'The Late Night Trio', 'https://example.com/audio/blue-monday.mp3', 'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg', 'Jazz', 'Melancholic', 334, 1923, 'https://open.spotify.com/track/blue-monday', 'abcdef01-2345-6789-abcd-ef0123456789'),
('Velvet Dreams', 'Blue Note Collective', 'https://example.com/audio/velvet-dreams.mp3', 'https://images.pexels.com/photos/1644775/pexels-photo-1644775.jpeg', 'Jazz', 'Romantic', 278, 3456, 'https://open.spotify.com/track/velvet-dreams', 'bcdef012-3456-789a-bcde-f01234567890'),

-- More Ambient tracks
('Cosmic Silence', 'Deep Blue', 'https://example.com/audio/cosmic-silence.mp3', 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg', 'Ambient', 'Contemplative', 412, 567, 'https://open.spotify.com/track/cosmic-silence', 'cdef0123-4567-89ab-cdef-012345678901'),
('Urban Meditation', 'Urban Soundscape', 'https://example.com/audio/urban-meditation.mp3', 'https://images.pexels.com/photos/1107717/pexels-photo-1107717.jpeg', 'Ambient', 'Peaceful', 389, 1456, 'https://open.spotify.com/track/urban-meditation', 'def01234-5678-9abc-def0-123456789012'),

-- More Experimental tracks
('Sound Collage', 'The Experimenters', 'https://example.com/audio/sound-collage.mp3', 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg', 'Experimental', 'Mysterious', 298, 2178, 'https://open.spotify.com/track/sound-collage', 'ef012345-6789-abcd-ef01-234567890123'),
('Echo Chamber', 'Fragile Sounds', 'https://example.com/audio/echo-chamber.mp3', 'https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg', 'Alternative', 'Dark', 234, 3821, 'https://open.spotify.com/track/echo-chamber', 'f0123456-789a-bcde-f012-345678901234'),

-- More Lo-Fi tracks
('Coffee Break', 'Lo-Fi Collective', 'https://example.com/audio/coffee-break.mp3', 'https://images.pexels.com/photos/1181403/pexels-photo-1181403.jpeg', 'Lo-Fi', 'Peaceful', 167, 4567, 'https://open.spotify.com/track/coffee-break', '01234567-89ab-cdef-0123-456789abcd00'),
('Night Study', 'Bedroom Producer', 'https://example.com/audio/night-study.mp3', 'https://images.pexels.com/photos/1529659/pexels-photo-1529659.jpeg', 'Lo-Fi', 'Contemplative', 189, 2847, 'https://open.spotify.com/track/night-study', '12345678-9abc-def0-1234-56789abcd001'),

-- More Punk tracks
('Rebel Anthem', 'The Outcasts', 'https://example.com/audio/rebel-anthem.mp3', 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg', 'Punk', 'Energetic', 145, 1847, 'https://open.spotify.com/track/rebel-anthem', '23456789-abcd-ef01-2345-6789abcd0012'),
('Fight the System', 'Street Voices', 'https://example.com/audio/fight-system.mp3', 'https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg', 'Punk', 'Aggressive', 156, 3294, 'https://open.spotify.com/track/fight-system', '3456789a-bcde-f012-3456-789abcd00123'),

-- More Psychedelic tracks
('Mind Expansion', 'Cosmic Travelers', 'https://example.com/audio/mind-expansion.mp3', 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg', 'Psychedelic', 'Euphoric', 378, 1567, 'https://open.spotify.com/track/mind-expansion', '456789ab-cdef-0123-4567-89abcd001234'),

-- Cross-genre experimental tracks
('Genre Bender', 'The Experimenters', 'https://example.com/audio/genre-bender.mp3', 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg', 'Electronic', 'Experimental', 289, 2178, 'https://open.spotify.com/track/genre-bender', 'ef012345-6789-abcd-ef01-234567890123'),
('Fusion Dreams', 'Blue Note Collective', 'https://example.com/audio/fusion-dreams.mp3', 'https://images.pexels.com/photos/1644775/pexels-photo-1644775.jpeg', 'Jazz', 'Experimental', 312, 3456, 'https://open.spotify.com/track/fusion-dreams', 'bcdef012-3456-789a-bcde-f01234567890'),
('Digital Folk', 'Forest Path', 'https://example.com/audio/digital-folk.mp3', 'https://images.pexels.com/photos/1076758/pexels-photo-1076758.jpeg', 'Folk', 'Experimental', 234, 1234, 'https://open.spotify.com/track/digital-folk', '89abcdef-0123-4567-89ab-cdef01234567'),

-- More energetic tracks
('Power Surge', 'Static Noise', 'https://example.com/audio/power-surge.mp3', 'https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg', 'Rock', 'Energetic', 198, 4231, 'https://open.spotify.com/track/power-surge', '456789ab-cdef-0123-4567-89abcdef0123'),
('Electric Pulse', 'Synthwave Collective', 'https://example.com/audio/electric-pulse.mp3', 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg', 'Electronic', 'Energetic', 167, 3421, 'https://open.spotify.com/track/electric-pulse', '12345678-9abc-def0-1234-56789abcdef0'),

-- More uplifting tracks
('Sunrise Melody', 'Whisper Lane', 'https://example.com/audio/sunrise-melody.mp3', 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg', 'Indie', 'Uplifting', 223, 2156, 'https://open.spotify.com/track/sunrise-melody', '56789abc-def0-1234-5678-9abcdef01234'),
('Hope Rising', 'The Wanderers', 'https://example.com/audio/hope-rising.mp3', 'https://images.pexels.com/photos/1445161/pexels-photo-1445161.jpeg', 'Folk', 'Uplifting', 245, 2587, 'https://open.spotify.com/track/hope-rising', '9abcdef0-1234-5678-9abc-def012345678'),

-- More playful tracks
('Bubble Pop', 'Lo-Fi Collective', 'https://example.com/audio/bubble-pop.mp3', 'https://images.pexels.com/photos/1181403/pexels-photo-1181403.jpeg', 'Lo-Fi', 'Playful', 134, 4567, 'https://open.spotify.com/track/bubble-pop', '01234567-89ab-cdef-0123-456789abcd00'),
('Circus Dreams', 'The Experimenters', 'https://example.com/audio/circus-dreams.mp3', 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg', 'Experimental', 'Playful', 198, 2178, 'https://open.spotify.com/track/circus-dreams', 'ef012345-6789-abcd-ef01-234567890123'),

-- More euphoric tracks
('Cloud Nine', 'Cosmic Travelers', 'https://example.com/audio/cloud-nine.mp3', 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg', 'Psychedelic', 'Euphoric', 289, 1567, 'https://open.spotify.com/track/cloud-nine', '456789ab-cdef-0123-4567-89abcd001234'),
('Pure Joy', 'The Smooth Collective', 'https://example.com/audio/pure-joy.mp3', 'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg', 'R&B', 'Euphoric', 234, 2934, 'https://open.spotify.com/track/pure-joy', '789abcde-f012-3456-789a-bcdef0123456');