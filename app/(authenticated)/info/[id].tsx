import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ExternalLink } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../../src/constants/theme';
import { INFO_CONTENT } from '../../../src/data/infoConfig';

export default function InfoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Safely fallback if route doesn't match
  const content = INFO_CONTENT[id as keyof typeof INFO_CONTENT] || {
    title: 'Info Page',
    sections: [{ heading: 'Not Found', text: 'This information page could not be found.' }]
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch((err) => console.error("Couldn't load page", err));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{content.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {content.sections.map((section, index) => (
          <View key={index} style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionText}>{section.text}</Text>
          </View>
        ))}

        {content.links && content.links.length > 0 && (
          <View style={styles.linksSection}>
            <Text style={styles.linksHeader}>Quick Links</Text>
            <View style={styles.linksGrid}>
              {content.links.map((link, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.linkButton}
                  onPress={() => handleOpenLink(link.url)}
                >
                  <View style={styles.linkContent}>
                    <Text style={styles.linkLabel} numberOfLines={1}>{link.label}</Text>
                    <ExternalLink size={16} color={COLORS.white} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 60,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 20,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  sectionHeading: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  sectionText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
    lineHeight: 24,
    opacity: 0.8,
  },
  linksSection: {
    marginTop: SPACING.lg,
  },
  linksHeader: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.md,
    paddingLeft: 4,
  },
  linksGrid: {
    gap: SPACING.sm,
  },
  linkButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.button,
  },
  linkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  linkLabel: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: 'bold',
    flex: 1,
  },
});
