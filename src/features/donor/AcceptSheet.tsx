
import { Navigation, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useAuth } from '../../context/AuthProvider';
import { supabase } from '../../lib/supabase';

interface AcceptSheetProps {
  request: any | null; // Replace 'any' with proper type from database
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AcceptSheet = ({ request, visible, onClose, onSuccess }: AcceptSheetProps) => {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!request) return null;

  const handleAccept = async () => {
    if (!session) return;

    setLoading(true);
    try {
      // 1. Create Donation Record
      const { error: donationError } = await supabase.from('donations').insert({
        request_id: request.id,
        donor_id: session.user.id,
        status: 'EN_ROUTE',
        timeline_logs: [{ status: 'EN_ROUTE', timestamp: new Date().toISOString() }],
      });

      if (donationError) throw donationError;

      // 2. Update Request Status
      const { error: requestError } = await supabase
        .from('requests')
        .update({ status: 'ACCEPTED' })
        .eq('id', request.id);

      if (requestError) throw requestError;

      Alert.alert('Accepted!', 'Please proceed to the hospital. Navigation starting...');
      if (onSuccess) onSuccess();
      onClose();
      // In a real app, we would trigger navigation here
    } catch (error: any) {
      Alert.alert('Error', error.message);
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SPACING.lg,
    borderTopRightRadius: SPACING.lg,
    padding: SPACING.lg,
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
    gap: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontWeight: '600',
    color: COLORS.text,
  },
  valueHighlight: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  button: {
    backgroundColor: COLORS.action,
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  btnContent: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: TYPOGRAPHY.sizes.md,
  },
});
