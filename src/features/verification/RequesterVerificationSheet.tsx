
import { CheckCircle, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { QRCodeGenerator } from './QRCodeGenerator';

interface RequesterVerificationSheetProps {
  requestId: string;
  visible: boolean;
  onClose: () => void;
}

export const RequesterVerificationSheet = ({ requestId, visible, onClose }: RequesterVerificationSheetProps) => {
  const [activeDonation, setActiveDonation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requestId || !visible) return;

    fetchDonation();

    const subscription = supabase
      .channel(`public:donations:request_id=eq.${requestId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'donations', 
        filter: `request_id=eq.${requestId}` 
      }, (payload) => {
          setActiveDonation(payload.new);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [requestId, visible]);

  const fetchDonation = async () => {
    setLoading(true);
    // Get the latest donation for this request
    const { data, error } = await supabase
      .from('donations')
      .select('*, donor:profiles(*)')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!error && data) {
      setActiveDonation(data);
    }
    setLoading(false);
  };

  const getStepContent = () => {
    if (!activeDonation) {
      return (
        <View style={styles.center}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.statusText}>Waiting for a donor to accept...</Text>
        </View>
      );
    }

    switch (activeDonation.status) {
      case 'EN_ROUTE':
        return (
            <View style={styles.center}>
                <Text style={styles.statusText}>Donor is En Route!</Text>
                <Text style={styles.subText}>{activeDonation.donor?.full_name}</Text>
                <Text style={styles.hint}>Wait for them to arrive to show the first code.</Text>
            </View>
        );
      case 'ARRIVED':
        return (
            <View style={styles.center}>
                <Text style={styles.stepTitle}>Step 1: Arrival</Text>
                <QRCodeGenerator value={`VERIFY_ARRIVAL:${activeDonation.id}`} size={200} />
            </View>
        );
      case 'MATCHED':
        return (
            <View style={styles.center}>
                <Text style={styles.stepTitle}>Step 2: Cross-Match Success</Text>
                <QRCodeGenerator value={`VERIFY_MATCH:${activeDonation.id}`} size={200} />
            </View>
        );
      case 'DONATED':
        return (
             <View style={styles.center}>
                <CheckCircle color={COLORS.success} size={64} />
                <Text style={[styles.statusText, { color: COLORS.success, marginTop: SPACING.md }]}>Donation Complete!</Text>
                <Text style={styles.hint}>Thank you for saving a life.</Text>
            </View>
        );
       default:
        return <Text>Status: {activeDonation.status}</Text>;
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
            <Text style={styles.title}>Donation Status</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={COLORS.text} size={24} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
             {loading ? <ActivityIndicator color={COLORS.primary} /> : getStepContent()}
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
    height: '60%', // Taller for QR
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
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  statusText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.darkGray,
  },
  hint: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  stepTitle: {
      fontSize: TYPOGRAPHY.sizes.xl,
      fontWeight: 'bold',
      color: COLORS.text,
      marginBottom: SPACING.md
  }
});
