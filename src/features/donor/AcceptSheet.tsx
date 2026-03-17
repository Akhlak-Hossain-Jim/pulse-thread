import * as Location from "expo-location";
import { Navigation, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import { useAuth } from "../../context/AuthProvider";
import { PlatformAlert } from "../../lib/platformAlert";
import { supabase } from "../../lib/supabase";

// Helper to format minutes into a readable ETA string
const formatEta = (minutes: number) => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutes);
  return `Estimated arrival time: ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID;

interface AcceptSheetProps {
  request: any | null; // Replace 'any' with proper type from database
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AcceptSheet = ({
  request,
  visible,
  onClose,
  onSuccess,
}: AcceptSheetProps) => {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!request) return null;

  const handleAccept = async () => {
    if (!session) return;

    setLoading(true);
    let etaMessage = "Navigation starting...";

    try {
      // 1. Get foreground location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        // request.location is typically a Point string or an object depending on how it's fetched,
        // but looking at earlier code, it might be in the form of "POINT(long lat)"
        // However, in typical use, we fetched this to display the map. Let's extract coordinates.
        // Assuming request.location is a postgis Point string:
        const match = request.location.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);

        if (match && location) {
          const donorLng = location.coords.longitude;
          const donorLat = location.coords.latitude;
          const destLng = match[1];
          const destLat = match[2];

          // Call Google Directions API (or falling back to distance calc if no key)
          if (GOOGLE_API_KEY) {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/directions/json?origin=${donorLat},${donorLng}&destination=${destLat},${destLng}&key=${GOOGLE_API_KEY}`,
            );
            const data = await res.json();

            if (data.status === "OK" && data.routes[0]?.legs[0]) {
              const durationText = data.routes[0].legs[0].duration.text; // e.g. "15 mins"
              const durationValue = data.routes[0].legs[0].duration.value; // seconds
              etaMessage = formatEta(Math.round(durationValue / 60));
            }
          }
        }
      }

      // 2. Create Donation Record
      const { error: donationError } = await supabase.from("donations").insert({
        request_id: request.id,
        donor_id: session.user.id,
        status: "EN_ROUTE",
        timeline_logs: [
          { status: "EN_ROUTE", timestamp: new Date().toISOString() },
          {
            status: "ETA_CALCULATED",
            timestamp: new Date().toISOString(),
            message: etaMessage,
          },
        ],
      });

      if (donationError) throw donationError;

      // 2. Update Request Status
      const { error: requestError } = await supabase
        .from("requests")
        .update({ status: "ACCEPTED" })
        .eq("id", request.id);

      if (requestError) throw requestError;

      PlatformAlert.alert("Accepted!", etaMessage);
      if (onSuccess) onSuccess();
      onClose();
      // In a real app, we would trigger navigation here
    } catch (error: any) {
      PlatformAlert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Emergency Request</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={COLORS.text} size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Blood Type</Text>
              <Text style={styles.valueHighlight}>{request.blood_type}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Units Needed</Text>
              <Text style={styles.value}>{request.units_needed}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Location</Text>
              <Text style={styles.value}>{request.hospital_name}</Text>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleAccept}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <View style={styles.btnContent}>
                  <Navigation color={COLORS.white} size={20} />
                  <Text style={styles.buttonText}>ACCEPT & NAVIGATE</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
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
  content: {
    gap: SPACING.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.darkGray,
  },
  value: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: "600",
    color: COLORS.text,
  },
  valueHighlight: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  button: {
    backgroundColor: COLORS.action,
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    alignItems: "center",
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  btnContent: {
    flexDirection: "row",
    gap: SPACING.sm,
    alignItems: "center",
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: TYPOGRAPHY.sizes.md,
  },
});
