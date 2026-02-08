
import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';
import { create } from 'zustand';

type LocationState = {
  location: Location.LocationObject | null;
  errorMsg: string | null;
  setLocation: (location: Location.LocationObject) => void;
  setErrorMsg: (msg: string) => void;
  requestPermission: () => Promise<void>;
};

export const useLocationStore = create<LocationState>((set) => ({
  location: null,
  errorMsg: null,
  setLocation: (location) => set({ location }),
  setErrorMsg: (errorMsg) => set({ errorMsg }),
  requestPermission: async () => {
    try {
      console.log("Checking if location services are enabled...");
      const enabled = await Location.hasServicesEnabledAsync();
      console.log("Location Services Enabled:", enabled);
      if (!enabled) {
          Alert.alert(
              "Location Disabled", 
              "Please enable location services to use this feature.",
              [
                  { text: "Cancel", style: "cancel" },
                  { text: "Open Settings", onPress: () => Linking.openSettings() }
              ]
          );
          // throw new Error('Location services disabled'); 
          // Don't throw immediately, maybe they enable it?
      }

      console.log("Requesting foreground permissions...");
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log("Permission status:", status);
      
      if (status !== 'granted') {
          Alert.alert(
              "Permission Denied",
              "We need your location to find nearby donors. Please enable it in settings.",
              [
                  { text: "Cancel", style: "cancel" },
                  { text: "Open Settings", onPress: () => Linking.openSettings() }
              ]
          );
        throw new Error('Permission denied');
      }

      // Race condition with timeout for location fetching
      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Location request timed out')), 5000)
      );

      let location: any = await Promise.race([locationPromise, timeoutPromise]);
      
      if (!location) {
        // Fallback to last known if current fails/times out (though race handles timeout error)
        location = await Location.getLastKnownPositionAsync({});
      }
      
      if (location) {
        set({ location });
      }

    } catch (error: any) {
      console.log('Location error:', error);
      set({ 
        errorMsg: 'Location not available. Using default.',
        // FORCE DEFAULT LOCATION on any error (timeout, denial, etc.)
        location: {
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
        } as any
      });
    }
  },
}));
