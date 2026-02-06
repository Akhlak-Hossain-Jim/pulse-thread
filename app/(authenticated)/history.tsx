import { useRouter } from 'expo-router';
import { History as HistoryIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthProvider';
import { supabase } from '../../src/lib/supabase';

export default function HistoryScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (session) {
        fetchMyRequests();
    } else {
        // If no session (shouldn't happen in auth route), stop loading
        setLoading(false);
    }
  }, [session]);

  const fetchMyRequests = async () => {
      try {
        const { data, error } = await supabase
            .from('requests')
            .select('*')
            .eq('requester_id', session?.user.id)
            .order('created_at', { ascending: false });
        
        if (!error && data) {
            setMyRequests(data);
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
    fetchMyRequests();
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'PENDING': return COLORS.action; // Blue-ish
          case 'ACCEPTED': return COLORS.primary; // Red (Active)
          case 'FULFILLED': return COLORS.success; // Green
          default: return COLORS.darkGray;
      }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
        style={styles.historyCard}
        onPress={() => router.push(`/request/${item.id}`)}
    >
        <View style={styles.historyHeader}>
            <View style={styles.historyBadge}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: getStatusColor(item.status) }} />
                <Text style={[styles.historyStatus, { color: getStatusColor(item.status)}]}>{item.status}</Text>
            </View>
            <Text style={styles.historyDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        <View style={styles.historyContent}>
            <Text style={styles.historyTitle}>{item.blood_type} Blood Request</Text>
            <Text style={styles.historySubtitle} numberOfLines={1}>{item.hospital_name}</Text>
        </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
            data={myRequests}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
            }
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    <HistoryIcon size={48} color={COLORS.gray} />
                    <Text style={styles.emptyText}>No requests made yet.</Text>
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
      alignItems: 'center'
  },
  listContent: {
      padding: SPACING.lg,
      gap: SPACING.md
  },
  historyCard: {
      backgroundColor: COLORS.white,
      padding: SPACING.md,
      borderRadius: SPACING.sm,
      borderLeftWidth: 4,
      borderLeftColor: COLORS.gray,
      ...SHADOWS.card
  },
  historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4
  },
  historyBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: COLORS.gray,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12
  },
  historyStatus: {
      fontSize: TYPOGRAPHY.sizes.xs,
      fontWeight: 'bold'
  },
  historyDate: {
      fontSize: TYPOGRAPHY.sizes.xs,
      color: COLORS.darkGray
  },
  historyContent: {
      marginTop: 4
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
  }
});
