import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Call } from '../types';
import { supabase } from '../lib/supabase';

type CreateCaseScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateCase'>;

interface Props {
  navigation: CreateCaseScreenNavigationProp;
}

export default function CreateCaseScreen({ navigation }: Props) {
  const [caseTitle, setCaseTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [availableCalls, setAvailableCalls] = useState<Call[]>([]);
  const [selectedCallIds, setSelectedCallIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchUnassignedCalls();
  }, []);

  const fetchUnassignedCalls = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all spam calls
      const { data: spamCalls } = await supabase
        .from('calls')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_spam', true)
        .order('created_at', { ascending: false });

      // Get assigned calls
      const { data: assignedCalls } = await supabase
        .from('case_calls')
        .select('call_id');

      const assignedCallIds = assignedCalls?.map((ac) => ac.call_id) || [];

      // Filter unassigned
      const unassigned = spamCalls?.filter(
        (call) => !assignedCallIds.includes(call.id)
      ) || [];

      setAvailableCalls(unassigned);

    } catch (error) {
      console.error('Error fetching calls:', error);
      Alert.alert('Error', 'Failed to load spam calls');
    } finally {
      setLoading(false);
    }
  };

  const toggleCallSelection = (callId: string) => {
    setSelectedCallIds(prev =>
      prev.includes(callId)
        ? prev.filter(id => id !== callId)
        : [...prev, callId]
    );
  };

  const handleCreateCase = async () => {
    if (!caseTitle.trim()) {
      Alert.alert('Error', 'Please enter a case title');
      return;
    }

    if (selectedCallIds.length === 0) {
      Alert.alert('Error', 'Please select at least one call');
      return;
    }

    setCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Calculate estimated payout
      let estimatedPayout = 0;
      for (const callId of selectedCallIds) {
        const { data: violations } = await supabase
          .from('violations')
          .select('violation_type')
          .eq('call_id', callId);

        violations?.forEach(violation => {
          if (violation.violation_type.includes('TCPA')) {
            estimatedPayout += 1000;
          } else if (violation.violation_type.includes('FDCPA')) {
            estimatedPayout += 1000;
          } else {
            estimatedPayout += 500;
          }
        });
      }

      // Create case
      const { data: newCase, error: caseError } = await supabase
        .from('legal_cases')
        .insert({
          user_id: user.id,
          case_title: caseTitle.trim(),
          case_status: 'pending',
          estimated_payout: estimatedPayout,
          notes: notes.trim() || null,
        })
        .select()
        .single();

      if (caseError) throw caseError;

      // Link calls to case
      const caseCallsData = selectedCallIds.map(callId => ({
        case_id: newCase.id,
        call_id: callId,
      }));

      const { error: linkError } = await supabase
        .from('case_calls')
        .insert(caseCallsData);

      if (linkError) throw linkError;

      Alert.alert(
        'Success',
        `Case created successfully!\nEstimated Payout: $${estimatedPayout.toLocaleString()}`,
        [
          {
            text: 'View Case',
            onPress: () => {
              navigation.replace('CaseDetails', { caseId: newCase.id });
            },
          },
        ]
      );

    } catch (error) {
      console.error('Error creating case:', error);
      Alert.alert('Error', 'Failed to create case');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Legal Case</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        {/* Case Title */}
        <View style={styles.card}>
          <Text style={styles.label}>Case Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Debt Collector Violations - June 2025"
            value={caseTitle}
            onChangeText={setCaseTitle}
            editable={!creating}
          />
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add any relevant notes about this case..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            editable={!creating}
          />
        </View>

        {/* Select Calls */}
        <View style={styles.card}>
          <Text style={styles.label}>Select Spam Calls *</Text>
          <Text style={styles.helpText}>
            Select the spam calls to include in this case
          </Text>

          {availableCalls.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No unassigned spam calls available</Text>
              <Text style={styles.emptySubtext}>
                All your spam calls are already assigned to cases
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.selectedCount}>
                {selectedCallIds.length} of {availableCalls.length} selected
              </Text>

              {availableCalls.map((call) => (
                <TouchableOpacity
                  key={call.id}
                  style={[
                    styles.callItem,
                    selectedCallIds.includes(call.id) && styles.callItemSelected,
                  ]}
                  onPress={() => toggleCallSelection(call.id)}
                  disabled={creating}
                >
                  <View style={styles.checkbox}>
                    {selectedCallIds.includes(call.id) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>

                  <View style={styles.callInfo}>
                    <Text style={styles.callerNumber}>{call.caller_number}</Text>
                    <Text style={styles.callDate}>{formatDate(call.created_at)}</Text>
                  </View>

                  {call.is_spam && (
                    <View style={styles.spamBadge}>
                      <Text style={styles.spamBadgeText}>SPAM</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[
            styles.createButton,
            (creating || selectedCallIds.length === 0 || !caseTitle.trim()) &&
              styles.createButtonDisabled,
          ]}
          onPress={handleCreateCase}
          disabled={creating || selectedCallIds.length === 0 || !caseTitle.trim()}
        >
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Create Case</Text>
          )}
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
    width: 70,
  },
  backButtonText: {
    fontSize: 16,
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  helpText: {
    fontSize: 13,
    color: '#999',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 15,
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  callItemSelected: {
    backgroundColor: '#e8f4ff',
    borderColor: '#007AFF',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  callInfo: {
    flex: 1,
  },
  callerNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  callDate: {
    fontSize: 12,
    color: '#999',
  },
  spamBadge: {
    backgroundColor: '#ff3b30',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  spamBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
