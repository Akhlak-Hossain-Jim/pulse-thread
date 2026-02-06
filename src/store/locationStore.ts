
import * as Location from 'expo-location';
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
      // Create a promise that rejects after 5 seconds to force fallback
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Location request timed out")), 5000)
      );

      // The actual work: Permission + Fetch
      const workPromise = (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Permission denied');
        }

        let lastKnown = await Location.getLastKnownPositionAsync({});
        if (lastKnown) return lastKnown;

        return await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      })();

      // Race work against timeout
      const result = await Promise.race([workPromise, timeoutPromise]);
      
      if (result) {
        set({ location: result as Location.LocationObject });
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
