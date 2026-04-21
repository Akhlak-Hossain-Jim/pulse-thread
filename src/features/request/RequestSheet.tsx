import { useRouter } from "expo-router";
import { ArrowLeft, MapPin, Navigation, X, Calendar } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import { useAuth } from "../../context/AuthProvider";
import { PlatformAlert } from "../../lib/platformAlert";
import { supabase } from "../../lib/supabase";
import { useLocationStore } from "../../store/locationStore";

interface RequestSheetProps {
  visible: boolean;
  onClose: () => void;
  onPickLocation: () => void;
  selectedLocation?: any;
}

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID;

export const RequestSheet = ({
  visible,
  onClose,
  onPickLocation,
  selectedLocation,
}: RequestSheetProps) => {
  const router = useRouter();
  const { session } = useAuth();
  const { location: gpsLocation } = useLocationStore();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [bloodType, setBloodType] = useState("");
  const [componentType, setComponentType] = useState("Whole Blood");
  const [units, setUnits] = useState("1");
  const [urgency, setUrgency] = useState("Standard");
  const [hospital, setHospital] = useState("");
  const [area, setArea] = useState("");
  const [loading, setLoading] = useState(false);
  const [useGPS, setUseGPS] = useState(false);

  // Search State
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);

  // Scheduling State
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);


  // No longer using preferred areas in request flow

  useEffect(() => {
    if (selectedLocation) {
        // Regular Request Flow pin dropping
        setHospital(selectedLocation.address || "Pinned Location");
        setArea(""); // Will be extracted on submit
        setSelectedPlace({
          geometry: {
            location: {
              lat: selectedLocation.latitude,
              lng: selectedLocation.longitude,
            },
          },
          name: "Pinned Location",
        });
        setUseGPS(false);
        setShowPredictions(false);
    }
  }, [selectedLocation]);

  const searchPlacesAndAreas = async (text: string) => {
    setQuery(text);
    setHospital(text);
    setSelectedPlace(null);
    setUseGPS(false);

    if (text.length < 3) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    try {
      const userLat = gpsLocation?.coords.latitude;
      const userLng = gpsLocation?.coords.longitude;
      const locationBias = userLat
        ? `&location=${userLat},${userLng}&radius=50000`
        : "";

      // Ensure at least one medical type matches or is biased towards medical facilities
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&key=${GOOGLE_API_KEY}&types=hospital${locationBias}`,
      );
      const data = await res.json();
      if (data.status === "OK") {
        setPredictions(data.predictions);
        setShowPredictions(true);
      }
    } catch (error) {
      console.error("Error fetching places", error);
    }
  };

  const handleSelectPlace = async (placeId: string, description: string) => {
    setHospital(description);
    setShowPredictions(false);

    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,name,address_components&key=${GOOGLE_API_KEY}`,
      );
      const data = await res.json();
      if (data.status === "OK") {
        setSelectedPlace(data.result); // Contains geometry.location.lat/lng

        // Extract Area
        if (data.result.address_components) {
          let extractedArea = "";
          const sublocalityInfo = data.result.address_components.find(
            (c: any) =>
              c.types.includes("sublocality_level_1") ||
              c.types.includes("sublocality"),
          );
          const localityInfo = data.result.address_components.find((c: any) =>
            c.types.includes("locality"),
          );

          if (sublocalityInfo) {
            extractedArea = sublocalityInfo.long_name;
          } else if (localityInfo) {
            extractedArea = localityInfo.long_name;
          }
          setArea(extractedArea);
        }
      }
    } catch (error) {
      PlatformAlert.alert("Error", "Could not fetch place details");
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!gpsLocation) {
      PlatformAlert.alert("Error", "GPS location not available yet.");
      return;
    }

    setLoading(true);
    const { latitude, longitude } = gpsLocation.coords;

    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`,
      );
      const data = await res.json();
      if (data.status === "OK" && data.results.length > 0) {
        const result = data.results[0];
        setHospital(result.formatted_address);

        // Extract Area
        let extractedArea = "";
        const sublocalityInfo = result.address_components.find(
          (c: any) =>
            c.types.includes("sublocality_level_1") ||
            c.types.includes("sublocality"),
        );
        const localityInfo = result.address_components.find((c: any) =>
          c.types.includes("locality"),
        );

        if (sublocalityInfo) {
          extractedArea = sublocalityInfo.long_name;
        } else if (localityInfo) {
          extractedArea = localityInfo.long_name;
        }
        setArea(extractedArea);
      } else {
        setHospital("Current Location");
      }
    } catch (error) {
      console.error("Reverse geocoding failed", error);
      setHospital("Current Location");
    } finally {
      setSelectedPlace(null);
      setUseGPS(true);
      setShowPredictions(false);
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Priority: 1. Selected Place (Autocomplete), 2. Selected Map Pin, 3. GPS
    let finalLat, finalLng;

    if (selectedPlace?.geometry?.location) {
      finalLat = selectedPlace.geometry.location.lat;
      finalLng = selectedPlace.geometry.location.lng;
    } else if (selectedLocation) {
      finalLat = selectedLocation.latitude;
      finalLng = selectedLocation.longitude;
    } else {
      finalLat = gpsLocation?.coords.latitude;
      finalLng = gpsLocation?.coords.longitude;
    }

    if (!bloodType || !hospital || !finalLat || !session) {
      PlatformAlert.alert(
        "Error",
        "Please fill in all fields and ensure location is active.",
      );
      return;
    }

    if (!selectedPlace && !selectedLocation && !useGPS) {
      PlatformAlert.alert(
        "Invalid Location",
        "Please select a proper hospital from the search results, drop a pin on the map, or choose to use your current location.",
      );
      return;
    }

    // Strict validation: if text is in hospital box but no place/GPS/Location is linked
    if (hospital && !selectedPlace && !selectedLocation && !useGPS) {
      PlatformAlert.alert(
        "Selection Required",
        "Please select a valid hospital from the search suggestions or use the 'Current Location' button."
      );
      return;
    }

    setLoading(true);
    try {
      // 1. Ensure profile exists
      const { error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        console.error(
          "Profile check failed:",
          JSON.stringify(profileError, null, 2),
        );
        PlatformAlert.alert(
          "Incomplete Profile",
          "You have not completed your profile. Please complete it to continue.",
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => setLoading(false),
            },
            {
              text: "Go to Profile",
              onPress: () => {
                onClose();
                router.push("/(authenticated)/profile");
              },
            },
          ],
        );
        return;
      }

      let finalHospitalName = hospital;

      // 2. Check nearby hospitals if using GPS or Map Pin (Current Location / Pinned Location)
      const isManualOrGPS =
        !selectedPlace || selectedPlace.name === "Pinned Location";

      if (isManualOrGPS) {
        try {
          const radius = 1000; // Increased radius to 1km to account for large campus/GPS variance
          const nearbyRes = await fetch(
            `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${finalLat},${finalLng}&radius=${radius}&type=hospital&keyword=hospital|clinic|medical&key=${GOOGLE_API_KEY}`,
          );
          const nearbyData = await nearbyRes.json();

          if (
            nearbyData.status === "OK" &&
            nearbyData.results &&
            nearbyData.results.length > 0
          ) {
            finalHospitalName = nearbyData.results[0].name;
          } else {
            PlatformAlert.alert(
              "Warning",
              "Request can not be sent from your current location, make sure to be physically present in an hospital.",
            );
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Nearby search failed", error);
          PlatformAlert.alert(
            "Error",
            "Could not verify nearby hospitals. Please try again.",
          );
          setLoading(false);
          return;
        }
      }

      // 3. Perform Reverse Geocoding if area is not extracted yet
      let finalArea = area;
      if (!finalArea) {
        try {
          const geoRes = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${finalLat},${finalLng}&key=${GOOGLE_API_KEY}`,
          );
          const geoData = await geoRes.json();
          if (geoData.status === "OK" && geoData.results[0]) {
            const sublocalityInfo = geoData.results[0].address_components.find(
              (c: any) =>
                c.types.includes("sublocality_level_1") ||
                c.types.includes("sublocality"),
            );
            const localityInfo = geoData.results[0].address_components.find(
              (c: any) => c.types.includes("locality"),
            );

            if (sublocalityInfo) {
              finalArea = sublocalityInfo.long_name;
            } else if (localityInfo) {
              finalArea = localityInfo.long_name;
            }
          }
        } catch (geoError) {
          console.error("Reverse geocoding failed", geoError);
        }
      }

      if (!finalArea) {
        finalArea = "Unknown Area"; // Fallback to ensure the request is still created
      }

      const { error } = await supabase.from("requests").insert({
        requester_id: session.user.id,
        blood_type: bloodType,
        units_needed: parseInt(units),
        hospital_name: finalHospitalName,
        area: finalArea,
        location: `POINT(${finalLng} ${finalLat})`,
        urgency,
        component_type: componentType,
        status: "PENDING",
        scheduled_datetime: isScheduled && scheduledDate ? scheduledDate.toISOString() : null,
      });

      if (error) throw error;

      PlatformAlert.alert("Success", "Request broadcasted to nearby donors!");
      setBloodType("");
      setHospital("");
      setArea("");
      setQuery("");
      setUnits("1");
      setUrgency("Standard");
      setComponentType("Whole Blood");
      setStep(1);
      setSelectedPlace(null);
      setIsScheduled(false);
      setScheduledDate(null);
      onClose();
    } catch (error: any) {
      PlatformAlert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (!bloodType || !units) {
      PlatformAlert.alert(
        "Missing Info",
        "Please select blood type and units.",
      );
      return;
    }
    if (isScheduled && !scheduledDate) {
      PlatformAlert.alert(
        "Missing Info",
        "Please select a valid scheduled date and time.",
      );
      return;
    }
    setStep(2);
  };

  const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const COMPONENT_TYPES = [
    "Whole Blood",
    "PRBC",
    "Platelets",
    "Plasma",
    "Cryoprecipitate",
  ];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View
          style={[
            styles.sheet,
            {
              height: showPredictions ? "80%" : "auto",
              maxHeight: "90%",
              paddingBottom: insets.bottom + SPACING.lg,
            },
          ]}
        >
          <View style={styles.header}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              {step === 2 && (
                <TouchableOpacity onPress={() => setStep(1)}>
                  <ArrowLeft color={COLORS.text} size={24} />
                </TouchableOpacity>
              )}
              <Text style={styles.title}>
                {step === 1 ? "Request Details" : "Select Location"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X color={COLORS.text} size={24} />
            </TouchableOpacity>
          </View>

          <View style={[styles.form, { flex: showPredictions ? 1 : undefined, flexShrink: 1 }]}>
            {step === 1 ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACING.md }}>
                <Text style={styles.label}>Blood Type</Text>
                <View style={styles.chipsContainer}>
                  {BLOOD_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.chip,
                        bloodType === type && styles.activeChip,
                      ]}
                      onPress={() => setBloodType(type)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          bloodType === type && styles.activeChipText,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Component Type</Text>
                <View style={styles.chipsContainer}>
                  {COMPONENT_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.chip,
                        componentType === type && styles.activeChip,
                      ]}
                      onPress={() => setComponentType(type)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          componentType === type && styles.activeChipText,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Units Needed</Text>
                <TextInput
                  style={[styles.input, { marginBottom: SPACING.md }]}
                  value={units}
                  onChangeText={setUnits}
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.darkGray}
                />

                <Text style={styles.label}>Urgency Level</Text>
                <View style={styles.urgencyContainer}>
                  {["Standard", "Urgent", "Critical"].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.urgencyButton,
                        urgency === level && styles.activeUrgencyButton,
                        urgency === level &&
                          level === "Critical" && {
                            backgroundColor: COLORS.error,
                          },
                        urgency === level &&
                          level === "Urgent" && {
                            backgroundColor: COLORS.primary,
                          },
                      ]}
                      onPress={() => setUrgency(level)}
                    >
                      <Text
                        style={[
                          styles.urgencyText,
                          urgency === level && styles.activeUrgencyText,
                        ]}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Request Timing</Text>
                <View style={styles.urgencyContainer}>
                  {[
                    { id: 'instant', label: 'Instant' },
                    { id: 'scheduled', label: 'Schedule' }
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.urgencyButton,
                        (!isScheduled && option.id === 'instant') || (isScheduled && option.id === 'scheduled')
                          ? styles.activeUrgencyButton
                          : null,
                      ]}
                      onPress={() => setIsScheduled(option.id === 'scheduled')}
                    >
                      <Text
                        style={[
                          styles.urgencyText,
                          (!isScheduled && option.id === 'instant') || (isScheduled && option.id === 'scheduled')
                            ? styles.activeUrgencyText
                            : null,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {isScheduled && (
                  <>
                    <Text style={styles.label}>Scheduled Date & Time</Text>
                    <TouchableOpacity
                      style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md }]}
                      onPress={() => setDatePickerVisibility(true)}
                    >
                      <Text style={{ color: scheduledDate ? COLORS.text : COLORS.darkGray, fontSize: TYPOGRAPHY.sizes.md }}>
                        {scheduledDate 
                          ? scheduledDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) 
                          : "Select Date & Time"}
                      </Text>
                      <Calendar color={COLORS.primary} size={20} />
                    </TouchableOpacity>

                    <DateTimePickerModal
                      isVisible={isDatePickerVisible}
                      mode="datetime"
                      onConfirm={(date) => {
                        setScheduledDate(date);
                        setDatePickerVisibility(false);
                      }}
                      onCancel={() => setDatePickerVisibility(false)}
                      minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
                      maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                    />
                  </>
                )}

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleNextStep}
                >
                  <Text style={styles.buttonText}>NEXT</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <>
                <Text style={styles.label}>Hospital / Location</Text>
                <View style={styles.hospitalInputContainer}>
                  <TextInput
                    style={styles.searchInput}
                    value={hospital}
                    onChangeText={searchPlacesAndAreas}
                    placeholder="Search hospital or place..."
                    placeholderTextColor={COLORS.darkGray}
                    onFocus={() => {
                      if (hospital.length > 2) setShowPredictions(true);
                    }}
                  />
                  {hospital.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setHospital("");
                        setQuery("");
                        setShowPredictions(false);
                      }}
                      style={styles.clearBtn}
                    >
                      <X size={16} color={COLORS.darkGray} />
                    </TouchableOpacity>
                  )}
                </View>

                {showPredictions && (
                  <View style={styles.predictionsList}>
                    <FlatList
                      data={predictions}
                      keyExtractor={(item) => item.place_id}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.predictionItem}
                          onPress={() =>
                            handleSelectPlace(item.place_id, item.description)
                          }
                        >
                          <MapPin size={16} color={COLORS.darkGray} />
                          <Text style={styles.predictionText} numberOfLines={1}>
                            {item.description}
                          </Text>
                        </TouchableOpacity>
                      )}
                      keyboardShouldPersistTaps="handled"
                    />
                  </View>
                )}

                {!showPredictions && (
                  <>
                    <View style={styles.quickActionsRow}>
                      <TouchableOpacity
                        style={styles.quickActionBtn}
                        onPress={handleUseCurrentLocation}
                      >
                        <Navigation size={16} color={COLORS.primary} />
                        <Text style={styles.quickActionText}>
                          Current Location
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.quickActionBtn}
                        onPress={onPickLocation}
                      >
                        <MapPin size={16} color={COLORS.primary} />
                        <Text style={styles.quickActionText}>Set on Map</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Removed Preferred Areas Section */}

                    <TouchableOpacity
                      style={[
                        styles.button,
                        !selectedPlace &&
                          !selectedLocation &&
                          !useGPS && { opacity: 0.5 },
                      ]}
                      onPress={handleSubmit}
                      disabled={
                        loading ||
                        (!selectedPlace && !selectedLocation && !useGPS) ||
                        (!selectedPlace && !selectedLocation && !useGPS && hospital.length > 0)
                      }
                    >
                      {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                      ) : (
                        <Text style={styles.buttonText}>BROADCAST REQUEST</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SPACING.lg,
    borderTopRightRadius: SPACING.lg,
    padding: SPACING.lg,
    ...SHADOWS.floating,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  form: {
    gap: SPACING.md,
    flex: 1,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.gray,
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
  },
  hospitalInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray,
    borderRadius: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
  },
  clearBtn: {
    padding: SPACING.xs,
  },
  predictionsList: {
    flex: 1,
    marginTop: SPACING.xs,
    backgroundColor: COLORS.white,
    borderRadius: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  predictionItem: {
    flexDirection: "row",
    gap: SPACING.sm,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
    alignItems: "center",
  },
  predictionText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    alignItems: "center",
    marginTop: SPACING.md,
    marginBottom: SPACING.xl, // Safe area
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: TYPOGRAPHY.sizes.md,
  },
  urgencyContainer: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  urgencyButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    backgroundColor: COLORS.gray,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  activeUrgencyButton: {
    backgroundColor: COLORS.action, // Default active
  },
  urgencyText: {
    fontWeight: "bold",
    color: COLORS.darkGray,
  },
  activeUrgencyText: {
    color: COLORS.white,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 16,
    backgroundColor: COLORS.gray,
    borderWidth: 1,
    borderColor: "transparent",
  },
  activeChip: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.darkGray,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  activeChipText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    borderRadius: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  quickActionText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: TYPOGRAPHY.sizes.sm,
  },
});
