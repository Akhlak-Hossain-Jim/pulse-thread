import { Map as MapIcon, MapPin, Search, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from "../constants/theme";
import { useLocationStore } from "../store/locationStore";

interface AreaSelectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  preferredAreas: string[];
  onUpdateAreas: (areas: string[]) => void;
}

// Use the restricted ANDROID key with header injection.
// This allows us to keep the key restricted to our app package + SHA-1 fingerprint.
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID;
const GOOGLE_HEADERS = {
  "X-Android-Package": "dev.akhlak.app.pulsethread",
  "X-Android-Cert": (process.env.EXPO_PUBLIC_GOOGLE_MAPS_SHA1 || "").replace(
    /:/g,
    "",
  ),
};

export const AreaSelectionModal = ({
  isVisible,
  onClose,
  preferredAreas,
  onUpdateAreas,
}: AreaSelectionModalProps) => {
  const insets = useSafeAreaInsets();
  const { location } = useLocationStore();
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState<string>("");

  // Map Picking State
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pickedAreaName, setPickedAreaName] = useState("");

  useEffect(() => {
    if (location && GOOGLE_API_KEY) {
      const fetchCountry = async () => {
        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.coords.latitude},${location.coords.longitude}&key=${GOOGLE_API_KEY}`,
            { headers: GOOGLE_HEADERS },
          );
          const data = await res.json();
          if (data.status === "OK" && data.results.length > 0) {
            const comps = data.results[0].address_components;
            const countryComp = comps.find((c: any) =>
              c.types.includes("country"),
            );
            if (countryComp) {
              setCountryCode(countryComp.short_name);
            }
          }
        } catch (e) {
          console.error("Failed to fetch country code", e);
        }
      };
      fetchCountry();
    }
  }, [location]);

  const searchAreas = async (text: string) => {
    setQuery(text);
    if (text.length < 3) {
      setPredictions([]);
      return;
    }

    if (!GOOGLE_API_KEY) {
      const msg = "[AreaSelectionModal] GOOGLE_API_KEY is undefined.";
      console.error(msg);
      Alert.alert("Debug: Missing API Key", msg);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // `types=(regions)` tells the API to return only area-level results
      // (neighborhoods, sublocalities, cities, countries) — not streets or POIs.
      // This is more reliable than client-side filtering.
      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&types=(regions)&key=${GOOGLE_API_KEY}`;
      if (countryCode) {
        url += `&components=country:${countryCode}`;
      }

      const res = await fetch(url, { headers: GOOGLE_HEADERS });
      const data = await res.json();
      if (data.status === "OK") {
        // Allow-list: keep only genuine area types.
        // A place may have multiple types — we keep it if it has at least one area type.
        const areaTypes = [
          "neighborhood",
          "sublocality",
          "sublocality_level_1",
          "sublocality_level_2",
          "locality",
          "administrative_area_level_1",
          "administrative_area_level_2",
          "administrative_area_level_3",
          "administrative_area_level_4",
          "political",
          "geocode",
        ];

        const filtered = data.predictions.filter((p: any) =>
          p.types.some((t: string) => areaTypes.includes(t)),
        );
        setPredictions(filtered);
      } else {
        const msg = `Places API status: ${data.status}${data.error_message ? " — " + data.error_message : ""}`;
        console.warn("[AreaSelectionModal]", msg);
        Alert.alert("Debug: Places API Error", msg);
        setPredictions([]);
      }
    } catch (error) {
      const msg = String(error);
      console.error("[AreaSelectionModal] Error fetching areas", msg);
      Alert.alert("Debug: Fetch Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectArea = (description: string) => {
    const simpleAreaName = description.split(",")[0].trim();
    if (!preferredAreas.includes(simpleAreaName)) {
      onUpdateAreas([...preferredAreas, simpleAreaName]);
    }
    setQuery("");
    setPredictions([]);
  };

  const removeArea = (area: string) => {
    onUpdateAreas(preferredAreas.filter((a) => a !== area));
  };

  if (isPickingLocation) {
    return (
      <Modal visible={isVisible} animationType="slide" transparent={true}>
        <View style={[styles.overlay, { paddingTop: insets.top + 20 }]}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Pick Area on Map</Text>
              <TouchableOpacity
                onPress={() => setIsPickingLocation(false)}
                style={styles.closeBtn}
              >
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>
              Move the map to select your preferred donation area.
            </Text>

            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: location?.coords?.latitude || 23.8103,
                  longitude: location?.coords?.longitude || 90.4125,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                onRegionChangeComplete={async (region) => {
                  setPickedAreaName("Locating...");
                  try {
                    const res = await fetch(
                      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${region.latitude},${region.longitude}&key=${GOOGLE_API_KEY}`,
                      { headers: GOOGLE_HEADERS },
                    );
                    const data = await res.json();
                    if (data.status === "OK" && data.results.length > 0) {
                      let foundName = "";
                      for (const result of data.results) {
                        const comps = result.address_components;
                        const sub = comps.find(
                          (c: any) =>
                            c.types.includes("neighborhood") ||
                            c.types.includes("sublocality") ||
                            c.types.includes("locality"),
                        );
                        if (sub) {
                          foundName = sub.long_name;
                          break;
                        }
                      }
                      if (!foundName) {
                        foundName =
                          data.results[0].formatted_address.split(",")[0];
                      }
                      setPickedAreaName(foundName);
                    } else {
                      setPickedAreaName("Unknown Area");
                    }
                  } catch (e) {
                    setPickedAreaName("Unknown Area");
                  }
                }}
              />
              <View style={styles.centerPinContainer} pointerEvents="none">
                <MapPin size={40} color={COLORS.primary} />
              </View>
            </View>

            <View style={styles.pickedAreaContainer}>
              <Text style={styles.pickedAreaLabel}>Selected Area:</Text>
              <Text style={styles.pickedAreaText}>
                {pickedAreaName || "Locating..."}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.doneButton,
                (!pickedAreaName ||
                  pickedAreaName === "Locating..." ||
                  pickedAreaName === "Unknown Area") && { opacity: 0.5 },
              ]}
              disabled={
                !pickedAreaName ||
                pickedAreaName === "Locating..." ||
                pickedAreaName === "Unknown Area"
              }
              onPress={() => {
                if (
                  pickedAreaName &&
                  !preferredAreas.includes(pickedAreaName)
                ) {
                  onUpdateAreas([...preferredAreas, pickedAreaName]);
                }
                setIsPickingLocation(false);
              }}
            >
              <Text style={styles.doneButtonText}>CONFIRM AREA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View style={[styles.overlay, { paddingTop: insets.top + 20 }]}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Manage Preferred Areas</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Select areas where you are available to donate blood. You will
            receive notifications for requests in these areas.
          </Text>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Search
                size={20}
                color={COLORS.darkGray}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search area (e.g. Dhanmondi)"
                placeholderTextColor={COLORS.darkGray}
                value={query}
                onChangeText={searchAreas}
              />
              {query.length > 0 && (
                <TouchableOpacity
                  onPress={() => setQuery("")}
                  style={styles.clearBtn}
                >
                  <X size={18} color={COLORS.darkGray} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.pickMapButton}
              onPress={() => setIsPickingLocation(true)}
            >
              <MapIcon size={18} color={COLORS.white} />
              <Text style={styles.pickMapText}>Pick from Map</Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <ActivityIndicator
              color={COLORS.primary}
              style={{ marginVertical: SPACING.md }}
            />
          )}

          <View style={{ flex: 1 }}>
            {predictions.length > 0 ? (
              <FlatList
                data={predictions}
                keyExtractor={(item) => item.place_id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.predictionItem}
                    onPress={() => handleSelectArea(item.description)}
                  >
                    <MapPin size={18} color={COLORS.darkGray} />
                    <View>
                      <Text style={styles.predictionPrimary}>
                        {item.structured_formatting.main_text}
                      </Text>
                      <Text style={styles.predictionSecondary}>
                        {item.structured_formatting.secondary_text}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.predictionsList}
                keyboardShouldPersistTaps="handled"
              />
            ) : query.length >= 3 && !loading ? (
              <Text style={styles.emptyStateText}>
                No valid areas found for &quot;{query}&quot;
              </Text>
            ) : (
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Your Selected Areas</Text>
                {preferredAreas.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      No areas added yet.
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={preferredAreas}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <View style={styles.areaItem}>
                        <View style={styles.areaInfo}>
                          <MapPin size={20} color={COLORS.primary} />
                          <Text style={styles.areaName}>{item}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => removeArea(item)}
                          style={styles.removeBtn}
                        >
                          <X size={18} color={COLORS.error} />
                        </TouchableOpacity>
                      </View>
                    )}
                    contentContainerStyle={{
                      paddingBottom: insets.bottom + SPACING.lg,
                    }}
                  />
                )}
              </View>
            )}
          </View>

          <TouchableOpacity style={[styles.doneButton]} onPress={onClose}>
            <Text style={styles.doneButtonText}>DONE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SPACING.xl,
    borderTopRightRadius: SPACING.xl,
    padding: SPACING.lg,
    ...SHADOWS.floating,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.darkGray,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  searchContainer: {
    marginBottom: SPACING.lg,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray,
    borderRadius: SPACING.sm,
    paddingHorizontal: SPACING.md,
    height: 50,
    marginBottom: SPACING.sm,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
  },
  clearBtn: {
    padding: SPACING.xs,
  },
  pickMapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: SPACING.sm,
    gap: SPACING.xs,
  },
  pickMapText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: TYPOGRAPHY.sizes.md,
  },
  mapContainer: {
    flex: 1,
    borderRadius: SPACING.sm,
    overflow: "hidden",
    marginBottom: SPACING.md,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  centerPinContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
  },
  pickedAreaContainer: {
    backgroundColor: COLORS.gray,
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  pickedAreaLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.darkGray,
    marginRight: SPACING.sm,
  },
  pickedAreaText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
    fontWeight: "bold",
    flex: 1,
  },
  predictionsList: {
    paddingBottom: SPACING.md,
  },
  predictionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
    gap: SPACING.md,
  },
  predictionPrimary: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: "600",
    color: COLORS.text,
  },
  predictionSecondary: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.darkGray,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  areaItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.gray,
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  areaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  areaName: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
    fontWeight: "500",
  },
  removeBtn: {
    padding: SPACING.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    color: COLORS.darkGray,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  doneButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    alignItems: "center",
    marginTop: SPACING.md,
  },
  doneButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: TYPOGRAPHY.sizes.md,
  },
});
