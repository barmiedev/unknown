import { GENRES, MOODS, MOOD_EMOJIS, GENRE_EMOJIS, type Genre, type Mood } from './constants';

/**
 * Get a random selection of moods
 * @param count - Number of moods to return
 * @param exclude - Moods to exclude from selection
 * @returns Array of randomly selected moods
 */
export function getRandomMoods(count: number, exclude: Mood[] = []): Mood[] {
  const availableMoods = MOODS.filter(mood => !exclude.includes(mood));
  const shuffled = [...availableMoods].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, availableMoods.length));
}

/**
 * Get a random selection of genres
 * @param count - Number of genres to return
 * @param exclude - Genres to exclude from selection
 * @returns Array of randomly selected genres
 */
export function getRandomGenres(count: number, exclude: Genre[] = []): Genre[] {
  const availableGenres = GENRES.filter(genre => !exclude.includes(genre));
  const shuffled = [...availableGenres].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, availableGenres.length));
}

/**
 * Get mood emoji by mood name
 * @param mood - The mood name
 * @returns The emoji for the mood, or '🎵' as fallback
 */
export function getMoodEmoji(mood: string): string {
  return MOOD_EMOJIS[mood as Mood] || '🎵';
}

/**
 * Get genre emoji by genre name
 * @param genre - The genre name
 * @returns The emoji for the genre, or '🎵' as fallback
 */
export function getGenreEmoji(genre: string): string {
  return GENRE_EMOJIS[genre as Genre] || '🎵';
}

/**
 * Validate if a string is a valid mood
 * @param mood - The mood to validate
 * @returns True if the mood is valid
 */
export function isValidMood(mood: string): mood is Mood {
  return MOODS.includes(mood as Mood);
}

/**
 * Validate if a string is a valid genre
 * @param genre - The genre to validate
 * @returns True if the genre is valid
 */
export function isValidGenre(genre: string): genre is Genre {
  return GENRES.includes(genre as Genre);
}

/**
 * Get moods based on user preferences with fallback to random selection
 * @param userMoods - User's preferred moods
 * @param count - Number of moods to return
 * @returns Array of moods prioritizing user preferences
 */
export function getMoodsForSession(userMoods: Mood[] = [], count: number = 3): Mood[] {
  if (userMoods.length > 0) {
    // Shuffle user's preferred moods and take the requested count
    const shuffledUserMoods = [...userMoods].sort(() => 0.5 - Math.random()).slice(0, count);
    
    // If we don't have enough user moods, fill with random ones
    if (shuffledUserMoods.length < count) {
      const remainingCount = count - shuffledUserMoods.length;
      const randomMoods = getRandomMoods(remainingCount, shuffledUserMoods);
      return [...shuffledUserMoods, ...randomMoods];
    }
    
    return shuffledUserMoods;
  }
  
  // No user preferences, return random moods
  return getRandomMoods(count);
}

/**
 * Get genres based on user preferences with fallback to random selection
 * @param userGenres - User's preferred genres
 * @param count - Number of genres to return
 * @returns Array of genres prioritizing user preferences
 */
export function getGenresForSession(userGenres: Genre[] = [], count: number = 3): Genre[] {
  if (userGenres.length > 0) {
    // Shuffle user's preferred genres and take the requested count
    const shuffledUserGenres = [...userGenres].sort(() => 0.5 - Math.random()).slice(0, count);
    
    // If we don't have enough user genres, fill with random ones
    if (shuffledUserGenres.length < count) {
      const remainingCount = count - shuffledUserGenres.length;
      const randomGenres = getRandomGenres(remainingCount, shuffledUserGenres);
      return [...shuffledUserGenres, ...randomGenres];
    }
    
    return shuffledUserGenres;
  }
  
  // No user preferences, return random genres
  return getRandomGenres(count);
} 