import { ArrowLeft, CheckCircle, ChevronRight, Clock, User, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { QRCodeGenerator } from './QRCodeGenerator';

interface RequesterVerificationSheetProps {
  requestId: string;
  visible: boolean;
  onClose: () => void;
}

export const RequesterVerificationSheet = ({ requestId, visible, onClose }: RequesterVerificationSheetProps) => {
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState<any[]>([]);
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [showMismatchQR, setShowMismatchQR] = useState(false);

  useEffect(() => {
    if (visible && requestId) {
      fetchDonations();
      const unsubscribe = subscribeToDonations();
      return () => {
        unsubscribe();
      };
    }
  }, [visible, requestId]);

  const fetchDonations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('donations')
      .select(`
        *,
        profiles:donor_id (full_name, phone, blood_type)
      `)
      .eq('request_id', requestId)
      .neq('status', 'CANCELLED') // Don't show cancelled ones
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setDonations(data || []);
      
      // Update selected donation if it exists
      if (selectedDonation && data) {
          const updatedSelected = data.find(d => d.id === selectedDonation.id);
          if (updatedSelected) {
              setSelectedDonation(updatedSelected);
          }
      }
    }
    setLoading(false);
  };

  const subscribeToDonations = () => {
    const channel = supabase.channel(`requester_sheet:${requestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'donations',
          filter: `request_id=eq.${requestId}`,
        },
        () => {
          fetchDonations();
        }
      )
      .subscribe();

    return () => {
       supabase.removeChannel(channel);
    };
  };

  const handleSelectDonation = (donation: any) => {
      setSelectedDonation(donation);
      setShowMismatchQR(false); // Reset toggle
  };

  const handleBackToList = () => {
      setSelectedDonation(null);
  };

  const getStepContent = () => {
    if (!selectedDonation) return null;

    switch (selectedDonation.status) {
      case 'EN_ROUTE':
        return (
            <View style={styles.center}>
                 <Text style={styles.stepTitle}>Step 1: Arrival</Text>
                 <Text style={styles.hint}>Show this QR code to the donor when they arrive at the hospital.</Text>
                 <QRCodeGenerator value={`VERIFY_ARRIVAL:${selectedDonation.id}`} size={200} />
            </View>
        );
      case 'ARRIVED':
        return (
            <View style={styles.center}>
                <Text style={styles.stepTitle}>Step 2: Cross-Match</Text>
                
                <View style={styles.toggleContainer}>
                    <TouchableOpacity 
                        style={[styles.toggleButton, !showMismatchQR && styles.activeToggle]}
                        onPress={() => setShowMismatchQR(false)}
                    >
                        <Text style={[styles.toggleText, !showMismatchQR && styles.activeToggleText]}>Match Success</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                         style={[styles.toggleButton, showMismatchQR && styles.activeToggle]}
                         onPress={() => setShowMismatchQR(true)}
                    >
                        <Text style={[styles.toggleText, showMismatchQR && styles.activeToggleText]}>Match Failed</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.hint}>
                    {showMismatchQR 
                        ? "Scan if blood types DO NOT match." 
                        : "Scan if the cross-match is SUCCESSFUL."}
                </Text>
                
                <QRCodeGenerator 
                    value={showMismatchQR ? `VERIFY_MISMATCH:${selectedDonation.id}` : `VERIFY_MATCH:${selectedDonation.id}`} 
                    size={200} 
                />
            </View>
        );
      case 'MATCHED':
        return (
            <View style={styles.center}>
                <Text style={styles.stepTitle}>Step 3: Donation Complete</Text>
                <Text style={styles.hint}>Show this when the donation is successfully completed.</Text>
                <QRCodeGenerator value={`VERIFY_DONATION:${selectedDonation.id}`} size={200} />
            </View>
        );
       case 'DONATED':
        return (
             <View style={styles.center}>
                <CheckCircle color={COLORS.success} size={64} />
                <Text style={[styles.statusText, { color: COLORS.success, marginTop: SPACING.md }]}>Donation Verified!</Text>
                <Text style={styles.hint}>Thank you for verifying this donation.</Text>
            </View>
        );
      default:
        return (
             <View style={styles.center}>
                <Text>Unknown Status: {selectedDonation.status}</Text>
            </View>
        );
    }
  };

  const renderDonationItem = ({ item }: { item: any }) => (
      <TouchableOpacity style={styles.donationCard} onPress={() => handleSelectDonation(item)}>
          <View style={styles.row}>
              <User size={20} color={COLORS.darkGray} />
              <View style={{ flex: 1 }}>
                  <Text style={styles.donorName}>{item.profiles?.full_name || 'Unknown Donor'}</Text>
                  <Text style={styles.donorMeta}>{item.profiles?.phone || 'No Phone'}</Text>
              </View>
              <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
                  <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
              </View>
              <ChevronRight size={20} color={COLORS.gray} />
          </View>
      </TouchableOpacity>
  );

  const getStatusStyle = (status: string) => {
      switch (status) {
          case 'EN_ROUTE': return { backgroundColor: COLORS.action };
          case 'ARRIVED': return { backgroundColor: COLORS.primary };
          case 'MATCHED': return { backgroundColor: COLORS.secondary };
          case 'DONATED': return { backgroundColor: COLORS.success };
          default: return { backgroundColor: COLORS.gray };
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
            {/* Header */}
          <View style={styles.header}>
            {selectedDonation ? (
                 <TouchableOpacity onPress={handleBackToList} style={{ flexDirection: 'row', alignItems: 'center'}}>
                    <ArrowLeft size={24} color={COLORS.primary} />
                    <Text style={styles.backText}>Back</Text>
                 </TouchableOpacity>
            ) : (
                <Text style={styles.title}>Manage Donations</Text>
            )}
            
            <TouchableOpacity onPress={onClose}>
              <X color={COLORS.text} size={24} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
               {loading ? (
                   <ActivityIndicator color={COLORS.primary} />
               ) : selectedDonation ? (
                    <View style={styles.detailContainer}>
                        <View style={styles.donorHeader}>
                            <Text style={styles.detailName}>{selectedDonation.profiles?.full_name}</Text>
                            <Text style={styles.detailStatus}>{selectedDonation.status.replace('_', ' ')}</Text>
                        </View>
                         {getStepContent()}
                    </View>
               ) : (
                   <FlatList
                        data={donations}
                        renderItem={renderDonationItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Clock size={48} color={COLORS.gray} />
                                <Text style={styles.emptyText}>No active Donor response yet.</Text>
                            </View>
                        }
                   />
               )}
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
    height: '70%',
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
  backText: {
      fontSize: TYPOGRAPHY.sizes.md,
      color: COLORS.primary,
      fontWeight: 'bold',
      marginLeft: 4
  },
  content: {
    flex: 1,
  },
  listContent: {
      gap: SPACING.md
  },
  donationCard: {
      backgroundColor: COLORS.background,
      padding: SPACING.md,
      borderRadius: SPACING.sm,
      borderWidth: 1,
      borderColor: COLORS.gray
  },
  row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md
  },
  donorName: {
      fontSize: TYPOGRAPHY.sizes.md,
      fontWeight: 'bold',
      color: COLORS.text
  },
  donorMeta: {
      fontSize: TYPOGRAPHY.sizes.sm,
      color: COLORS.darkGray
  },
  statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12
  },
  statusText: {
      fontSize: TYPOGRAPHY.sizes.xs,
      fontWeight: 'bold',
      color: COLORS.white
  },
  detailContainer: {
      flex: 1,
      alignItems: 'center'
  },
  donorHeader: {
      alignItems: 'center',
      marginBottom: SPACING.xl
  },
  detailName: {
      fontSize: TYPOGRAPHY.sizes.lg,
      fontWeight: 'bold',
      color: COLORS.text
  },
  detailStatus: {
      fontSize: TYPOGRAPHY.sizes.md,
      color: COLORS.darkGray,
      marginTop: 4
  },
  center: {
    alignItems: 'center',
    width: '100%',
  },
  stepTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  hint: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACING.xl,
      gap: SPACING.md
  },
  emptyText: {
      color: COLORS.darkGray,
      fontSize: TYPOGRAPHY.sizes.md
  },
  toggleContainer: {
      flexDirection: 'row',
      backgroundColor: COLORS.background,
      borderRadius: SPACING.md,
      padding: 4,
      marginBottom: SPACING.md
  },
  toggleButton: {
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.lg,
      borderRadius: SPACING.sm
  },
  activeToggle: {
      backgroundColor: COLORS.white,
      ...SHADOWS.card
  },
  toggleText: {
      color: COLORS.darkGray,
      fontWeight: 'bold'
  },
  activeToggleText: {
      color: COLORS.primary
  }
});
