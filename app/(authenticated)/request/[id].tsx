import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock, HeartHandshake, MapPin, Navigation, Phone, User as UserIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../../src/constants/theme';
import { useAuth } from '../../../src/context/AuthProvider';
import { AcceptSheet } from '../../../src/features/donor/AcceptSheet';
import { supabase } from '../../../src/lib/supabase';

export default function RequestDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const [request, setRequest] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isRequester = session?.user.id === request?.requester_id;
  const myDonation = responses.find(r => r.donor_id === session?.user.id);
  const isActiveDonor = !!myDonation;

  const [showAcceptSheet, setShowAcceptSheet] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id]);

  const fetchDetails = async () => {
    // ... (keep existing fetch logic) ...
    try {
      setLoading(true);
      
      // Fetch Request Details
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .select('*')
        .eq('id', id)
        .single();

      if (requestError) throw requestError;
      setRequest(requestData);

      // Fetch Responses (Donations)
      const { data: responsesData, error: responsesError } = await supabase
        .from('donations')
        .select(`
            *,
            profiles:donor_id (
                full_name,
                phone,
                blood_type
            )
        `)
        .eq('request_id', id)
        .order('created_at', { ascending: false });

      if (!responsesError && responsesData) {
        setResponses(responsesData);
      }
    } catch (error) {
      console.error('Error fetching details:', error);
      Alert.alert('Error', 'Could not load request details.');
    } finally {
      setLoading(false);
    }
  };

  const handleHelp = () => {
      setShowAcceptSheet(true);
  };

  const handleCancelDonation = async () => {
      if (!cancelReason.trim()) {
          Alert.alert("Required", "Please provide a reason for cancellation.");
          return;
      }

      setCancelling(true);
      try {
          if (!myDonation) return;

          const { error } = await supabase
            .from('donations')
            .update({ 
                status: 'CANCELLED',
                cancellation_reason: cancelReason,
                timeline_logs: [...(myDonation.timeline_logs || []), { status: 'CANCELLED', timestamp: new Date().toISOString() }]
            })
            .eq('id', myDonation.id);

          if (error) throw error;

          Alert.alert("Cancelled", "Your response has been cancelled.");
          setShowCancelModal(false);
          setCancelReason('');
          fetchDetails();
      } catch (error: any) {
          Alert.alert("Error", error.message);
      } finally {
          setCancelling(false);
      }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'PENDING': return COLORS.action;
        case 'ACCEPTED': return COLORS.primary;
        case 'FULFILLED': return COLORS.success;
        default: return COLORS.darkGray;
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!request) {
      return (
          <View style={styles.centered}>
              <Text>Request not found.</Text>
          </View>
      )
  }

  return (
    <View style={styles.container}>
      {/* Custom Header for back navigation if needed, or rely on Expo Router Stack if configured */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
             <ArrowLeft size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Request Info Card */}
        <View style={styles.card}>
            <View style={styles.statusBadgeContainer}>
                 <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                    <Text style={styles.statusText}>{request.status}</Text>
                 </View>
                 <Text style={styles.dateText}>{new Date(request.created_at).toLocaleDateString()}</Text>
            </View>

            <Text style={styles.bloodType}>{request.blood_type} Blood Request</Text>
            {request.component_type && (
                <View style={styles.chip}>
                    <Text style={styles.chipText}>{request.component_type}</Text>
                </View>
            )}
            
            <View style={styles.infoRow}>
                <MapPin size={18} color={COLORS.darkGray} />
                <Text style={styles.infoText}>{request.hospital_name}</Text>
            </View>

             <View style={styles.infoRow}>
                <Clock size={18} color={COLORS.darkGray} />
                <Text style={styles.infoText}>Urgency: {request.urgency}</Text>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Units Needed</Text>
                    <Text style={styles.statValue}>{request.units_needed || 1}</Text>
                </View>
                <View style={styles.statDivider} />
                 <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Active Responses</Text>
                    <Text style={styles.statValue}>
                        {responses.filter(r => r.status !== 'CANCELLED' && r.status !== 'FULFILLED').length}
                    </Text>
                </View>
            </View>

            {request.note && (
                <View style={styles.noteContainer}>
                    <Text style={styles.noteLabel}>Note:</Text>
                    <Text style={styles.noteText}>{request.note}</Text>
                </View>
            )}

            {/* Role-Based Actions */}
            {isRequester ? (
                <View style={styles.requesterInfo}>
                   <Text style={{ color: COLORS.darkGray, fontStyle: 'italic'}}>You requested this.</Text>
                </View>
            ) : isActiveDonor ? (
                <TouchableOpacity 
                    style={[styles.helpButton, { backgroundColor: COLORS.action }]} 
                    onPress={() => router.push('/(authenticated)/map')}
                >
                    <Navigation size={20} color={COLORS.white} />
                    <Text style={styles.helpButtonText}>NAVIGATE TO HOSPITAL</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={styles.helpButton} onPress={handleHelp}>
                    <HeartHandshake size={20} color={COLORS.white} />
                    <Text style={styles.helpButtonText}>I CAN HELP</Text>
                </TouchableOpacity>
            )}
        </View>

        {/* Responses Section - Only for Requester or maybe showing count for others */}
        {isRequester && (
            <>
                <Text style={styles.sectionTitle}>Responses ({responses.length})</Text>
                
                {responses.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>You haven&apos;t received any donors yet.</Text>
                    </View>
                ) : (
                    <View style={styles.responsesList}>
                        {responses.map((resp) => (
                            <View key={resp.id} style={styles.responseCard}>
                                <View style={styles.responseHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8}}>
                                        <UserIcon size={20} color={COLORS.text} />
                                        <Text style={styles.responderName}>{resp.profiles?.full_name || 'Unknown Helper'}</Text>
                                    </View>
                                    <Text style={styles.responseDate}>{new Date(resp.created_at).toLocaleDateString()}</Text>
                                </View>
                                
                                {resp.profiles?.phone && (
                                    <TouchableOpacity style={styles.phoneRow}>
                                        <Phone size={16} color={COLORS.primary} />
                                        <Text style={styles.phoneText}>{resp.profiles.phone}</Text>
                                    </TouchableOpacity>
                                )}

                                <View style={styles.responseStatus}>
                                    <Text style={[styles.responseStatusText, { color: getStatusColor(resp.status || 'PENDING') }]}>
                                        Status: {resp.status || 'PENDING'}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </>
        )}

        {/* For Active Donor - Show their specific status */}
        {isActiveDonor && (
             <View style={styles.activeDonationCard}>
                <Text style={styles.sectionTitle}>Your Donation Status</Text>
                <View style={[styles.responseStatus, { marginTop: 10 }]}>
                    <Text style={[styles.responseStatusText, { color: getStatusColor(myDonation?.status || 'PENDING') }]}>
                        {myDonation?.status || 'PENDING'}
                    </Text>
                </View>
                <Text style={styles.helperText}>
                    Thank you for helping! Please make your way to the location.
                </Text>
                
                {myDonation?.status !== 'CANCELLED' && myDonation?.status !== 'FULFILLED' && (
                    <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={() => setShowCancelModal(true)}
                    >
                        <Text style={styles.cancelButtonText}>Cancel Response</Text>
                    </TouchableOpacity>
                )}
             </View>
        )}

      </ScrollView>

      <AcceptSheet
        visible={showAcceptSheet}
        request={request}
        onClose={() => setShowAcceptSheet(false)}
        onSuccess={() => {
            fetchDetails();
            router.push('/(authenticated)/map');
        }}
      />

      {/* Cancellation Modal */}
      <Modal
        visible={showCancelModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCancelModal(false)}
      >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Cancel Response</Text>
                  <Text style={styles.modalSubtitle}>Please let us know why you can&apos;t allowhelp anymore.</Text>
                  
                  <TextInput
                    style={styles.reasonInput}
                    placeholder="Reason (e.g., Car trouble, Emergency...)"
                    value={cancelReason}
                    onChangeText={setCancelReason}
                    multiline
                  />

                  <View style={styles.modalActions}>
                      <TouchableOpacity 
                        style={styles.modalButtonSecondary}
                        onPress={() => setShowCancelModal(false)}
                      >
                          <Text style={styles.modalButtonTextSecondary}>Keep Helping</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.modalButtonDestructive}
                        onPress={handleCancelDonation}
                        disabled={cancelling}
                      >
                          {cancelling ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.modalButtonTextDestructive}>Confirm Cancel</Text>}
                      </TouchableOpacity>
                  </View>
              </View>
          </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
    gap: SPACING.md
  },
  backButton: {
      padding: 4
  },
  headerTitle: {
      fontSize: TYPOGRAPHY.sizes.xl,
      fontWeight: 'bold',
      color: COLORS.primary
  },
  content: {
      padding: SPACING.lg,
      gap: SPACING.lg
  },
  card: {
      backgroundColor: COLORS.white,
      padding: SPACING.lg,
      borderRadius: SPACING.md,
      ...SHADOWS.card,
      gap: SPACING.md
  },
  statusBadgeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
  },
  statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 16
  },
  statusText: {
      color: COLORS.white,
      fontWeight: 'bold',
      fontSize: TYPOGRAPHY.sizes.xs
  },
  dateText: {
      color: COLORS.darkGray,
      fontSize: TYPOGRAPHY.sizes.xs
  },
  bloodType: {
      fontSize: TYPOGRAPHY.sizes.xl,
      fontWeight: 'bold',
      color: COLORS.text
  },
  infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm
  },
  infoText: {
      fontSize: TYPOGRAPHY.sizes.md,
      color: COLORS.text,
      flex: 1
  },
  statsRow: {
      flexDirection: 'row',
      backgroundColor: COLORS.secondary,
      borderRadius: SPACING.md,
      padding: SPACING.md,
      marginTop: SPACING.sm,
      justifyContent: 'space-around',
      alignItems: 'center'
  },
  statItem: {
      alignItems: 'center',
      gap: 4
  },
  statLabel: {
      fontSize: TYPOGRAPHY.sizes.xs,
      color: COLORS.darkGray,
      textTransform: 'uppercase',
      fontWeight: 'bold'
  },
  statValue: {
      fontSize: TYPOGRAPHY.sizes.lg,
      color: COLORS.primary,
      fontWeight: 'bold'
  },
  statDivider: {
      width: 1,
      height: '80%',
      backgroundColor: COLORS.gray
  },
  noteContainer: {
      marginTop: SPACING.sm,
      backgroundColor: COLORS.gray,
      padding: SPACING.md,
      borderRadius: SPACING.sm
  },
  noteLabel: {
      fontSize: TYPOGRAPHY.sizes.xs,
      fontWeight: 'bold',
      color: COLORS.darkGray,
      marginBottom: 4
  },
  noteText: {
      fontSize: TYPOGRAPHY.sizes.md,
      color: COLORS.text,
      fontStyle: 'italic'
  },
  sectionTitle: {
      fontSize: TYPOGRAPHY.sizes.lg,
      fontWeight: 'bold',
      color: COLORS.text
  },
  emptyState: {
      padding: SPACING.xl,
      alignItems: 'center'
  },
  emptyText: {
      color: COLORS.darkGray,
      fontStyle: 'italic'
  },
  responsesList: {
      gap: SPACING.md
  },
  responseCard: {
      backgroundColor: COLORS.white,
      padding: SPACING.md,
      borderRadius: SPACING.sm,
      borderWidth: 1,
      borderColor: COLORS.gray,
      gap: SPACING.sm
  },
  responseHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
  },
  responderName: {
      fontWeight: 'bold',
      fontSize: TYPOGRAPHY.sizes.md,
      color: COLORS.text
  },
  responseDate: {
      fontSize: TYPOGRAPHY.sizes.xs,
      color: COLORS.darkGray
  },
  phoneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      marginTop: 4
  },
  phoneText: {
      color: COLORS.primary,
      fontWeight: 'bold'
  },
  responseStatus: {
      marginTop: 4
  },
  responseStatusText: {
      fontSize: TYPOGRAPHY.sizes.xs,
      fontWeight: 'bold'
  },
  chip: {
      backgroundColor: COLORS.secondary,
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      marginBottom: SPACING.sm
  },
  chipText: {
      color: COLORS.primary,
      fontSize: TYPOGRAPHY.sizes.xs,
      fontWeight: 'bold'
  },
  helpButton: {
      backgroundColor: COLORS.success,
      borderRadius: SPACING.sm,
      padding: SPACING.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.sm,
      marginTop: SPACING.md,
      ...SHADOWS.button
  },
  helpButtonText: {
      color: COLORS.white,
      fontWeight: 'bold',
      fontSize: TYPOGRAPHY.sizes.md
  },
  requesterInfo: {
      marginTop: SPACING.md,
      padding: SPACING.md,
      backgroundColor: COLORS.gray,
      borderRadius: SPACING.sm,
      alignItems: 'center'
  },
  activeDonationCard: {
      backgroundColor: COLORS.white,
      padding: SPACING.lg,
      borderRadius: SPACING.md,
      ...SHADOWS.card
  },
  helperText: {
      marginTop: SPACING.sm,
      color: COLORS.darkGray,
      fontSize: TYPOGRAPHY.sizes.sm
  },
  cancelButton: {
      marginTop: SPACING.md,
      padding: SPACING.sm,
      alignSelf: 'flex-start'
  },
  cancelButtonText: {
      color: COLORS.error,
      fontSize: TYPOGRAPHY.sizes.sm,
      textDecorationLine: 'underline'
  },
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: SPACING.lg
  },
  modalContent: {
      backgroundColor: COLORS.white,
      padding: SPACING.lg,
      borderRadius: SPACING.md,
      ...SHADOWS.card
  },
  modalTitle: {
      fontSize: TYPOGRAPHY.sizes.lg,
      fontWeight: 'bold',
      color: COLORS.text,
      marginBottom: SPACING.xs
  },
  modalSubtitle: {
      fontSize: TYPOGRAPHY.sizes.sm,
      color: COLORS.darkGray,
      marginBottom: SPACING.md
  },
  reasonInput: {
      borderWidth: 1,
      borderColor: COLORS.gray,
      borderRadius: SPACING.sm,
      padding: SPACING.md,
      height: 100,
      marginBottom: SPACING.lg,
      textAlignVertical: 'top'
  },
  modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: SPACING.md
  },
  modalButtonSecondary: {
      padding: SPACING.md,
      borderRadius: SPACING.sm,
      backgroundColor: COLORS.gray
  },
  modalButtonTextSecondary: {
      color: COLORS.text,
      fontWeight: 'bold'
  },
  modalButtonDestructive: {
      padding: SPACING.md,
      borderRadius: SPACING.sm,
      backgroundColor: COLORS.error,
      minWidth: 100,
      alignItems: 'center'
  },
  modalButtonTextDestructive: {
      color: COLORS.white,
      fontWeight: 'bold'
  }
});
