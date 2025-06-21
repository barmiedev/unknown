import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SelectionChip } from '@/components/selection/SelectionChip';
import { colors } from '@/utils/colors';
import { spacing } from '@/utils/spacing';

export type SortOption = 'date_desc' | 'date_asc' | 'title_asc' | 'title_desc' | 'artist_asc' | 'artist_desc';

interface FilterBarProps {
  selectedGenre: string | null;
  selectedMood: string | null;
  selectedSort: SortOption;
  availableGenres: string[];
  availableMoods: string[];
  onGenreChange: (genre: string | null) => void;
  onMoodChange: (mood: string | null) => void;
  onSortChange: (sort: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date_desc', label: 'Newest First' },
  { value: 'date_asc', label: 'Oldest First' },
  { value: 'title_asc', label: 'Song A-Z' },
  { value: 'title_desc', label: 'Song Z-A' },
  { value: 'artist_asc', label: 'Artist A-Z' },
  { value: 'artist_desc', label: 'Artist Z-A' },
];

export function FilterBar({
  selectedGenre,
  selectedMood,
  selectedSort,
  availableGenres,
  availableMoods,
  onGenreChange,
  onMoodChange,
  onSortChange,
}: FilterBarProps) {
  const [showGenres, setShowGenres] = React.useState(false);
  const [showMoods, setShowMoods] = React.useState(false);
  const [showSort, setShowSort] = React.useState(false);

  return (
    <View style={styles.container}>
      {/* Filter Row */}
      <View style={styles.filterRow}>
        {/* Genre Filter */}
        <SelectionChip
          label={selectedGenre || 'All Genres'}
          selected={showGenres}
          onPress={() => {
            setShowGenres(!showGenres);
            setShowMoods(false);
            setShowSort(false);
          }}
          style={styles.filterChip}
        />

        {/* Mood Filter */}
        <SelectionChip
          label={selectedMood || 'All Moods'}
          selected={showMoods}
          onPress={() => {
            setShowMoods(!showMoods);
            setShowGenres(false);
            setShowSort(false);
          }}
          style={styles.filterChip}
        />

        {/* Sort Filter */}
        <SelectionChip
          label={SORT_OPTIONS.find(opt => opt.value === selectedSort)?.label || 'Sort'}
          selected={showSort}
          onPress={() => {
            setShowSort(!showSort);
            setShowGenres(false);
            setShowMoods(false);
          }}
          style={styles.filterChip}
        />
      </View>

      {/* Genre Options */}
      {showGenres && (
        <View style={styles.optionsContainer}>
          <SelectionChip
            label="All Genres"
            selected={selectedGenre === null}
            onPress={() => {
              onGenreChange(null);
              setShowGenres(false);
            }}
            style={styles.optionChip}
          />
          {availableGenres.map((genre) => (
            <SelectionChip
              key={genre}
              label={genre}
              selected={selectedGenre === genre}
              onPress={() => {
                onGenreChange(genre);
                setShowGenres(false);
              }}
              style={styles.optionChip}
            />
          ))}
        </View>
      )}

      {/* Mood Options */}
      {showMoods && (
        <View style={styles.optionsContainer}>
          <SelectionChip
            label="All Moods"
            selected={selectedMood === null}
            onPress={() => {
              onMoodChange(null);
              setShowMoods(false);
            }}
            style={styles.optionChip}
          />
          {availableMoods.map((mood) => (
            <SelectionChip
              key={mood}
              label={mood}
              selected={selectedMood === mood}
              onPress={() => {
                onMoodChange(mood);
                setShowMoods(false);
              }}
              style={styles.optionChip}
            />
          ))}
        </View>
      )}

      {/* Sort Options */}
      {showSort && (
        <View style={styles.optionsContainer}>
          {SORT_OPTIONS.map((option) => (
            <SelectionChip
              key={option.value}
              label={option.label}
              selected={selectedSort === option.value}
              onPress={() => {
                onSortChange(option.value);
                setShowSort(false);
              }}
              style={styles.optionChip}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterChip: {
    flex: 1,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  optionChip: {
    marginBottom: 0,
  },
});