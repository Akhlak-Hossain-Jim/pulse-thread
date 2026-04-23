import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { Link } from "expo-router";
import * as Sharing from "expo-sharing";
import {
  Award,
  BadgeCheck,
  BookCheck,
  BookOpen,
  CalendarRange,
  ChevronRight,
  Droplet,
  GraduationCap,
  HeartHandshake,
  LogOut,
  MapPin,
  Megaphone,
  Save,
  Share2,
  Zap,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import QRCode from "react-native-qrcode-svg";
import { captureRef } from "react-native-view-shot";
import { AreaSelectionModal } from "../../src/components/AreaSelectionModal";
import LearningModal from "../../src/components/LearningModal";
import {
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthProvider";
import { supabase } from "../../src/lib/supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.HIGH,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [age, setAge] = useState<number | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [lastDonationDate, setLastDonationDate] = useState<Date | null>(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isLearningModalVisible, setLearningModalVisible] = useState(false);
  const [isDonorActive, setIsDonorActive] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState("");
  const [preferredAreas, setPreferredAreas] = useState<string[]>([]);
  const [isAreaModalVisible, setAreaModalVisible] = useState(false);
  const [userBadges, setUserBadges] = useState<any[]>([]);

  // Icon mapping
  const getIconComponent = (iconName: string, size: number, color: string) => {
    switch (iconName) {
      case "CalendarRange":
        return <CalendarRange size={size} color={color} />;
      case "BadgeCheck":
        return <BadgeCheck size={size} color={color} />;
      case "Award":
        return <Award size={size} color={color} />;
      case "Megaphone":
        return <Megaphone size={size} color={color} />;
      case "Zap":
        return <Zap size={size} color={color} />;
      case "HeartHandshake":
        return <HeartHandshake size={size} color={color} />;
      case "BookOpen":
        return <BookOpen size={size} color={color} />;
      case "BookCheck":
        return <BookCheck size={size} color={color} />;
      case "GraduationCap":
        return <GraduationCap size={size} color={color} />;
      default:
        return <Award size={size} color={color} />;
    }
  };

  const cardRef = useRef<View>(null);
  const storyRef = useRef<View>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const { data, error, status } = await supabase
        .from("profiles")
        .select(
          `full_name, phone, blood_type, is_donor_active, expo_push_token, preferred_areas, age, weight, last_donation_date`,
        )
        .eq("id", session?.user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setBloodType(data.blood_type || "");
        setAge(data.age || null);
        setWeight(data.weight || null);
        setLastDonationDate(
          data.last_donation_date ? new Date(data.last_donation_date) : null,
        );
        setIsDonorActive(data.is_donor_active || false);
        setExpoPushToken(data.expo_push_token || "");
        setPreferredAreas(data.preferred_areas || []);
      }

      // Fetch user badges
      const { data: badgesData, error: badgesError } = await supabase
        .from("user_badges")
        .select(
          `
          awarded_at,
          badges (
            id,
            name,
            icon_name
          )
        `,
        )
        .eq("user_id", session?.user.id)
        .order("awarded_at", { ascending: false });

      if (badgesData) {
        const extractedBadges = badgesData.map((b: any) => b.badges);
        setUserBadges(extractedBadges);

        // Learning Modal Auto-Open Logic
        const hasMasterBadge = extractedBadges.some(
          (b) => b.id === "onboarding_master",
        );
        if (!hasMasterBadge) {
          const hasShownModal = await AsyncStorage.getItem(
            "has_shown_learning_modal",
          );
          if (!hasShownModal) {
            setLearningModalVisible(true);
            await AsyncStorage.setItem("has_shown_learning_modal", "true");
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchProfile();
    }
  }, [session]);

  const updateProfile = async () => {
    try {
      setSaving(true);
      if (!session?.user) throw new Error("No user on the session!");

      let currentPushToken = expoPushToken;

      // Request push token if saving and donor is active (or always)
      if (isDonorActive && !currentPushToken) {
        currentPushToken = (await registerForPushNotificationsAsync()) || "";
        setExpoPushToken(currentPushToken);
      }

      const updates = {
        id: session?.user.id,
        full_name: fullName,
        phone,
        blood_type: bloodType,
        age,
        weight,
        last_donation_date: lastDonationDate
          ? lastDonationDate.toISOString()
          : null,
        is_donor_active: isDonorActive,
        expo_push_token: currentPushToken,
        preferred_areas: preferredAreas,
        updated_at: new Date(),
      };

      console.log("Sending updates:", JSON.stringify(updates, null, 2));
      // Debug alert to help user verify the data
      Alert.alert(
        "Debugging Save",
        `Sending ${updates.preferred_areas.length} areas: ${updates.preferred_areas.join(", ")}`,
      );

      const { error } = await supabase
        .from("profiles")
        .upsert(updates);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date: Date) => {
    setLastDonationDate(date);
    hideDatePicker();
  };

  // Area management moved to AreaSelectionModal

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        Alert.alert("Failed to get push token for push notification!");
        return;
      }

      try {
        const projectId = "afc3dced-aa90-48e0-ac5d-de084e31818e"; // from app.json / EAS
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      } catch (e) {
        console.log(e);
      }
    } else {
      Alert.alert("Must use physical device for Push Notifications");
    }

    return token;
  }

  const shareProfile = async () => {
    try {
      if (storyRef.current) {
        setIsSharing(true);
        // Add a small delay to ensure the offscreen view is fully rendered before capture
        setTimeout(async () => {
          try {
            const uri = await captureRef(storyRef, {
              format: "png",
              quality: 1,
            });
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
              await Sharing.shareAsync(uri, {
                dialogTitle: "Share my Blood Donor Profile",
              });
            } else {
              Alert.alert("Error", "Sharing is not available on this device");
            }
          } catch (captureErr) {
            console.error("Oops, snapshot failed", captureErr);
          } finally {
            setIsSharing(false);
          }
        }, 500);
      }
    } catch (error) {
      console.error("Oops, sharing failed", error);
      setIsSharing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ... Header ... */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
              style={{ marginTop: 50 }}
            />
          ) : (
            <View>
              {/* Shareable Profile Card */}
              <View style={styles.cardContainer} ref={cardRef}>
                <LinearGradient
                  colors={["#1A1A1D", "#0B0C10"]} // Sleek dark card
                  style={styles.profileCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Decorative background element */}
                  <View style={styles.decorativeCircle} />

                  <View style={styles.cardHeader}>
                    <View style={styles.avatarBorder}>
                      <View style={styles.avatarInner}>
                        <Image
                          source={require("../../assets/images/icons/cat.png")}
                          style={{ width: 40, height: 40 }}
                          resizeMode="contain"
                        />
                      </View>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardName}>
                        {fullName || "Anonymous Hero"}
                      </Text>
                      <Text style={styles.cardEmail}>
                        {session?.user.email}
                      </Text>
                    </View>

                    {bloodType ? (
                      <View style={styles.bloodTypeContainer}>
                        <Droplet
                          size={14}
                          color={COLORS.primary}
                          fill={COLORS.primary}
                          style={{ marginBottom: 4 }}
                        />
                        <Text style={styles.bloodTypeText}>{bloodType}</Text>
                      </View>
                    ) : null}
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: SPACING.md }}
                    style={{ marginBottom: SPACING.lg }}
                  >
                    <View
                      style={[
                        styles.badgesWrapper,
                        { width: undefined, gap: 12 },
                      ]}
                    >
                      {userBadges.map((badge, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.badgeItem,
                            idx === 0 && styles.activeDonorBadge,
                          ]}
                        >
                          {getIconComponent(
                            badge.icon_name,
                            16,
                            idx === 0 ? COLORS.white : COLORS.primary,
                          )}
                          <Text
                            style={[
                              styles.badgeLabel,
                              idx === 0 && {
                                color: COLORS.white,
                                fontWeight: "700",
                              },
                            ]}
                          >
                            {badge.name}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>

                  <View style={styles.cardFooter}>
                    <Text style={styles.brandText}>PulseThread</Text>
                    <Text style={styles.memberText}>MEMBER CARD</Text>
                  </View>
                </LinearGradient>
              </View>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={shareProfile}
              >
                <LinearGradient
                  colors={[COLORS.primary, "#9B1B24"]} // App-themed red gradient
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.shareButtonGradient}
                >
                  <Share2 size={20} color={COLORS.white} />
                  <Text style={styles.shareButtonText}>
                    Share Profile to Social Media
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.formCard}>
                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                      style={styles.input}
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="John Doe"
                      placeholderTextColor={COLORS.darkGray}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                      style={styles.input}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="+1 234 567 890"
                      placeholderTextColor={COLORS.darkGray}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Blood Type</Text>
                    <TextInput
                      style={styles.input}
                      value={bloodType}
                      onChangeText={setBloodType}
                      placeholder="O+"
                      placeholderTextColor={COLORS.darkGray}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Age</Text>
                    <TextInput
                      style={styles.input}
                      value={age ? String(age) : ""}
                      onChangeText={(text) => setAge(Number(text))}
                      placeholder="e.g. 25"
                      placeholderTextColor={COLORS.darkGray}
                      keyboardType="number-pad"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Weight (kg)</Text>
                    <TextInput
                      style={styles.input}
                      value={weight ? String(weight) : ""}
                      onChangeText={(text) => setWeight(Number(text))}
                      placeholder="e.g. 70"
                      placeholderTextColor={COLORS.darkGray}
                      keyboardType="number-pad"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Last Donation Date</Text>
                    <TouchableOpacity
                      style={styles.input}
                      onPress={showDatePicker}
                    >
                      <Text
                        style={{
                          color: lastDonationDate
                            ? COLORS.text
                            : COLORS.darkGray,
                        }}
                      >
                        {lastDonationDate
                          ? lastDonationDate.toLocaleDateString()
                          : "Select a date"}
                      </Text>
                    </TouchableOpacity>
                    <DateTimePickerModal
                      isVisible={isDatePickerVisible}
                      mode="date"
                      onConfirm={handleConfirm}
                      onCancel={hideDatePicker}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Donor Status</Text>
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        isDonorActive && styles.activeToggle,
                      ]}
                      onPress={() => setIsDonorActive(!isDonorActive)}
                    >
                      <Text
                        style={[
                          styles.toggleText,
                          isDonorActive && styles.activeToggleText,
                        ]}
                      >
                        {isDonorActive
                          ? "Active Donor (Visible on Map)"
                          : "Inactive (Hidden)"}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.helperText}>
                      Enable this to appear to people requesting blood nearby.
                    </Text>
                  </View>

                  {isDonorActive && (
                    <View style={styles.inputGroup}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: SPACING.sm,
                        }}
                      >
                        <Text style={styles.label}>
                          Preferred Donation Areas
                        </Text>
                        <TouchableOpacity
                          onPress={() => setAreaModalVisible(true)}
                          style={styles.manageBtn}
                        >
                          <Text style={styles.manageBtnText}>Manage Areas</Text>
                        </TouchableOpacity>
                      </View>

                      {preferredAreas.length === 0 ? (
                        <TouchableOpacity
                          style={styles.emptyAreasContainer}
                          onPress={() => setAreaModalVisible(true)}
                        >
                          <MapPin size={24} color={COLORS.darkGray} />
                          <Text style={styles.helperText}>
                            No preferred areas added yet. Tap to manage.
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.areasList}>
                          {preferredAreas.map((area) => (
                            <View key={area} style={styles.areaListItem}>
                              <MapPin size={16} color={COLORS.primary} />
                              <Text style={styles.areaListItemText}>
                                {area}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={updateProfile}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Save size={20} color={COLORS.white} />
                        <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.infoLinksContainer}>
                <Link href="/info/privacy" asChild>
                  <TouchableOpacity style={styles.infoLink}>
                    <Text style={styles.infoLinkText}>
                      Privacy & Data Policy
                    </Text>
                    <ChevronRight size={20} color={COLORS.darkGray} />
                  </TouchableOpacity>
                </Link>
                <Link href="/info/conduct" asChild>
                  <TouchableOpacity style={styles.infoLink}>
                    <Text style={styles.infoLinkText}>Code of Conduct</Text>
                    <ChevronRight size={20} color={COLORS.darkGray} />
                  </TouchableOpacity>
                </Link>
                <Link href="/info/about" asChild>
                  <TouchableOpacity style={styles.infoLink}>
                    <Text style={styles.infoLinkText}>About PulseThread</Text>
                    <ChevronRight size={20} color={COLORS.darkGray} />
                  </TouchableOpacity>
                </Link>
                <Link href="/info/legal" asChild>
                  <TouchableOpacity style={styles.infoLink}>
                    <Text style={styles.infoLinkText}>Legal & Liability</Text>
                    <ChevronRight size={20} color={COLORS.darkGray} />
                  </TouchableOpacity>
                </Link>
                <Link href="/info/developer" asChild>
                  <TouchableOpacity style={styles.infoLink}>
                    <Text style={styles.infoLinkText}>The Developer</Text>
                    <ChevronRight size={20} color={COLORS.darkGray} />
                  </TouchableOpacity>
                </Link>
                <Link href="/info/contributors" asChild>
                  <TouchableOpacity style={styles.infoLink}>
                    <Text style={styles.infoLinkText}>Contributors</Text>
                    <ChevronRight size={20} color={COLORS.darkGray} />
                  </TouchableOpacity>
                </Link>
                <Link href="/info/supporters" asChild>
                  <TouchableOpacity style={styles.infoLink}>
                    <Text style={styles.infoLinkText}>Supporters</Text>
                    <ChevronRight size={20} color={COLORS.darkGray} />
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => signOut()}
          >
            <LogOut size={20} color={COLORS.error} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.learningButton}
            onPress={() => setLearningModalVisible(true)}
          >
            <Text style={styles.learningButtonText}>
              Revisit Learning Modules
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sharing Overlay */}
      {isSharing && (
        <View style={styles.sharingOverlay}>
          <View style={styles.sharingLoaderContent}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.sharingText}>Generating Donor Card...</Text>
          </View>
        </View>
      )}

      <LearningModal
        isVisible={isLearningModalVisible}
        onClose={() => setLearningModalVisible(false)}
      />

      <AreaSelectionModal
        isVisible={isAreaModalVisible}
        onClose={() => setAreaModalVisible(false)}
        preferredAreas={preferredAreas}
        onUpdateAreas={setPreferredAreas}
      />

      {/* Hidden Shareable Profile View (9:16 aspect ratio 1080x1920) */}
      <View style={styles.hiddenStoryContainer} pointerEvents="none">
        <View ref={storyRef} collapsable={false} style={styles.storyCanvas}>
          <LinearGradient
            colors={["#0F0F13", "#1A1A24", "#2C1B2E"]} // Deep premium background
            style={styles.storyBackground}
          >
            {/* Header Text */}
            <View style={styles.storyHeader}>
              <Text style={styles.storyTitle}>I am on PulseThread</Text>
              <Text style={styles.storySubtitle}>
                Ready to serve the community.
              </Text>
              <Text style={styles.storyDescription}>
                PulseThread is a community-driven platform connecting blood
                donors with those in urgent need. Join us to save lives
                together.
              </Text>
            </View>

            {/* The Replicated Profile Card for High Res */}
            <View
              style={[
                styles.cardContainer,
                { width: "85%", elevation: 0, shadowOpacity: 0 },
              ]}
            >
              <LinearGradient
                colors={["#1A1A1D", "#0B0C10"]}
                style={[styles.profileCard, { padding: 40, borderRadius: 32 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View
                  style={[
                    styles.decorativeCircle,
                    {
                      width: 250,
                      height: 250,
                      borderRadius: 125,
                      right: -80,
                      top: -80,
                    },
                  ]}
                />

                <View style={[styles.cardHeader, { marginBottom: 40 }]}>
                  <View style={[styles.avatarBorder, { padding: 6 }]}>
                    <View
                      style={[
                        styles.avatarInner,
                        {
                          width: 100,
                          height: 100,
                          borderRadius: 50,
                          borderWidth: 4,
                        },
                      ]}
                    >
                      <Image
                        source={require("../../assets/images/icons/cat.png")}
                        style={{ width: 60, height: 60 }}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text
                      style={[
                        styles.cardName,
                        { fontSize: 42, marginBottom: 8 },
                      ]}
                    >
                      {fullName || "Anonymous Hero"}
                    </Text>
                  </View>
                </View>

                {bloodType ? (
                  <View
                    style={[
                      styles.bloodTypeContainer,
                      {
                        alignSelf: "center",
                        marginBottom: 40,
                        paddingHorizontal: 30,
                        paddingVertical: 15,
                        borderRadius: 24,
                      },
                    ]}
                  >
                    <Droplet
                      size={24}
                      color={COLORS.primary}
                      fill={COLORS.primary}
                      style={{ marginBottom: 8 }}
                    />
                    <Text style={[styles.bloodTypeText, { fontSize: 48 }]}>
                      {bloodType}
                    </Text>
                  </View>
                ) : null}
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 16,
                    justifyContent: "center",
                    marginBottom: 20,
                  }}
                >
                  {userBadges.slice(0, 3).map((badge, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.badgeItem,
                        idx === 0 && styles.activeDonorBadge,
                        {
                          paddingHorizontal: 24,
                          paddingVertical: 14,
                          borderRadius: 30,
                        },
                      ]}
                    >
                      {getIconComponent(
                        badge.icon_name,
                        24,
                        idx === 0 ? COLORS.white : COLORS.primary,
                      )}
                      <Text
                        style={[
                          styles.badgeLabel,
                          { fontSize: 20 },
                          idx === 0 && {
                            color: COLORS.white,
                            fontWeight: "700",
                          },
                        ]}
                      >
                        {badge.name}
                      </Text>
                    </View>
                  ))}
                </View>

                <View
                  style={[styles.cardFooter, { marginTop: 40, paddingTop: 30 }]}
                >
                  <Text style={[styles.brandText, { fontSize: 22 }]}>
                    PulseThread
                  </Text>
                  <Text style={[styles.memberText, { fontSize: 20 }]}>
                    MEMBER CARD
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* QR Codes Section */}
            <View style={styles.qrSection}>
              <Text style={styles.qrCallout}>Join the app too!</Text>
              <View style={styles.qrRow}>
                <View style={styles.qrBox}>
                  <View style={styles.qrWrapper}>
                    <QRCode
                      value="https://forms.gle/rp3aZTDpCJMNFDPC9"
                      size={180}
                      color="#1A1A1D"
                      backgroundColor={COLORS.white}
                    />
                  </View>
                  <Text style={styles.qrLabel}>Android Early Access</Text>
                </View>
                <View style={styles.qrBox}>
                  <View style={styles.qrWrapper}>
                    <QRCode
                      value="https://forms.gle/kkZgmiCeCrXreuD99"
                      size={180}
                      color="#1A1A1D"
                      backgroundColor={COLORS.white}
                    />
                  </View>
                  <Text style={styles.qrLabel}>iOS Wishlist</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... existing styles ...
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  sharingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(11, 12, 16, 0.85)", // Dark semi-transparent
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  sharingLoaderContent: {
    backgroundColor: "#1A1A1D",
    padding: SPACING.xl,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    ...SHADOWS.floating,
  },
  sharingText: {
    color: COLORS.white,
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: "700",
  },
  header: {
    paddingTop: Platform.OS === "web" ? 20 : 60,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  content: {
    padding: SPACING.lg,
  },
  hiddenStoryContainer: {
    position: "absolute",
    top: -20000, // Move way off screen
    left: 0,
    opacity: 0,
  },
  storyCanvas: {
    width: 1080,
    height: 1920,
    backgroundColor: COLORS.white,
  },
  storyBackground: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 120,
  },
  storyHeader: {
    alignItems: "center",
    marginBottom: 80,
  },
  storyTitle: {
    fontSize: 64,
    fontWeight: "900",
    color: COLORS.white,
    textAlign: "center",
    textShadowColor: "rgba(217, 4, 41, 0.8)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
    marginBottom: 16,
  },
  storySubtitle: {
    fontSize: 36,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginBottom: 24,
  },
  storyDescription: {
    fontSize: 28,
    fontWeight: "400",
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    paddingHorizontal: 80,
    lineHeight: 40,
  },
  qrSection: {
    marginTop: 100,
    alignItems: "center",
    width: "100%",
  },
  qrCallout: {
    fontSize: 48,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 50,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  qrRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 80,
  },
  qrBox: {
    alignItems: "center",
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    marginBottom: 20,
    elevation: 5,
  },
  qrLabel: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.white,
    textAlign: "center",
  },
  cardContainer: {
    marginBottom: SPACING.lg,
    borderRadius: 24, // More rounded for modern look
    overflow: "hidden",
    elevation: 10,
    shadowColor: COLORS.primary, // Red glowing shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  profileCard: {
    padding: SPACING.xl,
    borderRadius: 24,
    position: "relative",
  },
  decorativeCircle: {
    position: "absolute",
    right: -50,
    top: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.primary,
    opacity: 0.15,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.xl,
    zIndex: 1, // Above decorative circle
  },
  avatarBorder: {
    padding: 3,
    backgroundColor: "rgba(217, 4, 41, 0.3)", // Subtle red glowing border
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "rgba(217, 4, 41, 0.6)",
  },
  avatarInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1A1A1D", // Dark interior
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardEmail: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  bloodTypeContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  bloodTypeText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: TYPOGRAPHY.sizes.xl,
    textShadowColor: "rgba(217, 4, 41, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  badgesWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    zIndex: 1,
  },
  badgeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)", // Glassmorphism
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  activeDonorBadge: {
    backgroundColor: "rgba(217, 4, 41, 0.2)", // Red tint for hero
    borderColor: "rgba(217, 4, 41, 0.5)",
  },
  badgeLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.xl,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  brandText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: "700",
    letterSpacing: 1,
  },
  memberText: {
    color: "rgba(217, 4, 41, 0.8)",
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: "900",
    letterSpacing: 2,
  },
  shareButton: {
    marginBottom: SPACING.xl,
    ...SHADOWS.button,
    borderRadius: SPACING.sm,
    overflow: "hidden",
  },
  shareButtonGradient: {
    flexDirection: "row",
    padding: SPACING.md,
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.sm,
  },
  shareButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: TYPOGRAPHY.sizes.md,
    letterSpacing: 0.5,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.xl,
    ...SHADOWS.card,
  },
  form: {
    gap: SPACING.lg,
  },
  inputGroup: {
    gap: SPACING.xs,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: "bold",
    color: COLORS.text,
  },
  input: {
    backgroundColor: COLORS.gray,
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  toggleButton: {
    padding: SPACING.md,
    backgroundColor: COLORS.gray,
    borderRadius: SPACING.sm,
    alignItems: "center",
  },
  activeToggle: {
    backgroundColor: COLORS.success + "20", // 20% opacity
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  toggleText: {
    fontWeight: "bold",
    color: COLORS.darkGray,
  },
  activeToggleText: {
    color: COLORS.success,
  },
  helperText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.darkGray,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    alignItems: "center",
    marginTop: SPACING.sm,
    ...SHADOWS.button,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: TYPOGRAPHY.sizes.md,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    marginTop: SPACING.xxl,
    padding: SPACING.md,
  },
  infoLinksContainer: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.white,
    borderRadius: SPACING.md,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  infoLink: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  infoLinkText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
  },
  logoutText: {
    color: COLORS.error,
    fontWeight: "bold",
    fontSize: TYPOGRAPHY.sizes.md,
  },
  learningButton: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.secondary,
    borderRadius: SPACING.sm,
    alignItems: "center",
  },
  learningButtonText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: TYPOGRAPHY.sizes.md,
  },
  // Area Selection Styles
  manageBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 12,
  },
  manageBtnText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: "700",
  },
  emptyAreasContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.gray,
    padding: SPACING.lg,
    borderRadius: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.darkGray + "20",
    marginTop: SPACING.xs,
  },
  areasList: {
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  areaListItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.gray,
    padding: SPACING.md,
    borderRadius: SPACING.sm,
  },
  areaListItemText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
    fontWeight: "500",
  },
});
