import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Call } from '../types';
import { supabase } from '../lib/supabase';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
  const [stats, setStats] = useState({
    totalCalls: 0,
    spamCalls: 0,
    violations: 0,
  });
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls',
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all calls
      const { data: calls, error: callsError } = await supabase
        .from('calls')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (callsError) throw callsError;

      // Calculate stats
      const totalCalls = calls?.length || 0;
      const spamCalls = calls?.filter((call) => call.is_spam).length || 0;

      // Fetch violations count
      const { count: violationsCount } = await supabase
        .from('violations')
        .select('*', { count: 'exact', head: true })
        .in('call_id', calls?.map((c) => c.id) || []);

      setStats({
        totalCalls,
        spamCalls,
        violations: violationsCount || 0,
      });

      setRecentCalls(calls?.slice(0, 3) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
          },
        },
      ]
    );
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Spam Call Defender</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome!</Text>
          <Text style={styles.cardText}>
            Your AI spam call defender is ready to protect you.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Active</Text>
          </View>
          <Text style={styles.cardText}>
            Your phone number will be configured in the next stages.
          </Text>
        </View>

        {/* Statistics */}
        {loading ? (
          <View style={styles.card}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalCalls}</Text>
                <Text style={styles.statLabel}>Total Calls</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, styles.statValueDanger]}>{stats.spamCalls}</Text>
                <Text style={styles.statLabel}>Spam Calls</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, styles.statValueWarning]}>{stats.violations}</Text>
                <Text style={styles.statLabel}>Violations</Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Calls */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Calls</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CallHistory')}>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentCalls.length === 0 ? (
            <Text style={styles.cardTextMuted}>
              No calls yet. Call history will appear here.
            </Text>
          ) : (
            recentCalls.map((call) => (
              <TouchableOpacity
                key={call.id}
                style={styles.callItem}
                onPress={() => navigation.navigate('CallDetails', { callId: call.id })}
              >
                <View style={styles.callInfo}>
                  <View style={styles.callHeader}>
                    <Text style={styles.callerNumber}>{call.caller_number}</Text>
                    {call.is_spam && (
                      <View style={styles.spamBadgeSmall}>
                        <Text style={styles.spamBadgeTextSmall}>SPAM</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.callDate}>{formatDate(call.created_at)}</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Legal Cases Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Cases')}
        >
          <Text style={styles.actionButtonText}>⚖️ Legal Cases</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ff3b30',
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 0,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  cardTextMuted: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  statusBadge: {
    backgroundColor: '#34c759',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  statValueDanger: {
    color: '#ff3b30',
  },
  statValueWarning: {
    color: '#ff9500',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  viewAllLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  callInfo: {
    flex: 1,
  },
  callHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  callerNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  spamBadgeSmall: {
    backgroundColor: '#ff3b30',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  spamBadgeTextSmall: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  callDate: {
    fontSize: 13,
    color: '#999',
  },
  arrow: {
    fontSize: 20,
    color: '#ccc',
    marginLeft: 10,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
