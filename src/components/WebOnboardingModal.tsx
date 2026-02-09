import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Linking, Modal, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { CONFIG } from '../constants/config';
import { COLORS, SHADOWS } from '../constants/theme';

// Modal to direct web users to mobile apps
export const WebOnboardingModal = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const hasSeenModal = window.sessionStorage.getItem('hasSeenWebOnboarding');
      if (!hasSeenModal) {
        // Short delay to ensure it renders nicely after hydration
        const timer = setTimeout(() => setVisible(true), 500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleClose = () => {
    setVisible(false);
    if (Platform.OS === 'web') {
      window.sessionStorage.setItem('hasSeenWebOnboarding', 'true');
    }
  };

  const handleAndroidPress = () => {
    const url = CONFIG.IS_ANDROID_APP_PUBLIC 
      ? CONFIG.ANDROID_APP_URL 
      : CONFIG.ANDROID_EARLY_ACCESS_URL;
    Linking.openURL(url);
  };

  const handleIOSPress = () => {
    const url = CONFIG.IS_IOS_APP_PUBLIC 
      ? CONFIG.IOS_APP_URL 
      : CONFIG.IOS_WISHLIST_URL;
    Linking.openURL(url);
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.backdrop} >
           <TouchableOpacity style={styles.backdropTouch} onPress={handleClose} />
        </View>
        <ThemedView style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          
          <ThemedText type="title" style={styles.title}>Mobile Experience Recommended</ThemedText>
          <ThemedText style={styles.description}>
            This application is optimized for Android and iOS. Some features may not work properly on the web.
          </ThemedText>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.androidButton]} 
              onPress={handleAndroidPress}
            >
              <Ionicons name="logo-android" size={24} color="white" style={styles.icon} />
              <ThemedText style={styles.buttonText}>
                {CONFIG.IS_ANDROID_APP_PUBLIC ? 'Open on Play Store' : 'Request Early Access'}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.iosButton]} 
              onPress={handleIOSPress}
            >
              <Ionicons name="logo-apple" size={24} color="white" style={styles.icon} />
              <ThemedText style={styles.buttonText}>
                {CONFIG.IS_IOS_APP_PUBLIC ? 'Open on App Store' : 'Join iOS Wishlist'}
              </ThemedText>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity onPress={handleClose} style={styles.continueButton}>
             <ThemedText style={styles.continueText}>Continue on Web</ThemedText>
          </TouchableOpacity>

        </ThemedView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdropTouch: {
    flex: 1,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    maxWidth: 500,
    width: '90%',
    ...SHADOWS.card, // Use existing shadow
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 5,
    zIndex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: COLORS.text,
  },
  description: {
    marginBottom: 25,
    textAlign: 'center',
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    ...SHADOWS.button,
  },
  androidButton: {
    backgroundColor: '#3DDC84', // Android Green
  },
  iosButton: {
    backgroundColor: '#000000', // Apple Black
  },
  icon: {
    marginRight: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  continueButton: {
    padding: 10,
  },
  continueText: {
    color: COLORS.darkGray,
    textDecorationLine: 'underline',
  },
});
