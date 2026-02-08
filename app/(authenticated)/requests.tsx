import { useRouter } from 'expo-router';
import { Calendar, Droplet, HeartHandshake, MapPin } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthProvider';
import { supabase } from '../../src/lib/supabase';

export default function RequestsScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = async () => {
    try {
      if (!session?.user) return;
      
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          profiles:requester_id (
            full_name,
            phone
          ),
          donations(status)
        `)
        .eq('status', 'PENDING')
        .neq('requester_id', session.user.id) // Don't show own requests
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
      } else {
        // Filter out requests that have enough active donors
        const filtered = (data || []).filter((req: any) => {
             const activeDonations = req.donations?.filter((d: any) => d.status !== 'CANCELLED') || [];
             return activeDonations.length < req.units_needed;
        });
        setRequests(filtered);
      }
    } catch (e) {
      console.error('Exception fetching requests:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [session]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleHelp = (requestId: string) => {
    router.push(`/request/${requestId}`);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.profiles?.full_name || 'Unknown User'}</Text>
            <View style={styles.badge}>
                <Droplet size={12} color={COLORS.white} fill={COLORS.white} />
                <Text style={styles.badgeText}>{item.blood_type}</Text>
            </View>
        </View>
        <Text style={styles.timeAgo}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
            <MapPin size={16} color={COLORS.darkGray} />
            <Text style={styles.infoText}>{item.hospital_name || 'Unknown Hospital'}</Text>
        </View>
        <View style={styles.infoRow}>
            <Calendar size={16} color={COLORS.darkGray} />
            <Text style={styles.infoText}>Needed by: {item.urgency || 'ASAP'}</Text>
        </View>
        {item.note && (
            <Text style={styles.note} numberOfLines={2}>
                &quot;{item.note}&quot;
            </Text>
        )}
        <View style={styles.statsRow}>
          <Text style={styles.statText}>Needed: {item.units_needed || 1}</Text>
          <View style={styles.statDivider} />
          <Text style={styles.statText}>Responses: {item.donations?.filter((d: any) => d.status !== 'CANCELLED').length || 0}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.helpButton}
        onPress={() => handleHelp(item.id)}
      >
        <HeartHandshake size={20} color={COLORS.white} />
        <Text style={styles.helpButtonText}>I CAN HELP</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Blood Requests</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No pending requests at the moment.</Text>
                <Text style={styles.emptySubText}>Check back later or check the map!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SPACING.md,
    padding: SPACING.lg,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md
  },
  userName: {
      fontSize: TYPOGRAPHY.sizes.md,
      fontWeight: 'bold',
      color: COLORS.text
  },
  badge: {
      backgroundColor: COLORS.primary,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4
  },
  badgeText: {
      color: COLORS.white,
      fontWeight: 'bold',
      fontSize: TYPOGRAPHY.sizes.xs
  },
  timeAgo: {
      color: COLORS.darkGray,
      fontSize: TYPOGRAPHY.sizes.xs
  },
  cardContent: {
      gap: SPACING.sm,
      marginBottom: SPACING.lg
  },
  infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm
  },
  infoText: {
      color: COLORS.darkGray,
      fontSize: TYPOGRAPHY.sizes.sm
  },
  note: {
      fontStyle: 'italic',
      color: COLORS.darkGray,
      marginTop: SPACING.xs
  },
  helpButton: {
      backgroundColor: COLORS.success,
      borderRadius: SPACING.sm,
      padding: SPACING.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.sm,
      ...SHADOWS.button
  },
  helpButtonText: {
      color: COLORS.white,
      fontWeight: 'bold',
      fontSize: TYPOGRAPHY.sizes.md
  },
  emptyState: {
      padding: SPACING.xxl,
      alignItems: 'center',
      gap: SPACING.sm
  },
  emptyText: {
      fontSize: TYPOGRAPHY.sizes.lg,
      fontWeight: 'bold',
      color: COLORS.text,
      textAlign: 'center'
  },
  emptySubText: {
      fontSize: TYPOGRAPHY.sizes.md,
      color: COLORS.darkGray,
      textAlign: 'center'
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondary,
    padding: SPACING.sm,
    borderRadius: SPACING.sm,
    marginTop: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  statText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: 'bold'
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: COLORS.primary,
    opacity: 0.2
  }
});
