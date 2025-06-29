import { useAudio } from '@/contexts/AudioContext';
import { spacing } from '@/utils/spacing';
import { useMemo } from 'react';

/**
 * Hook to get the necessary bottom padding for screens when the global audio player is visible
 * @returns Object with paddingBottom value and isPlayerVisible boolean
 */
export function useAudioPlayerPadding() {
  const { isGlobalPlayerVisible, isPlayerExpanded } = useAudio();

  // Global audio player height + some spacing
  const playerHeight = 80; // Approximate height of the global player
  const expandedPlayerAdditionalHeight = isPlayerExpanded ? 80 : 0; // Approximate height of the global player
  const spacing = 16; // Additional spacing

  return useMemo(
    () => ({
      paddingBottom: isGlobalPlayerVisible
        ? playerHeight + expandedPlayerAdditionalHeight + spacing
        : 0,
      isPlayerVisible: isGlobalPlayerVisible,
    }),
    [isGlobalPlayerVisible, isPlayerExpanded],
  );
}
