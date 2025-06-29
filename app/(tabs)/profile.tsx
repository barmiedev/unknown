import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { LogOut, ChevronRight, X, Music, Heart, Headphones, User, Save } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useAudioPlayerPadding } from '@/hooks/useAudioPlayerPadding';
import { Screen } from '@/components/layout/Screen';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { Button } from '@/components/buttons/Button';
import { SelectionChip } from '@/components/selection/SelectionChip';
import { TextInput } from '@/components/inputs/TextInput';
import { PasswordInput } from '@/components/inputs/PasswordInput';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';
import { TabHeader } from '@/components/navigation';
import { 
  PLATFORM_NAMES, 
  PLATFORM_COLORS, 
  DEFAULT_STREAMING_PLATFORM 
} from '@/lib/platforms';
import { GENRES, MOODS } from '@/utils/constants';
import { useAudio } from '@/contexts/AudioContext';
import { 
  useUserPreferences, 
  useUserStreamingPreferences, 
  useUpdateUserPreferences, 
  useUpdateStreamingPreferences,
  useDiscoveryStats,
  useUpdateProfile,
  useUpdatePassword
} from '@/lib/queries';

const STREAMING_PLATFORMS = Object.entries(PLATFORM_NAMES).map(([id, name]) => ({
  id,
  name,
  color: PLATFORM_COLORS[id as keyof typeof PLATFORM_COLORS],
}));

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { stop } = useAudio();
  const { paddingBottom } = useAudioPlayerPadding();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [preferredPlatform, setPreferredPlatform] = useState<string>(DEFAULT_STREAMING_PLATFORM);
  
  // Modal states
  const [showGenreModal, setShowGenreModal] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  // Account settings states
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Tanstack Query hooks
  const { data: userPreferences, isLoading: preferencesLoading } = useUserPreferences(user?.id);
  const { data: streamingPreferences } = useUserStreamingPreferences(user?.id);
  const { data: discoveryStats } = useDiscoveryStats(user?.id);
  
  const updatePreferencesMutation = useUpdateUserPreferences();
  const updateStreamingMutation = useUpdateStreamingPreferences();
  const updateProfileMutation = useUpdateProfile();
  const updatePasswordMutation = useUpdatePassword();

  const loading = preferencesLoading;

  useEffect(() => {
    if (userPreferences) {
      setSelectedGenres(userPreferences.preferred_genres || []);
      setSelectedMoods(userPreferences.preferred_moods || []);
    }
  }, [userPreferences]);

  useEffect(() => {
    if (streamingPreferences) {
      setPreferredPlatform(streamingPreferences.preferred_platform);
    }
  }, [streamingPreferences]);

  useEffect(() => {
    if (user?.profile?.display_name) {
      setDisplayName(user.profile.display_name);
    }
  }, [user]);

  const savePreferences = async () => {
    if (!user?.id) return;

    try {
      await updatePreferencesMutation.mutateAsync({
        userId: user.id,
        preferences: {
          preferred_genres: selectedGenres,
          preferred_moods: selectedMoods,
          min_duration: 60,
          max_duration: 300,
        },
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const saveStreamingPreferences = async () => {
    if (!user?.id) return;

    try {
      await updateStreamingMutation.mutateAsync({
        userId: user.id,
        platform: preferredPlatform,
      });
    } catch (error) {
      console.error('Error saving streaming preferences:', error);
    }
  };

  const saveAccountSettings = async () => {
    if (!user?.id) return;

    try {
      // Update display name if changed
      if (displayName !== user.profile?.display_name) {
        await updateProfileMutation.mutateAsync({ display_name: displayName });
      }

      // Update password if provided
      if (newPassword && newPassword === confirmPassword) {
        await updatePasswordMutation.mutateAsync(newPassword);
        
        // Clear password fields
        setNewPassword('');
        setConfirmPassword('');
      }

      setShowAccountModal(false);
    } catch (error) {
      console.error('Error saving account settings:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(() => stop());
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const toggleMood = (mood: string) => {
    setSelectedMoods(prev => 
      prev.includes(mood) 
        ? prev.filter(m => m !== mood)
        : [...prev, mood]
    );
  };

  const handleGenreModalClose = (save: boolean) => () => {
    setShowGenreModal(false);
    if (save) {
      savePreferences();
    }
  };

  const handleMoodModalClose = (save: boolean) => () => {
    setShowMoodModal(false);
    if (save) {
      savePreferences();
    }
  };

  const handlePlatformModalClose = (save: boolean) => () => {
    setShowPlatformModal(false);
    if (save) {
      saveStreamingPreferences();
    }
  };

  if (loading) {
    return (
      <Screen withoutBottomSafeArea>
        <View style={styles.loadingContainer}>
          <Text variant="body" color="primary">Loading profile...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen 
      scrollable 
      paddingHorizontal={24} 
      withoutBottomSafeArea
      contentContainerStyle={{ paddingBottom }}
    >
      <TabHeader
        title={user?.profile?.display_name || user?.profile?.username || 'Profile'}
        subtitle="Manage your account and preferences"
      />

      {/* Discovery Stats */}
      <View style={styles.section}>
        <Heading variant="h4" color="primary" style={styles.sectionTitle}>
          Discovery Stats
        </Heading>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text variant="button" color="primary" style={styles.statValue}>
              {discoveryStats?.totalTracks || 0}
            </Text>
            <Text variant="caption" color="secondary">Tracks Rated</Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="button" color="primary" style={styles.statValue}>
              {discoveryStats?.averageRating.toFixed(1) || '0.0'}
            </Text>
            <Text variant="caption" color="secondary">Avg Rating</Text>
          </View>
        </View>
      </View>

      {/* Discovery Preferences */}
      <View style={styles.section}>
        <Heading variant="h4" color="primary" style={styles.sectionTitle}>
          Discovery Preferences
        </Heading>
        
        <Button
          variant="setting"
          size="medium"
          onPress={() => setShowGenreModal(true)}
          icon={<Music size={20} color={colors.text.primary} strokeWidth={2} />}
          iconPosition="left"
        >
          <View style={styles.settingContent}>
            <View style={styles.settingTextContainer}>
              <Text variant="body" color="primary" style={styles.settingTitle}>
                Genres
              </Text>
              <Text variant="caption" color="secondary" style={styles.settingSubtitle}>
                {selectedGenres.length > 0 ? `${selectedGenres.length} selected` : 'None selected'}
              </Text>
            </View>
            <ChevronRight size={16} color={colors.text.secondary} strokeWidth={2} />
          </View>
        </Button>
        
        <Button
          variant="setting"
          size="medium"
          onPress={() => setShowMoodModal(true)}
          icon={<Heart size={20} color={colors.text.primary} strokeWidth={2} />}
          iconPosition="left"
        >
          <View style={styles.settingContent}>
            <View style={styles.settingTextContainer}>
              <Text variant="body" color="primary" style={styles.settingTitle}>
                Moods
              </Text>
              <Text variant="caption" color="secondary" style={styles.settingSubtitle}>
                {selectedMoods.length > 0 ? `${selectedMoods.length} selected` : 'None selected'}
              </Text>
            </View>
            <ChevronRight size={16} color={colors.text.secondary} strokeWidth={2} />
          </View>
        </Button>
        
        <Button
          variant="setting"
          size="medium"
          onPress={() => setShowPlatformModal(true)}
          icon={<Headphones size={20} color={colors.text.primary} strokeWidth={2} />}
          iconPosition="left"
        >
          <View style={styles.settingContent}>
            <View style={styles.settingTextContainer}>
              <Text variant="body" color="primary" style={styles.settingTitle}>
                Streaming Platform
              </Text>
              <Text variant="caption" color="secondary" style={styles.settingSubtitle}>
                {PLATFORM_NAMES[preferredPlatform as keyof typeof PLATFORM_NAMES] || preferredPlatform}
              </Text>
            </View>
            <ChevronRight size={16} color={colors.text.secondary} strokeWidth={2} />
          </View>
        </Button>
      </View>

      {/* Account Settings */}
      <View style={[styles.section, styles.lastSection]}>
        <Heading variant="h4" color="primary" style={styles.sectionTitle}>
          Account
        </Heading>
        
        <Button
          variant="setting"
          size="medium"
          onPress={() => setShowAccountModal(true)}
          icon={<User size={20} color={colors.text.primary} strokeWidth={2} />}
          iconPosition="left"
        >
          <View style={styles.settingContent}>
            <View style={styles.settingTextContainer}>
              <Text variant="body" color="primary" style={styles.settingTitle}>
                Account Settings
              </Text>
            </View>
            <ChevronRight size={16} color={colors.text.secondary} strokeWidth={2} />
          </View>
        </Button>
        
        <Button 
          variant="setting" 
          size="medium" 
          onPress={handleSignOut}
          icon={<LogOut size={20} color={colors.text.primary} strokeWidth={2} />}
          iconPosition="left"
        >
          <View style={styles.settingContent}>
            <View style={styles.settingTextContainer}>
              <Text variant="body" style={styles.settingTitle}>
                Sign Out
              </Text>
            </View>
            <ChevronRight size={16} color={colors.status.error} strokeWidth={2} />
          </View>
        </Button>
      </View>

      {/* Genre Modal */}
      <Modal
        visible={showGenreModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleGenreModalClose(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Heading variant="h4" color="primary">Select Genres</Heading>
              <TouchableOpacity
                onPress={handleGenreModalClose(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color={colors.text.secondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.modalOptionsGrid}>
                {GENRES.map((genre) => (
                  <SelectionChip
                    key={genre}
                    label={genre}
                    selected={selectedGenres.includes(genre)}
                    onPress={() => toggleGenre(genre)}
                    style={styles.modalOptionChip}
                  />
                ))}
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <Button
                variant="primary"
                size="medium"
                onPress={handleGenreModalClose(true)}
                loading={updatePreferencesMutation.isPending}
                icon={<Save size={20} color={colors.text.primary} strokeWidth={2} />}
                iconPosition="left"
              >
                Save Preferences
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Mood Modal */}
      <Modal
        visible={showMoodModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleMoodModalClose(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Heading variant="h4" color="primary">Select Moods</Heading>
              <TouchableOpacity
                onPress={handleMoodModalClose(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color={colors.text.secondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.modalOptionsGrid}>
                {MOODS.map((mood) => (
                  <SelectionChip
                    key={mood}
                    label={mood}
                    selected={selectedMoods.includes(mood)}
                    onPress={() => toggleMood(mood)}
                    style={styles.modalOptionChip}
                  />
                ))}
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <Button
                variant="primary"
                size="medium"
                onPress={handleMoodModalClose(true)}
                loading={updatePreferencesMutation.isPending}
                icon={<Save size={20} color={colors.text.primary} strokeWidth={2} />}
                iconPosition="left"
              >
                Save Preferences
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Platform Modal */}
      <Modal
        visible={showPlatformModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handlePlatformModalClose(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Heading variant="h4" color="primary">Streaming Platform</Heading>
              <TouchableOpacity
                onPress={handlePlatformModalClose(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color={colors.text.secondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.modalOptionsGrid}>
                {STREAMING_PLATFORMS.map((platform) => (
                  <SelectionChip
                    key={platform.id}
                    label={platform.name}
                    selected={preferredPlatform === platform.id}
                    onPress={() => setPreferredPlatform(platform.id)}
                    style={styles.modalOptionChip}
                  />
                ))}
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <Button
                variant="primary"
                size="medium"
                onPress={handlePlatformModalClose(true)}
                loading={updateStreamingMutation.isPending}
                icon={<Save size={20} color={colors.text.primary} strokeWidth={2} />}
                iconPosition="left"
              >
                Save Preferences
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Account Settings Modal */}
      <Modal
        visible={showAccountModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Heading variant="h4" color="primary">Account Settings</Heading>
              <TouchableOpacity
                onPress={() => setShowAccountModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color={colors.text.secondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.accountForm}>
                <View style={styles.formSection}>
                  <Text variant="body" color="primary" style={styles.formLabel}>
                    Display Name
                  </Text>
                  <TextInput
                    placeholder="Enter your display name"
                    value={displayName}
                    onChangeText={setDisplayName}
                    icon={<User size={20} color={colors.text.secondary} strokeWidth={2} />}
                  />
                </View>

                <View style={styles.formSection}>
                  <Text variant="body" color="primary" style={styles.formLabel}>
                    Change Password
                  </Text>
                  <PasswordInput
                    placeholder="New password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <PasswordInput
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <Button
                variant="primary"
                size="medium"
                onPress={saveAccountSettings}
                loading={updateProfileMutation.isPending || updatePasswordMutation.isPending}
                icon={<Save size={20} color={colors.text.primary} strokeWidth={2} />}
                iconPosition="left"
              >
                Save Changes
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  lastSection: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  settingTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  settingTitle: {
    fontSize: 16,
  },
  settingSubtitle: {
    fontSize: 14,
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
  modalOptionsGrid: {
    padding: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  modalOptionChip: {
    marginBottom: 0,
  },
  modalFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  accountForm: {
    padding: spacing.lg,
  },
  formSection: {
    marginBottom: spacing.lg,
  },
  formLabel: {
    fontSize: 16,
    marginBottom: spacing.sm,
  },
});