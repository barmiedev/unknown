// Music Genres
export const GENRES = [
  'Rock', 'Pop', 'Hip-Hop', 'Electronic', 'Jazz', 'Classical',
  'Folk', 'R&B', 'Country', 'Reggae', 'Blues', 'Punk',
  'Metal', 'Indie', 'Alternative', 'Funk', 'Soul', 'Gospel',
  'Ambient', 'Lo-Fi', 'Psychedelic', 'Experimental'
] as const;

export type Genre = typeof GENRES[number];

// Music Moods
export const MOODS = [
  'Energetic', 'Chill', 'Melancholic', 'Uplifting', 'Aggressive',
  'Romantic', 'Mysterious', 'Nostalgic', 'Experimental', 'Peaceful',
  'Dark', 'Dreamy', 'Intense', 'Playful', 'Contemplative', 'Euphoric'
] as const;

export type Mood = typeof MOODS[number];

// Mood Emojis
export const MOOD_EMOJIS: Record<Mood, string> = {
  'Energetic': '⚡',
  'Chill': '😌',
  'Melancholic': '🌧️',
  'Uplifting': '☀️',
  'Aggressive': '🔥',
  'Romantic': '💕',
  'Mysterious': '🌙',
  'Nostalgic': '🍂',
  'Experimental': '🧪',
  'Peaceful': '🕊️',
  'Dark': '🖤',
  'Dreamy': '☁️',
  'Intense': '💥',
  'Playful': '🎈',
  'Contemplative': '🤔',
  'Euphoric': '🌟'
};

// Genre Emojis (optional - for future use)
export const GENRE_EMOJIS: Record<Genre, string> = {
  'Rock': '🎸',
  'Pop': '🎤',
  'Hip-Hop': '🎧',
  'Electronic': '🎹',
  'Jazz': '🎷',
  'Classical': '🎻',
  'Folk': '🪕',
  'R&B': '🎵',
  'Country': '🤠',
  'Reggae': '🌴',
  'Blues': '🎼',
  'Punk': '⚡',
  'Metal': '🤘',
  'Indie': '🎭',
  'Alternative': '🎨',
  'Funk': '💃',
  'Soul': '❤️',
  'Gospel': '🙏',
  'Ambient': '🌫️',
  'Lo-Fi': '☕',
  'Psychedelic': '🌈',
  'Experimental': '🧪'
}; 