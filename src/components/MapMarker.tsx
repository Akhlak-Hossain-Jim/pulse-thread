
import { Ambulance, Car, Droplet } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { COLORS } from '../constants/theme';

type MarkerType = 'request' | 'donor' | 'hospital' | 'user';

interface MapMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  type: MarkerType;
  title?: string;
  description?: string;
  onPress?: () => void;
}

export const MapMarker = ({ coordinate, type, title, description, onPress }: MapMarkerProps) => {
  const getIcon = () => {
    switch (type) {
      case 'request':
        return <Droplet color={COLORS.white} size={20} fill={COLORS.white} />;
      case 'user':
        // User requested "blood type icon" for current location
        return <Droplet color={COLORS.white} size={20} />; 
      case 'donor':
        return <Car color={COLORS.white} size={20} />;
      case 'hospital':
        return <Ambulance color={COLORS.white} size={20} />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'request':
        return COLORS.primary;
      case 'user':
        return COLORS.primary; // Or maybe a different shade?
      case 'donor':
        return COLORS.action;
      case 'hospital':
        return COLORS.success;
    }
  };

  return (
    <Marker coordinate={coordinate} title={title} description={description} onPress={onPress}>
      <View style={[styles.marker, { backgroundColor: getBackgroundColor() }]}>
        {getIcon()}
      </View>
      {type === 'request' && <View style={styles.ring} />}
    </Marker>
  );
};

const styles = StyleSheet.create({
  marker: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  ring: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(230, 57, 70, 0.3)', // Semi-transparent pulse red
    top: -6, // Adjust based on marker size
    left: -6,
    zIndex: 1,
  },
});
