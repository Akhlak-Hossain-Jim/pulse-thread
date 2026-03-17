import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PagerView from "react-native-pager-view";
import { COLORS, SPACING, TYPOGRAPHY } from "../src/constants/theme";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    title: "Welcome to PulseThread",
    description:
      "The community-driven Uber for Blood Donation. Connecting heroes with those in critical need instantly.",
    image:
      "https://images.unsplash.com/photo-1615461066841-6116e61058f4?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "Fast & Reliable",
    description:
      "Request blood exactly when you need it. Our system automatically alerts nearby available donors.",
    image:
      "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "Be a Hero",
    description:
      "Sign up to donate, track your impact, and earn badges as you help save lives in your community.",
    image:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1000&auto=format&fit=crop",
  },
];

export default function WelcomeSliders() {
  const router = useRouter();
  const [activePage, setActivePage] = useState(0);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <PagerView
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={(e) => setActivePage(e.nativeEvent.position)}
      >
        {SLIDES.map((slide, index) => (
          <View key={slide.id} style={styles.page}>
            <ImageBackground
              source={{ uri: slide.image }}
              style={styles.backgroundImage}
              resizeMode="cover"
            >
              {/* Dark overlay for text readability */}
              <View style={styles.overlay} />

              <View style={styles.contentContainer}>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.description}>{slide.description}</Text>
              </View>
            </ImageBackground>
          </View>
        ))}
      </PagerView>

      {/* Pagination Indicators */}
      <View style={styles.paginationContainer}>
        {SLIDES.map((_, index) => (
          <View
            key={`dot-${index}`}
            style={[styles.dot, activePage === index && styles.activeDot]}
          />
        ))}
      </View>

      {/* Bottom Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/auth")}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/auth")}
        >
          <Text style={styles.secondaryButtonText}>
            I already have an account
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Darken background to make text pop
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
    marginTop: height * 0.2, // Push text down a bit
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: SPACING.md,
    lineHeight: 48,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 28,
  },
  paginationContainer: {
    position: "absolute",
    bottom: height * 0.22,
    flexDirection: "row",
    alignSelf: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  activeDot: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  actionsContainer: {
    position: "absolute",
    bottom: SPACING.xl,
    left: SPACING.lg,
    right: SPACING.lg,
    gap: SPACING.md,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: SPACING.md,
    alignItems: "center",
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: "bold",
  },
  secondaryButton: {
    paddingVertical: SPACING.md,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: SPACING.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: "600",
  },
});
