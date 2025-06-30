import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { Button } from '@/components/buttons/Button';
import { colors } from '@/utils/colors';
import { spacing, borderRadius } from '@/utils/spacing';
import { Bird } from 'lucide-react-native';

export default function DisclaimerScreen() {
  const handleUnderstand = () => {
    router.push('/register');
  };

  const handleGoBack = () => {
    router.replace('/welcome');
  };

  return (
    <Screen paddingHorizontal={24} withoutBottomSafeArea>
      {/* Header */}
      <View style={styles.header}>
        <Heading variant="h2" color="primary" align="center">
          Hello Early Bird! <Bird />
        </Heading>
        <Text 
          variant="body" 
          color="secondary"
          align="center"
          style={styles.subtitle}
        >
          Disclaimer for Early Testers
        </Text>
      </View>

      {/* Scrollable Content */}
      <View style={styles.contentContainer}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          indicatorStyle="white"
        >
          {/* Development Status Warning */}
          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <AlertTriangle size={24} color={colors.status.warning} strokeWidth={2} />
              <Text variant="body" color="primary" style={styles.warningTitle}>
                Early Development Build
              </Text>
            </View>
            <Text variant="body" color="primary" style={styles.warningText}>
              This app is currently in early development. You might encounter issues with performance, 
              gamification features, and other aspects of the application. We appreciate your patience 
              as we work to improve the experience.
            </Text>
          </View>

          {/* Music Content Disclaimer */}
          <View style={styles.disclaimerCard}>
            <Text variant="body" color="primary" style={styles.disclaimerTitle}>
              About the Music Content
            </Text>
            <Text variant="body" color="secondary" style={styles.disclaimerText}>
              All songs featured in this alpha build have been submitted directly by the artists themselves. 
              Each artist has provided explicit consent for their music to be used in the unknown app through 
              our artist agreement process.
            </Text>
            <Text variant="body" color="secondary" style={styles.disclaimerText}>
              By participating in our regulations form, artists have agreed that their tracks may be used 
              during alpha testing phases. This ensures that all content is properly licensed and that 
              artists maintain full rights to their work.
            </Text>
          </View>

          {/* Testing Participation */}
          <View style={styles.disclaimerCard}>
            <Text variant="body" color="primary" style={styles.disclaimerTitle}>
              Your Role as an Early Tester
            </Text>
            <Text variant="body" color="secondary" style={styles.disclaimerText}>
              As an early bird tester, you're helping us shape the future of music discovery. Your feedback 
              and usage patterns are invaluable in creating a platform that truly serves the underground 
              music community.
            </Text>
            <Text variant="body" color="secondary" style={styles.disclaimerText}>
              Please report any bugs, performance issues, or suggestions through the app's feedback system. 
              Your input directly influences our development priorities and helps us build a better experience 
              for all users.
            </Text>
          </View>

          {/* Thank You */}
          <View style={styles.thankYouCard}>
            <Text variant="body" color="primary" style={styles.thankYouText}>
              Thank you for being part of the unknown journey! 🎵
            </Text>
            <Text variant="body" color="primary" style={styles.thankYouSubtext}>
              Together, we're building the future of underground music discovery.
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          variant="primary"
          size="medium"
          onPress={handleUnderstand}
          style={styles.understandButton}
        >
          I understand
        </Button>

        <Button
          variant="secondary"
          size="medium"
          onPress={handleGoBack}
          icon={<ArrowLeft size={20} color={colors.text.primary} strokeWidth={2} />}
          iconPosition="left"
          style={styles.backButton}
        >
          Take Me Back
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  subtitle: {
    fontSize: 18,
    marginTop: spacing.md,
    opacity: 0.8,
  },
  contentContainer: {
    flex: 1,
    marginBottom: spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  warningCard: {
    marginBottom: spacing.lg,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 16,
    lineHeight: 24,
  },
  disclaimerCard: {
    marginBottom: spacing.lg,
  },
  disclaimerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  disclaimerText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  thankYouCard: {
    backgroundColor: 'rgba(69, 36, 81, 0.3)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  thankYouText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  thankYouSubtext: {
    fontSize: 16,
    lineHeight: 22,
  },
  buttonContainer: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  understandButton: {
    shadowColor: colors.primary,
  },
  backButton: {
    backgroundColor: colors.surface,
  },
});