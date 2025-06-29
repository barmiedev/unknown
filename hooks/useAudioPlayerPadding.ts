import { useAudio } from '@/contexts/AudioContext';
import { spacing } from '@/utils/spacing';
import { useMemo } from 'react';

/**
 * Hook to get the necessary bottom padding for screens when the global audio player is visible
 * @returns Object with paddingBottom value and isPlayerVisible boolean
 */
export function useAudioPlayerPadding() {
  const { isGlobalPlayerVisible } = useAudio();

  // Global audio player height + some spacing
  const playerHeight = 160; // Approximate height of the global player
  const spacing = 16; // Additional spacing

  return useMemo(
    () => ({
      paddingBottom: isGlobalPlayerVisible ? playerHeight + spacing : 0,
      isPlayerVisible: isGlobalPlayerVisible,
    }),
    [isGlobalPlayerVisible],
  );
}
