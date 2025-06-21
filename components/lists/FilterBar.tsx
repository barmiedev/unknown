import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, ChevronDown } from 'lucide-react-native';
import { SelectionChip } from '@/components/selection/SelectionChip';
import { Text } from '@/components/typography/Text';
import { Heading } from '@/components/typography/Heading';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';
import { getMoodEmoji, getGenreEmoji } from '@/utils/music';

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
  { value: 'date_desc', label: 'Newest' },
  { value: 'date_asc', label: 'Oldest' },
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
  const [showGenreModal, setShowGenreModal] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  const isGenreFiltered = selectedGenre !== null;
  const isMoodFiltered = selectedMood !== null;
  const isSortFiltered = selectedSort !== 'date_desc';

  const FilterButton = ({ 
    label, 
    onPress, 
    isActive, 
    isFiltered 
  }: { 
    label: string; 
    onPress: () => void; 
    isActive: boolean; 
    isFiltered: boolean; 
  }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        isActive && styles.filterButtonActive,
        isFiltered && styles.filterButtonFiltered,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.filterButtonContent}>
        <View style={styles.textContainer}>
          <Text 
            variant="body" 
            color="primary"
            style={styles.filterButtonText}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {label}
          </Text>
        </View>
        <ChevronDown 
          size={14} 
          color={colors.text.primary} 
          strokeWidth={2}
          style={styles.chevronIcon}
        />
      </View>
    </TouchableOpacity>
  );

  const FilterModal = ({ 
    visible, 
    onClose, 
    title, 
    children 
  }: { 
    visible: boolean; 
    onClose: () => void; 
    title: string; 
    children: React.ReactNode; 
  }) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Heading variant="h4" color="primary">{title}</Heading>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalCloseButton}
            >
              <X size={24} color={colors.text.secondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.modalOptions}>
              {children}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Filter Row */}
      <View style={styles.filterRow}>
        {/* Genre Filter */}
        <FilterButton
          label={selectedGenre || 'Genres'}
          onPress={() => setShowGenreModal(true)}
          isActive={showGenreModal}
          isFiltered={isGenreFiltered}
        />

        {/* Mood Filter */}
        <FilterButton
          label={selectedMood || 'Moods'}
          onPress={() => setShowMoodModal(true)}
          isActive={showMoodModal}
          isFiltered={isMoodFiltered}
        />

        {/* Sort Filter */}
        <FilterButton
          label={SORT_OPTIONS.find(opt => opt.value === selectedSort)?.label || 'Sort'}
          onPress={() => setShowSortModal(true)}
          isActive={showSortModal}
          isFiltered={isSortFiltered}
        />
      </View>

      {/* Genre Modal */}
      <FilterModal
        visible={showGenreModal}
        onClose={() => setShowGenreModal(false)}
        title="Filter by Genre"
      >
        <SelectionChip
          label="All Genres"
          selected={selectedGenre === null}
          onPress={() => {
            onGenreChange(null);
            setShowGenreModal(false);
          }}
          style={styles.modalOptionChip}
        />
        {availableGenres.map((genre) => (
          <SelectionChip
            key={genre}
            label={`${getGenreEmoji(genre)} ${genre}`}
            selected={selectedGenre === genre}
            onPress={() => {
              onGenreChange(genre);
              setShowGenreModal(false);
            }}
            style={styles.modalOptionChip}
          />
        ))}
      </FilterModal>

      {/* Mood Modal */}
      <FilterModal
        visible={showMoodModal}
        onClose={() => setShowMoodModal(false)}
        title="Filter by Mood"
      >
        <SelectionChip
          label="All Moods"
          selected={selectedMood === null}
          onPress={() => {
            onMoodChange(null);
            setShowMoodModal(false);
          }}
          style={styles.modalOptionChip}
        />
        {availableMoods.map((mood) => (
          <SelectionChip
            key={mood}
            label={`${getMoodEmoji(mood)} ${mood}`}
            selected={selectedMood === mood}
            onPress={() => {
              onMoodChange(mood);
              setShowMoodModal(false);
            }}
            style={styles.modalOptionChip}
          />
        ))}
      </FilterModal>

      {/* Sort Modal */}
      <FilterModal
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
        title="Sort by"
      >
        {SORT_OPTIONS.map((option) => (
          <SelectionChip
            key={option.value}
            label={option.label}
            selected={selectedSort === option.value}
            onPress={() => {
              onSortChange(option.value);
              setShowSortModal(false);
            }}
            style={styles.modalOptionChip}
          />
        ))}
      </FilterModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  filterButton: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    height: 40,
    overflow: 'hidden', // Add overflow hidden to button
  },
  filterButtonActive: {
    borderColor: colors.text.secondary,
  },
  filterButtonFiltered: {
    backgroundColor: colors.primary,
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    overflow: 'hidden', // Add overflow hidden to content
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.xs,
    overflow: 'hidden',
    minWidth: 0, // Critical: allows flex child to shrink below content size
  },
  filterButtonText: {
    fontSize: 13,
    textAlign: 'left',
    overflow: 'hidden', // Add overflow hidden to text style
  },
  chevronIcon: {
    flexShrink: 0,
    width: 14,
    height: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalOptions: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalOptionChip: {
    marginBottom: 0,
  },
});