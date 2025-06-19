import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { fonts } from '@/lib/fonts';

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
        
        <SafeAreaView style={styles.safeArea}>
          {/* Header with Logo */}
          <View style={styles.header}>
            <Text style={styles.logo}>unknown</Text>
            <Text style={styles.tagline}>Discover underground music</Text>
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
    backgroundColor: 'rgba(25, 22, 26, 0.85)', // Dark overlay with brand color
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: 32,
  },
  logo: {
    fontSize: 40,
    fontFamily: fonts.chillax.bold,
    color: '#ded7e0',
    marginBottom: 12,
  },
  tagline: {
    fontSize: 18,
    fontFamily: fonts.chillax.medium,
    color: '#8b6699',
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    flex: 1,
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 32,
    fontFamily: fonts.chillax.bold,
    color: '#ded7e0',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 40,
  },
  welcomeDescription: {
    fontSize: 18,
    fontFamily: fonts.chillax.regular,
    color: '#ded7e0',
    textAlign: 'center',
    lineHeight: 28,
    opacity: 0.9,
    maxWidth: 320,
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#452451',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#452451',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontFamily: fonts.chillax.bold,
    color: '#ded7e0',
  },
  secondaryButton: {
    backgroundColor: 'rgba(40, 35, 42, 0.8)',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 102, 153, 0.3)',
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
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});