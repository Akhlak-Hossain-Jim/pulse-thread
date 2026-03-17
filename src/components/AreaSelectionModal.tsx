import { MapPin, Search, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from "../constants/theme";

interface AreaSelectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  preferredAreas: string[];
  onUpdateAreas: (areas: string[]) => void;
}

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID;

export const AreaSelectionModal = ({
  isVisible,
  onClose,
  preferredAreas,
  onUpdateAreas,
}: AreaSelectionModalProps) => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchAreas = async (text: string) => {
    setQuery(text);
    if (text.length < 3) {
      setPredictions([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&types=(regions)&key=${GOOGLE_API_KEY}`,
      );
      const data = await res.json();
      if (data.status === "OK") {
        setPredictions(data.predictions);
      } else {
        setPredictions([]);
      }
    } catch (error) {
      console.error("Error fetching areas", error);
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
            Select areas where you are available to donate blood. You will receive notifications for requests in these areas.
          </Text>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Search size={20} color={COLORS.darkGray} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search area (e.g. Dhanmondi)"
                placeholderTextColor={COLORS.darkGray}
                value={query}
                onChangeText={searchAreas}
                autoFocus
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery("")} style={styles.clearBtn}>
                  <X size={18} color={COLORS.darkGray} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {loading && (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.md }} />
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
                      <Text style={styles.predictionPrimary}>{item.structured_formatting.main_text}</Text>
                      <Text style={styles.predictionSecondary}>{item.structured_formatting.secondary_text}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.predictionsList}
                keyboardShouldPersistTaps="handled"
              />
            ) : query.length >= 3 && !loading ? (
                <Text style={styles.emptyStateText}>No valid areas found for &quot;{query}&quot;</Text>
            ) : (
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Your Selected Areas</Text>
                {preferredAreas.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No areas added yet.</Text>
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
                    contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.lg }}
                  />
                )}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.doneButton]}
            onPress={onClose}
          >
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
