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
import { RootStackParamList, LegalCase, Call, Violation } from '../types';
import { supabase } from '../lib/supabase';

type CaseDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CaseDetails'>;
type CaseDetailsScreenRouteProp = RouteProp<RootStackParamList, 'CaseDetails'>;

interface Props {
  navigation: CaseDetailsScreenNavigationProp;
  route: CaseDetailsScreenRouteProp;
}

interface CaseWithDetails extends LegalCase {
  calls: Call[];
  violations: Violation[];
  total_violations: number;
}

export default function CaseDetailsScreen({ navigation, route }: Props) {
  const { caseId } = route.params;
  const [caseDetails, setCaseDetails] = useState<CaseWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCaseDetails();
  }, [caseId]);

  const fetchCaseDetails = async () => {
    try {
      // Fetch case
      const { data: legalCase, error: caseError } = await supabase
        .from('legal_cases')
        .select('*')
        .eq('id', caseId)
        .single();

      if (caseError || !legalCase) {
        Alert.alert('Error', 'Case not found');
        navigation.goBack();
        return;
      }

      // Fetch linked calls
      const { data: caseCalls } = await supabase
        .from('case_calls')
        .select('call_id')
        .eq('case_id', caseId);

      const callIds = caseCalls?.map((cc) => cc.call_id) || [];

      // Fetch call details
      const { data: calls } = await supabase
        .from('calls')
        .select('*')
        .in('id', callIds)
        .order('created_at', { ascending: false });

      // Fetch violations
      const { data: violations } = await supabase
        .from('violations')
        .select('*')
        .in('call_id', callIds)
        .order('confidence_score', { ascending: false });

      setCaseDetails({
        ...legalCase,
        calls: calls || [],
        violations: violations || [],
        total_violations: violations?.length || 0,
      });

    } catch (error) {
      console.error('Error fetching case details:', error);
      Alert.alert('Error', 'Failed to load case details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9500';
      case 'filed': return '#007AFF';
      case 'in_progress': return '#5856d6';
      case 'settled': return '#34c759';
      case 'closed': return '#8e8e93';
      default: return '#8e8e93';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleExportEvidence = () => {
    Alert.alert(
      'Export Evidence',
      'This feature will generate a PDF with all case evidence including call transcripts, violations, and timestamps.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export PDF', onPress: () => Alert.alert('Coming Soon', 'PDF export will be available in the next update') },
      ]
    );
  };

  const handleUpdateStatus = () => {
    const statuses = ['pending', 'filed', 'in_progress', 'settled', 'closed'];
    Alert.alert(
      'Update Case Status',
      'Choose new status:',
      [
        ...statuses.map(status => ({
          text: status.charAt(0).toUpperCase() + status.slice(1),
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('legal_cases')
                .update({ case_status: status })
                .eq('id', caseId);

              if (error) throw error;
              fetchCaseDetails();
              Alert.alert('Success', `Case status updated to ${status}`);
            } catch (error) {
              Alert.alert('Error', 'Failed to update status');
            }
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!caseDetails) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Case not found</Text>
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
        <Text style={styles.title}>Case Details</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        {/* Case Overview */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{caseDetails.case_title}</Text>
            <TouchableOpacity
              style={[styles.statusBadge, { backgroundColor: getStatusColor(caseDetails.case_status) }]}
              onPress={handleUpdateStatus}
            >
              <Text style={styles.statusText}>{caseDetails.case_status.toUpperCase()}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.payoutRow}>
            <View style={styles.payoutItem}>
              <Text style={styles.payoutLabel}>Estimated Payout</Text>
              <Text style={styles.payoutValue}>
                {formatCurrency(caseDetails.estimated_payout)}
              </Text>
            </View>

            {caseDetails.actual_payout && (
              <View style={styles.payoutItem}>
                <Text style={styles.payoutLabel}>Actual Payout</Text>
                <Text style={[styles.payoutValue, styles.actualPayout]}>
                  {formatCurrency(caseDetails.actual_payout)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created</Text>
            <Text style={styles.infoValue}>{formatDate(caseDetails.created_at)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Updated</Text>
            <Text style={styles.infoValue}>{formatDate(caseDetails.updated_at)}</Text>
          </View>
        </View>

        {/* Case Notes */}
        {caseDetails.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{caseDetails.notes}</Text>
          </View>
        )}

        {/* Statistics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Case Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{caseDetails.calls.length}</Text>
              <Text style={styles.statLabel}>Calls</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, styles.violationCount]}>
                {caseDetails.total_violations}
              </Text>
              <Text style={styles.statLabel}>Violations</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, styles.spamCount]}>
                {caseDetails.calls.filter(c => c.is_spam).length}
              </Text>
              <Text style={styles.statLabel}>Spam Calls</Text>
            </View>
          </View>
        </View>

        {/* Violations Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Violations Summary</Text>
          {caseDetails.violations.length === 0 ? (
            <Text style={styles.emptyText}>No violations detected</Text>
          ) : (
            caseDetails.violations.map((violation, index) => (
              <View key={violation.id} style={styles.violationItem}>
                <View style={styles.violationHeader}>
                  <Text style={styles.violationType}>{violation.violation_type}</Text>
                  <Text style={styles.confidenceText}>
                    {Math.round(violation.confidence_score * 100)}%
                  </Text>
                </View>
                <Text style={styles.violationDescription}>
                  {violation.violation_description}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Linked Calls */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Linked Calls ({caseDetails.calls.length})</Text>
          {caseDetails.calls.map((call) => (
            <TouchableOpacity
              key={call.id}
              style={styles.callItem}
              onPress={() => navigation.navigate('CallDetails', { callId: call.id })}
            >
              <View style={styles.callInfo}>
                <Text style={styles.callerNumber}>{call.caller_number}</Text>
                <Text style={styles.callDate}>{formatDate(call.created_at)}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Actions</Text>

          <TouchableOpacity style={styles.actionButton} onPress={handleExportEvidence}>
            <Text style={styles.actionButtonText}>📄 Export Evidence as PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => Alert.alert('Coming Soon', 'Email to lawyer feature will be available soon')}
          >
            <Text style={styles.actionButtonTextSecondary}>📧 Email to Lawyer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={handleUpdateStatus}
          >
            <Text style={styles.actionButtonTextSecondary}>🔄 Update Status</Text>
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
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  payoutItem: {
    flex: 1,
  },
  payoutLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  payoutValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  actualPayout: {
    color: '#34c759',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 6,
  },
  violationCount: {
    color: '#ff9500',
  },
  spamCount: {
    color: '#ff3b30',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  violationItem: {
    backgroundColor: '#fff5f5',
    borderLeftWidth: 3,
    borderLeftColor: '#ff3b30',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
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
    flex: 1,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  violationDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  callItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  arrow: {
    fontSize: 20,
    color: '#ccc',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
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
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
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
