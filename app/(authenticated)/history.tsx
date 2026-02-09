import { useRouter } from 'expo-router';
import { Droplet, HeartHandshake, History as HistoryIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthProvider';
import { supabase } from '../../src/lib/supabase';

type ViewMode = 'requests' | 'donations';

export default function HistoryScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('requests');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (session) {
        fetchHistory();
    } else {
        setLoading(false);
    }
  }, [session, viewMode]);

  const fetchHistory = async () => {
      setLoading(true);
      try {
        let result;
        
        if (viewMode === 'requests') {
            result = await supabase
                .from('requests')
                .select('*, donations(status)')
                .eq('requester_id', session?.user.id)
                .order('created_at', { ascending: false });
        } else {
            result = await supabase
                .from('donations')
                .select('*, request:requests(*)')
                .eq('donor_id', session?.user.id)
                .order('created_at', { ascending: false });
        }
        
        if (!result.error && result.data) {
            setData(result.data);
        }
      } catch (error) {
          console.error(error);
      } finally {
          setLoading(false);
          setRefreshing(false);
      }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'PENDING': return COLORS.action;
          case 'ACCEPTED': return COLORS.primary; // Active
          case 'FULFILLED': return COLORS.success;
          case 'EN_ROUTE': return COLORS.action;
          case 'ARRIVED': return COLORS.primary; // Active
          case 'MATCHED': return COLORS.secondary; // Waiting
          case 'DONATED': return COLORS.success;
          case 'CANCELLED': return COLORS.error;
          default: return COLORS.darkGray;
      }
  };

  const renderItem = ({ item }: { item: any }) => {
      const isRequest = viewMode === 'requests';
      // For donations, we show the request details
      const displayItem = isRequest ? item : item.request;
      // As donation, use donation status, else request status
      const status = isRequest ? item.status : item.status; 
      
      // Calculate stats for requests
      const needed = displayItem?.units_needed || 1;
      const responses = isRequest && item.donations 
          ? item.donations.filter((d: any) => d.status !== 'CANCELLED').length 
          : 0; 

      if (!displayItem) return null; // Handle case where request might be null for donation

      return (
        <TouchableOpacity 
            style={styles.historyCard}
            onPress={() => router.push(`/request/${displayItem.id}`)}
        >
            <View style={styles.historyHeader}>
                <View style={[styles.historyBadge, { backgroundColor: getStatusColor(status) }]}>
                    <Text style={styles.historyStatus}>{status.replace('_', ' ')}</Text>
                </View>
                <Text style={styles.historyDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <View style={styles.historyContent}>
                <View style={styles.row}>
                    <Droplet size={16} color={COLORS.primary} fill={COLORS.primary} />
                    <Text style={styles.historyTitle}>{displayItem.blood_type} Blood {isRequest ? 'Request' : 'Donation'}</Text>
                </View>
                <Text style={styles.historySubtitle} numberOfLines={1}>{displayItem.hospital_name}</Text>
                
                {isRequest && (
                    <View style={styles.statsRow}>
                        <Text style={styles.statText}>Needed: <Text style={styles.statValue}>{needed}</Text></Text>
                        <View style={styles.statDivider} />
                        <Text style={styles.statText}>Responded: <Text style={styles.statValue}>{responses}</Text></Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
      );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
      </View>

      <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, viewMode === 'requests' && styles.activeTab]}
            onPress={() => setViewMode('requests')}
          >
              <Text style={[styles.tabText, viewMode === 'requests' && styles.activeTabText]}>My Requests</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, viewMode === 'donations' && styles.activeTab]}
            onPress={() => setViewMode('donations')}
          >
              <Text style={[styles.tabText, viewMode === 'donations' && styles.activeTabText]}>My Donations</Text>
          </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
            }
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    {viewMode === 'requests' ? (
                         <HistoryIcon size={48} color={COLORS.gray} />
                    ) : (
                         <HeartHandshake size={48} color={COLORS.gray} />
                    )}
                    <Text style={styles.emptyText}>
                        {viewMode === 'requests' ? "No requests made yet." : "No donations made yet."}
                    </Text>
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
    paddingTop: Platform.OS === 'web' ? 20 : 60,
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
  tabsContainer: {
      flexDirection: 'row',
      padding: SPACING.md,
      gap: SPACING.md
  },
  tab: {
      flex: 1,
      paddingVertical: SPACING.sm,
      alignItems: 'center',
      borderRadius: SPACING.xl,
      backgroundColor: COLORS.white,
      borderWidth: 1,
      borderColor: COLORS.gray
  },
  activeTab: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primary
  },
  tabText: {
      fontWeight: 'bold',
      color: COLORS.darkGray
  },
  activeTabText: {
      color: COLORS.white
  },
  centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
  },
  listContent: {
      padding: SPACING.lg,
      gap: SPACING.md
  },
  historyCard: {
      backgroundColor: COLORS.white,
      padding: SPACING.md,
      borderRadius: SPACING.md,
      ...SHADOWS.card
  },
  historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.sm
  },
  historyBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12
  },
  historyStatus: {
      fontSize: TYPOGRAPHY.sizes.xs,
      fontWeight: 'bold',
      color: COLORS.white
  },
  historyDate: {
      fontSize: TYPOGRAPHY.sizes.xs,
      color: COLORS.darkGray
  },
  historyContent: {
      gap: 4
  },
  row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs
  },
  historyTitle: {
      fontSize: TYPOGRAPHY.sizes.md,
      fontWeight: 'bold',
      color: COLORS.text
  },
  historySubtitle: {
      fontSize: TYPOGRAPHY.sizes.sm,
      color: COLORS.darkGray
  },
  emptyState: {
      padding: SPACING.xxl,
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.md,
      marginTop: SPACING.xxl
  },
  emptyText: {
      color: COLORS.darkGray,
      fontSize: TYPOGRAPHY.sizes.md,
      fontWeight: 'bold'
  },
  statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      gap: SPACING.sm
  },
  statText: {
      fontSize: TYPOGRAPHY.sizes.xs,
      color: COLORS.darkGray
  },
  statValue: {
      fontWeight: 'bold',
      color: COLORS.text
  },
  statDivider: {
      width: 1,
      height: 12,
      backgroundColor: COLORS.gray
  }
});
