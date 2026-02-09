
import React from 'react';
import { View } from 'react-native';

// Web implementation of MapMarker
// Since react-native-maps is not supported on web, we render a simple View or null.
// This file exists primarily to prevent bundler errors when importing MapMarker on web.

export const MapMarker = (props: any) => {
  return <View style={{ width: 10, height: 10, backgroundColor: 'red', borderRadius: 5 }} />;
};
