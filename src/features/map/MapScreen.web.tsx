
import { MapPin } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

export const MapScreen = () => {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <MapPin size={64} color={COLORS.primary} />
                <Text style={styles.title}>Map View Unavailable</Text>
                <Text style={styles.message}>
                    The interactive map feature is optimized for the mobile application. 
                    Please use the mobile app for the best experience.
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    content: {
        alignItems: 'center',
        maxWidth: 400,
        gap: SPACING.lg,
    },
    title: {
        fontSize: TYPOGRAPHY.sizes.xl,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
    },
    message: {
        fontSize: TYPOGRAPHY.sizes.md,
        color: COLORS.darkGray,
        textAlign: 'center',
        lineHeight: 24,
    },
});
