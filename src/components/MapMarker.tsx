import { Ambulance, Car, Droplet } from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";
import { COLORS } from "../constants/theme";

type MarkerType = "request" | "donor" | "hospital" | "user";

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

export const MapMarker = ({
  coordinate,
  type,
  title,
  description,
  onPress,
}: MapMarkerProps) => {
  const getIcon = () => {
    switch (type) {
      case "request":
        return <Droplet color={COLORS.white} size={20} fill={COLORS.white} />;
      case "user":
        return <Droplet color={COLORS.white} size={20} fill={COLORS.white} />;
      case "donor":
        return <Car color={COLORS.white} size={20} />;
      case "hospital":
        return <Ambulance color={COLORS.white} size={20} />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "request":
        return COLORS.primary;
      case "user":
        return COLORS.primary;
      case "donor":
        return COLORS.action;
      case "hospital":
        return COLORS.success;
    }
  };

  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
      onPress={onPress}
      anchor={{ x: 0.5, y: Platform.OS === "android" ? 1.15 : 1 }}
      tracksViewChanges={true}
    >
      <View style={styles.container}>
        <View style={styles.pinBody}>
          {type === "request" && <View style={styles.ring} />}
          <View
            style={[styles.marker, { backgroundColor: getBackgroundColor() }]}
          >
            {getIcon()}
          </View>
        </View>
        <View
          style={[styles.triangle, { borderTopColor: getBackgroundColor() }]}
        />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  pinBody: {
    width: Platform.OS === "android" ? 60 : 60,
    height: Platform.OS === "android" ? 60 : 60,
    justifyContent: Platform.OS === "android" ? "flex-start" : "center",
    alignItems: Platform.OS === "android" ? "flex-start" : "center",
  },
  marker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    transform: [{ scale: Platform.OS === "android" ? 0.75 : 1 }],
    marginTop: Platform.OS === "android" ? -4 : 0,
  },
  ring: {
    position: "absolute",
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(230, 57, 70, 0.4)",
    zIndex: 0,
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 0,
    borderTopWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: Platform.OS === "android" ? -36 : -13,
    marginLeft: Platform.OS === "android" ? -22 : 0,
    zIndex: 1,
  },
});
