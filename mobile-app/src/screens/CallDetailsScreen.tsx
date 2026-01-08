import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, Call, Violation } from '../types';
import { supabase } from '../lib/supabase';

type CallDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CallDetails'>;
type CallDetailsScreenRouteProp = RouteProp<RootStackParamList, 'CallDetails'>;

interface Props {
  navigation: CallDetailsScreenNavigationProp;
  route: CallDetailsScreenRouteProp;
}

export default function CallDetailsScreen({ navigation, route }: Props) {
  const { callId } = route.params;
  const [call, setCall] = useState<Call | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCallDetails();
  }, [callId]);

  const fetchCallDetails = async () => {
    try {
      // Fetch call data
      const { data: callData, error: callError } = await supabase
        .from('calls')
        .select('*')
        .eq('id', callId)
        .single();

      if (callError) throw callError;
      setCall(callData);

      // Fetch violations
      const { data: violationsData, error: violationsError } = await supabase
        .from('violations')
        .select('*')
        .eq('call_id', callId)
        .order('timestamp_in_call', { ascending: true });

      if (violationsError) throw violationsError;
      setViolations(violationsData || []);
    } catch (error) {
      console.error('Error fetching call details:', error);
      Alert.alert('Error', 'Failed to load call details');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!call) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Call not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Call Details</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        {/* Call Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Call Information</Text>
            {call.is_spam && (
              <View style={styles.spamBadge}>
                <Text style={styles.spamBadgeText}>SPAM</Text>
              </View>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Caller Number</Text>
            <Text style={styles.infoValue}>{call.caller_number}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date & Time</Text>
            <Text style={styles.infoValue}>{formatDate(call.created_at)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>{formatDuration(call.call_duration)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={[styles.infoValue, styles.statusText]}>
              {call.call_status || 'completed'}
            </Text>
          </View>
        </View>

        {/* Transcript Card */}
        {call.transcript && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Transcript</Text>
            <Text style={styles.transcript}>{call.transcript}</Text>
          </View>
        )}

        {/* Violations Card */}
        {violations.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Legal Violations Detected</Text>
            <Text style={styles.violationsCount}>
              {violations.length} violation{violations.length > 1 ? 's' : ''} found
            </Text>

            {violations.map((violation, index) => (
              <View key={violation.id} style={styles.violationItem}>
                <View style={styles.violationHeader}>
                  <Text style={styles.violationType}>{violation.violation_type}</Text>
                  <Text style={styles.violationTimestamp}>
                    at {formatTimestamp(violation.timestamp_in_call)}
                  </Text>
                </View>
                <Text style={styles.violationDescription}>
                  {violation.violation_description}
                </Text>
                <View style={styles.confidenceBar}>
                  <View
                    style={[
                      styles.confidenceFill,
                      { width: `${violation.confidence_score * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.confidenceText}>
                  {Math.round(violation.confidence_score * 100)}% confidence
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recording Card */}
        {call.recording_url && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recording</Text>
            <TouchableOpacity style={styles.playButton}>
              <Text style={styles.playButtonText}>▶ Play Recording</Text>
            </TouchableOpacity>
            <Text style={styles.recordingNote}>
              Recording playback will be available in a future update
            </Text>
          </View>
        )}

        {/* Actions Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Actions</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Coming Soon', 'Export feature will be available soon')}
          >
            <Text style={styles.actionButtonText}>Export Evidence</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => Alert.alert('Coming Soon', 'Report feature will be available soon')}
          >
            <Text style={styles.actionButtonTextSecondary}>Report to Authorities</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 15,
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
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  spamBadge: {
    backgroundColor: '#ff3b30',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  spamBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  statusText: {
    textTransform: 'capitalize',
  },
  transcript: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  violationsCount: {
    fontSize: 14,
    color: '#ff3b30',
    fontWeight: '600',
    marginBottom: 15,
  },
  violationItem: {
    backgroundColor: '#fff5f5',
    borderLeftWidth: 3,
    borderLeftColor: '#ff3b30',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  violationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  violationType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff3b30',
  },
  violationTimestamp: {
    fontSize: 12,
    color: '#999',
  },
  violationDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 10,
  },
  confidenceBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 5,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#ff3b30',
  },
  confidenceText: {
    fontSize: 11,
    color: '#999',
  },
  playButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  recordingNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionButtonTextSecondary: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 15,
  },
  backLink: {
    fontSize: 16,
    color: '#007AFF',
  },
});
