
import { CheckCircle, Scan, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Linking, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { PlatformAlert } from '../../lib/platformAlert';
import { supabase } from '../../lib/supabase';
import { QRCodeScanner } from './QRCodeScanner';

interface DonorVerificationSheetProps {
  donation: any;
  visible: boolean;
  onClose: () => void;
  onVerifySuccess?: () => void;
}

export const DonorVerificationSheet = ({ donation, visible, onClose, onVerifySuccess }: DonorVerificationSheetProps) => {
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
      let cancelReason = null;

      if (action === 'VERIFY_ARRIVAL' && donation.status === 'EN_ROUTE') {
        newStatus = 'ARRIVED';
      } else if (action === 'VERIFY_MATCH' && donation.status === 'ARRIVED') {
        newStatus = 'MATCHED';
      } else if (action === 'VERIFY_MISMATCH' && donation.status === 'ARRIVED') {
        newStatus = 'CANCELLED';
        cancelReason = 'Cross-match Failed';
      } else if (action === 'VERIFY_DONATION' && donation.status === 'MATCHED') {
         newStatus = 'DONATED';
      } else {
        throw new Error("Invalid scan for current status");
      }

      const updateData: any = { status: newStatus };
      if (cancelReason) {
          updateData.cancellation_reason = cancelReason;
      }

      const { error } = await supabase
        .from('donations')
        .update(updateData)
        .eq('id', donationId);

      if (error) throw error;

      // Check for auto-fulfillment if donation completed
      if (newStatus === 'DONATED' && donation.request_id) {
          const { count } = await supabase
            .from('donations')
            .select('*', { count: 'exact', head: true })
            .eq('request_id', donation.request_id)
            .eq('status', 'DONATED');
          
           const { data: reqData } = await supabase
            .from('requests')
            .select('units_needed')
            .eq('id', donation.request_id)
            .single();

           if (reqData && count && count >= reqData.units_needed) {
               await supabase
                .from('requests')
                .update({ status: 'FULFILLED' })
                .eq('id', donation.request_id);
           }
      }

      PlatformAlert.alert('Success', `Status updated to ${newStatus}`, [
          { text: 'OK', onPress: () => onVerifySuccess?.() }
      ]);

    } catch (error: any) {
      PlatformAlert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const openMaps = () => {
      const scheme = Platform.select({ ios: 'maps:', android: 'geo:' });
      let lat = 0;
      let lng = 0;

      if (donation.request?.location) {
        // Try to parse POINT(lng lat)
        const matches = donation.request.location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
        if (matches) {
            lng = parseFloat(matches[1]);
            lat = parseFloat(matches[2]);
        }
      }
      
      const label = donation.request?.hospital_name || 'Hospital';
      const url = Platform.select({
        ios: `${scheme}?q=${label}&ll=${lat},${lng}`,
        android: `${scheme}0,0?q=${lat},${lng}(${label})`
      });

      if (url) {
          Linking.openURL(url);
      }
  };

  const renderAction = () => {
    if (loading) return <ActivityIndicator color={COLORS.primary} />;

    switch (donation.status) {
      case 'EN_ROUTE':
        return (
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={() => setIsScanning(true)}>
                <Scan color={COLORS.white} size={24} />
                <Text style={styles.actionText}>SCAN ARRIVAL QR</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={openMaps}>
                <Text style={[styles.actionText, styles.secondaryButtonText]}>NAVIGATE TO HOSPITAL</Text>
            </TouchableOpacity>
          </View>
        );
      case 'ARRIVED':
        return (
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={() => setIsScanning(true)}>
                <Scan color={COLORS.white} size={24} />
                <Text style={styles.actionText}>SCAN MATCH SUCCESS</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: COLORS.error }]} 
                onPress={() => setIsScanning(true)}
            >
                <X color={COLORS.white} size={24} />
                <Text style={styles.actionText}>SCAN MATCH FAILED</Text>
            </TouchableOpacity>
          </View>
        );
      case 'MATCHED':
        return (
            <View style={styles.center}>
                <Text style={styles.statusText}>Proceed to Transfusion</Text>
                <Text style={styles.hint}>Wait for hospital staff to complete the procedure.</Text>
                
                <TouchableOpacity 
                    style={[styles.actionButton, { marginTop: SPACING.lg, backgroundColor: COLORS.success }]} 
                    onPress={() => setIsScanning(true)}
                >
                    <CheckCircle color={COLORS.white} size={24} />
                    <Text style={styles.actionText}>SCAN DONATION COMPLETE</Text>
                </TouchableOpacity>
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
  actionContainer: {
      gap: SPACING.md,
      width: '100%',
      alignItems: 'center'
  },
  secondaryButton: {
      backgroundColor: COLORS.white,
      borderWidth: 2,
      borderColor: COLORS.primary
  },
  secondaryButtonText: {
      color: COLORS.primary
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
    marginTop: SPACING.sm,
    textAlign: 'center'
  }
});
