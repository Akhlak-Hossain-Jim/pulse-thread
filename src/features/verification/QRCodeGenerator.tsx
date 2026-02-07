
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  label?: string;
}

export const QRCodeGenerator = ({ value, size = 200, label }: QRCodeGeneratorProps) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.qrContainer}>
        <QRCode value={value} size={size} />
      </View>
      <Text style={styles.hint}>Show this to the donor/requester to verify</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  qrContainer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: SPACING.md,
    elevation: 4,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  hint: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.darkGray,
  },
});
