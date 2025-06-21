import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SelectionChip } from './SelectionChip';
import { GENRES, type Genre } from '@/utils/constants';
import { spacing } from '@/utils/spacing';

interface GenreSelectorProps {
  selectedGenres: Genre[];
  onGenreToggle: (genre: Genre) => void;
  style?: any;
}

export function GenreSelector({ selectedGenres, onGenreToggle, style }: GenreSelectorProps) {
  return (
    <View style={[styles.container, style]}>
      {GENRES.map((genre) => (
        <SelectionChip
          key={genre}
          label={genre}
          selected={selectedGenres.includes(genre)}
          onPress={() => onGenreToggle(genre)}
          style={styles.genreChip}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genreChip: {
    marginBottom: spacing.sm,
  },
}); 