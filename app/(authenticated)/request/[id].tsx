import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock, HeartHandshake, MapPin, Phone, User as UserIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../../src/constants/theme';
import { useAuth } from '../../../src/context/AuthProvider';
import { supabase } from '../../../src/lib/supabase';

export default function RequestDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const [request, setRequest] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id]);

  const fetchDetails = async () => {
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

  const handleHelp = async () => {
      try {
          setLoading(true);
          const { error } = await supabase.from('donations').insert({
              request_id: id,
              donor_id: session?.user.id,
              status: 'EN_ROUTE' 
          });

          if (error) throw error;
          
          Alert.alert("Thank you!", "Your offer to help has been sent.");
          fetchDetails(); // Refresh to show the new response
      } catch (error: any) {
          Alert.alert("Error", error.message);
      } finally {
          setLoading(false);
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

            {request.note && (
                <View style={styles.noteContainer}>
                    <Text style={styles.noteLabel}>Note:</Text>
                    <Text style={styles.noteText}>{request.note}</Text>
                </View>
            )}

            {/* Help Button */}
            {session?.user.id !== request.requester_id && !responses.some(r => r.donor_id === session?.user.id) && (
                <TouchableOpacity style={styles.helpButton} onPress={handleHelp}>
                    <HeartHandshake size={20} color={COLORS.white} />
                    <Text style={styles.helpButtonText}>I CAN HELP</Text>
                </TouchableOpacity>
            )}
        </View>

        {/* Responses Section */}
        <Text style={styles.sectionTitle}>Responses ({responses.length})</Text>
        
        {responses.length === 0 ? (
            <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No donations yet.</Text>
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

      </ScrollView>
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
      color: COLORS.text
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
  }
});
