import { supabase } from '../utils/supabase';

interface LegalCase {
  id: string;
  user_id: string;
  case_title: string;
  case_status: string;
  estimated_payout: number;
  actual_payout: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateCaseParams {
  user_id: string;
  case_title: string;
  call_ids: string[];
  notes?: string;
}

interface CaseWithDetails extends LegalCase {
  calls: any[];
  violations: any[];
  total_violations: number;
}

export async function createCase(params: CreateCaseParams): Promise<LegalCase | null> {
  try {
    const { user_id, case_title, call_ids, notes } = params;

    console.log(`📋 Creating new legal case: "${case_title}"`);

    // Calculate estimated payout based on violations
    let estimatedPayout = 0;

    for (const callId of call_ids) {
      const { data: violations } = await supabase
        .from('violations')
        .select('*')
        .eq('call_id', callId);

      if (violations) {
        // TCPA: $500-$1500 per violation
        // FDCPA: $1000 per violation
        // FTC: varies
        violations.forEach((violation) => {
          if (violation.violation_type.includes('TCPA')) {
            estimatedPayout += 1000;
          } else if (violation.violation_type.includes('FDCPA')) {
            estimatedPayout += 1000;
          } else {
            estimatedPayout += 500;
          }
        });
      }
    }

    // Create the case
    const { data: legalCase, error: caseError } = await supabase
      .from('legal_cases')
      .insert({
        user_id,
        case_title,
        case_status: 'pending',
        estimated_payout: estimatedPayout,
        notes,
      })
      .select()
      .single();

    if (caseError) {
      console.error('❌ Error creating case:', caseError);
      return null;
    }

    console.log(`✅ Case created with ID: ${legalCase.id}`);

    // Link calls to the case
    const caseCallsData = call_ids.map((callId) => ({
      case_id: legalCase.id,
      call_id: callId,
    }));

    const { error: linkError } = await supabase
      .from('case_calls')
      .insert(caseCallsData);

    if (linkError) {
      console.error('⚠️  Error linking calls to case:', linkError);
    } else {
      console.log(`🔗 Linked ${call_ids.length} calls to case`);
    }

    return legalCase;

  } catch (error) {
    console.error('❌ Error in createCase:', error);
    return null;
  }
}

export async function getCaseById(caseId: string): Promise<CaseWithDetails | null> {
  try {
    // Fetch case
    const { data: legalCase, error: caseError } = await supabase
      .from('legal_cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (caseError || !legalCase) {
      console.error('❌ Case not found:', caseId);
      return null;
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

    // Fetch violations for all calls
    const { data: violations } = await supabase
      .from('violations')
      .select('*')
      .in('call_id', callIds)
      .order('confidence_score', { ascending: false });

    return {
      ...legalCase,
      calls: calls || [],
      violations: violations || [],
      total_violations: violations?.length || 0,
    };

  } catch (error) {
    console.error('❌ Error fetching case:', error);
    return null;
  }
}

export async function getUserCases(userId: string): Promise<LegalCase[]> {
  try {
    const { data: cases, error } = await supabase
      .from('legal_cases')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching user cases:', error);
      return [];
    }

    return cases || [];

  } catch (error) {
    console.error('❌ Error in getUserCases:', error);
    return [];
  }
}

export async function updateCaseStatus(
  caseId: string,
  status: string,
  actualPayout?: number
): Promise<boolean> {
  try {
    const updateData: any = { case_status: status };

    if (actualPayout !== undefined) {
      updateData.actual_payout = actualPayout;
    }

    const { error } = await supabase
      .from('legal_cases')
      .update(updateData)
      .eq('id', caseId);

    if (error) {
      console.error('❌ Error updating case status:', error);
      return false;
    }

    console.log(`✅ Case ${caseId} status updated to: ${status}`);
    return true;

  } catch (error) {
    console.error('❌ Error in updateCaseStatus:', error);
    return false;
  }
}

export async function addCallsToCase(caseId: string, callIds: string[]): Promise<boolean> {
  try {
    const caseCallsData = callIds.map((callId) => ({
      case_id: caseId,
      call_id: callId,
    }));

    const { error } = await supabase
      .from('case_calls')
      .insert(caseCallsData);

    if (error) {
      console.error('❌ Error adding calls to case:', error);
      return false;
    }

    console.log(`✅ Added ${callIds.length} calls to case ${caseId}`);
    return true;

  } catch (error) {
    console.error('❌ Error in addCallsToCase:', error);
    return false;
  }
}

export async function removeCallFromCase(caseId: string, callId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('case_calls')
      .delete()
      .eq('case_id', caseId)
      .eq('call_id', callId);

    if (error) {
      console.error('❌ Error removing call from case:', error);
      return false;
    }

    console.log(`✅ Removed call ${callId} from case ${caseId}`);
    return true;

  } catch (error) {
    console.error('❌ Error in removeCallFromCase:', error);
    return false;
  }
}

export async function deleteCase(caseId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('legal_cases')
      .delete()
      .eq('id', caseId);

    if (error) {
      console.error('❌ Error deleting case:', error);
      return false;
    }

    console.log(`✅ Deleted case ${caseId}`);
    return true;

  } catch (error) {
    console.error('❌ Error in deleteCase:', error);
    return false;
  }
}

export async function getUnassignedSpamCalls(userId: string): Promise<any[]> {
  try {
    // Get all spam calls for user
    const { data: spamCalls } = await supabase
      .from('calls')
      .select('*')
      .eq('user_id', userId)
      .eq('is_spam', true)
      .order('created_at', { ascending: false });

    if (!spamCalls || spamCalls.length === 0) {
      return [];
    }

    // Get all calls that are already in cases
    const { data: assignedCalls } = await supabase
      .from('case_calls')
      .select('call_id');

    const assignedCallIds = assignedCalls?.map((ac) => ac.call_id) || [];

    // Filter out assigned calls
    const unassignedCalls = spamCalls.filter(
      (call) => !assignedCallIds.includes(call.id)
    );

    return unassignedCalls;

  } catch (error) {
    console.error('❌ Error fetching unassigned calls:', error);
    return [];
  }
}
