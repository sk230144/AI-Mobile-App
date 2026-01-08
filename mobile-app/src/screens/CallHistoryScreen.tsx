import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Call } from '../types';
import { supabase } from '../lib/supabase';

type CallHistoryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CallHistory'>;

interface Props {
  navigation: CallHistoryScreenNavigationProp;
}

export default function CallHistoryScreen({ navigation }: Props) {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCalls = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCalls(data || []);
    } catch (error) {
      console.error('Error fetching calls:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCalls();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('calls-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls',
        },
        () => {
          fetchCalls();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCalls();
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }
  };

  const renderCallItem = ({ item }: { item: Call }) => (
    <TouchableOpacity
      style={styles.callItem}
      onPress={() => navigation.navigate('CallDetails', { callId: item.id })}
    >
      <View style={styles.callInfo}>
        <View style={styles.callHeader}>
          <Text style={styles.callerNumber}>{item.caller_number}</Text>
          {item.is_spam && (
            <View style={styles.spamBadge}>
              <Text style={styles.spamBadgeText}>SPAM</Text>
            </View>
          )}
        </View>
        <Text style={styles.callDate}>{formatDate(item.created_at)}</Text>
        <View style={styles.callMetadata}>
          <Text style={styles.callDuration}>{formatDuration(item.call_duration)}</Text>
          <Text style={styles.callStatus}> • {item.call_status || 'completed'}</Text>
        </View>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Call History</Text>
        <View style={styles.backButton} />
      </View>

      {calls.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No calls yet</Text>
          <Text style={styles.emptySubtext}>
            Your call history will appear here once you start receiving calls
          </Text>
        </View>
      ) : (
        <FlatList
          data={calls}
          renderItem={renderCallItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 60,
  },
  backButtonText: {
    fontSize: 18,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  listContent: {
    padding: 15,
  },
  callItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  callInfo: {
    flex: 1,
  },
  callHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  callerNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  spamBadge: {
    backgroundColor: '#ff3b30',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  spamBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  callDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  callMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callDuration: {
    fontSize: 12,
    color: '#999',
  },
  callStatus: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  arrow: {
    fontSize: 24,
    color: '#ccc',
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});
