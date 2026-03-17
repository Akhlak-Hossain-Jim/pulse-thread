import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Linking } from 'react-native';
import { create } from 'zustand';
import { PlatformAlert } from '../lib/platformAlert';

const STORAGE_KEY = '@last_known_location';

const DEFAULT_LOCATION = {
  coords: {
    latitude: 37.7749,
    longitude: -122.4194,
    altitude: null,
    accuracy: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null
  },
  timestamp: Date.now()
} as any;

type LocationState = {
  location: Location.LocationObject | null;
  errorMsg: string | null;
  setLocation: (location: Location.LocationObject) => void;
  setErrorMsg: (msg: string) => void;
  requestPermission: () => Promise<void>;
  loadPersistedLocation: () => Promise<void>;
};

export const useLocationStore = create<LocationState>((set, get) => ({
  location: null,
  errorMsg: null,
  setLocation: (location) => {
    set({ location });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(location)).catch(console.error);
  },
  setErrorMsg: (errorMsg) => set({ errorMsg }),
  loadPersistedLocation: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        set({ location: JSON.parse(saved) });
      }
    } catch (e) {
      console.error('Failed to load persisted location', e);
    }
  },
  requestPermission: async () => {
    try {
      console.log("Checking if location services are enabled...");
      const enabled = await Location.hasServicesEnabledAsync();
      
      if (!enabled) {
          PlatformAlert.alert(
              "Location Disabled", 
              "Please enable location services to use this feature.",
              [
                  { text: "Cancel", style: "cancel" },
                  { text: "Open Settings", onPress: () => Linking.openSettings() }
              ]
          );
      }

      console.log("Requesting foreground permissions...");
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
          PlatformAlert.alert(
              "Permission Denied",
              "We need your location to find nearby donors. Please enable it in settings.",
              [
                  { text: "Cancel", style: "cancel" },
                  { text: "Open Settings", onPress: () => Linking.openSettings() }
              ]
          );
        throw new Error('Permission denied');
      }

      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Location request timed out')), 5000)
      );

      let location: any = await Promise.race([locationPromise, timeoutPromise]);
      
      if (!location) {
        location = await Location.getLastKnownPositionAsync({});
      }
      
      if (location) {
        set({ location });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(location));
      }

    } catch (error: any) {
      console.log('Location error:', error);
      
      // Attempt to load from persistence if GPS fails
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        set({ 
          location: JSON.parse(saved),
          errorMsg: 'GPS failed. Using last active location.' 
        });
      } else {
        set({ 
          errorMsg: 'Location not available. Using default.',
          location: DEFAULT_LOCATION
        });
      }
    }
  },
}));
