import React from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Logo } from '@/components/typography/Logo';
import { Text } from '@/components/typography/Text';
import { Button } from '@/components/buttons/Button';
import { colors } from '@/utils/colors';
import { spacing } from '@/utils/spacing';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      {/* Full-screen background image */}
      <ImageBackground
        source={{ uri: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Dark overlay for text readability */}
        <View style={styles.overlay} />
        
        <Screen paddingHorizontal={24} style={styles.screenContainer}>
          {/* Header with Logo */}
          <View style={styles.header}>
            <Logo size="large" showTagline={true} />
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeContainer}>
            <Text 
              variant="body" 
              color="primary" 
              align="center"
              style={styles.welcomeTitle}
            >
              Welcome to the Underground
            </Text>
            <Text 
              variant="body" 
              color="primary" 
              align="center"
              style={styles.welcomeDescription}
            >
              Discover hidden gems and rate tracks before they hit the mainstream. 
              Your taste could predict the next big hit.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              variant="primary"
              size="large"
              onPress={() => router.push('/disclaimer')}
              style={styles.primaryButton}
            >
              Get Started
            </Button>

            <Button
              variant="secondary"
              size="large"
              onPress={() => router.push('/login')}
              style={styles.secondaryButton}
            >
              I Already Have an Account
            </Button>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text 
              variant="caption" 
              color="secondary" 
              align="center"
              style={styles.footerText}
            >
              Join thousands of music discoverers
            </Text>
          </View>
        </Screen>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(25, 22, 26, 0.85)',
  },
  screenContainer: {
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    flex: 1,
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    lineHeight: 40,
  },
  welcomeDescription: {
    fontSize: 18,
    lineHeight: 28,
    opacity: 0.9,
    maxWidth: 320,
  },
  buttonContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  primaryButton: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: 'rgba(40, 35, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(139, 102, 153, 0.3)',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  footerText: {
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});