import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { fonts } from '@/lib/fonts';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header with Logo */}
        <View style={styles.header}>
          <Text style={styles.logo}>unknown</Text>
          <Text style={styles.tagline}>Discover underground music</Text>
        </View>

        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            <View style={styles.playButton}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
          </View>
        </View>

        {/* Welcome Text */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Welcome to the Underground</Text>
          <Text style={styles.welcomeDescription}>
            Discover hidden gems and rate tracks before they hit the mainstream. 
            Your taste could predict the next big hit.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.secondaryButtonText}>I Already Have an Account</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Join thousands of music discoverers
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#19161a',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 48,
  },
  logo: {
    fontSize: 32,
    fontFamily: fonts.chillax.bold,
    color: '#ded7e0',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    fontFamily: fonts.chillax.medium,
    color: '#8b6699',
  },
  heroContainer: {
    position: 'relative',
    height: 280,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 48,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#452451',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 24,
    color: '#ded7e0',
    marginLeft: 4,
  },
  welcomeContainer: {
    marginBottom: 48,
  },
  welcomeTitle: {
    fontSize: 28,
    fontFamily: fonts.chillax.bold,
    color: '#ded7e0',
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeDescription: {
    fontSize: 16,
    fontFamily: fonts.chillax.regular,
    color: '#ded7e0',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#452451',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontFamily: fonts.chillax.bold,
    color: '#ded7e0',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#28232a',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: fonts.chillax.medium,
    color: '#ded7e0',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 14,
    fontFamily: fonts.chillax.regular,
    color: '#8b6699',
  },
});