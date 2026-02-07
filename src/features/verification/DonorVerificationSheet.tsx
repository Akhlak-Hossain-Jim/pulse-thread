
import { CheckCircle, Scan, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { QRCodeScanner } from './QRCodeScanner';

interface DonorVerificationSheetProps {
  donation: any;
  visible: boolean;
  onClose: () => void;
}

export const DonorVerificationSheet = ({ donation, visible, onClose }: DonorVerificationSheetProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!donation) return null;

  const handleScan = async (data: string) => {
    setIsScanning(false);
    setLoading(true);

    try {
      const [action, donationId] = data.split(':');
      
      if (donationId !== donation.id) {
        throw new Error("Invalid QR Code: Donation ID mismatch");
      }

      let newStatus = '';
      if (action === 'VERIFY_ARRIVAL' && donation.status === 'EN_ROUTE') {
        newStatus = 'ARRIVED';
      } else if (action === 'VERIFY_MATCH' && donation.status === 'ARRIVED') {
        newStatus = 'MATCHED';
      } else {
        throw new Error("Invalid scan for current status");
      }

      const { error } = await supabase
        .from('donations')
        .update({ status: newStatus })
        .eq('id', donationId);

      if (error) throw error;
      Alert.alert('Success', `Status updated to ${newStatus}`);

    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderAction = () => {
    if (loading) return <ActivityIndicator color={COLORS.primary} />;

    switch (donation.status) {
      case 'EN_ROUTE':
        return (
          <TouchableOpacity style={styles.actionButton} onPress={() => setIsScanning(true)}>
            <Scan color={COLORS.white} size={24} />
            <Text style={styles.actionText}>SCAN ARRIVAL QR</Text>
          </TouchableOpacity>
        );
      case 'ARRIVED':
        return (
          <TouchableOpacity style={styles.actionButton} onPress={() => setIsScanning(true)}>
            <Scan color={COLORS.white} size={24} />
            <Text style={styles.actionText}>SCAN MATCH QR</Text>
          </TouchableOpacity>
        );
      case 'MATCHED':
        return (
            <View style={styles.center}>
                <Text style={styles.statusText}>Proceed to Transfusion</Text>
                <Text style={styles.hint}>Wait for hospital staff to complete the procedure.</Text>
            </View>
        );
       case 'DONATED':
        return (
             <View style={styles.center}>
                <CheckCircle color={COLORS.success} size={64} />
                <Text style={[styles.statusText, { color: COLORS.success, marginTop: SPACING.md }]}>Detailed Verified!</Text>
            </View>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      {isScanning ? (
        <QRCodeScanner onScan={handleScan} onClose={() => setIsScanning(false)} />
      ) : (
        <View style={styles.overlay}>
            <View style={styles.sheet}>
            <View style={styles.header}>
                <Text style={styles.title}>Donor Actions</Text>
                <TouchableOpacity onPress={onClose}>
                <X color={COLORS.text} size={24} />
                </TouchableOpacity>
            </View>
            
            <View style={styles.content}>
                 <Text style={styles.statusLabel}>Current Status: <Text style={styles.statusValue}>{donation.status}</Text></Text>
                 <View style={styles.spacer} />
                 {renderAction()}
            </View>
            </View>
        </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SPACING.lg,
    borderTopRightRadius: SPACING.lg,
    padding: SPACING.lg,
    height: '40%',
    ...SHADOWS.floating,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.darkGray,
  },
  statusValue: {
      fontWeight: 'bold',
      color: COLORS.primary
  },
  spacer: {
      height: SPACING.xl
  },
  actionButton: {
      backgroundColor: COLORS.primary,
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.xl,
      borderRadius: SPACING.xxl,
      ...SHADOWS.floating
  },
  actionText: {
      color: COLORS.white,
      fontWeight: 'bold',
      fontSize: TYPOGRAPHY.sizes.md
  },
  center: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  hint: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.darkGray,
    marginTop: SPACING.sm
  }
});
