import express from 'express';
import { supabase } from '../utils/supabase';
import { analyzeCallForViolations } from '../services/violation-detection.service';

const router = express.Router();

// Process a call and detect violations
router.post('/process', async (req, res) => {
  try {
    const { user_id, caller_number, transcript, call_duration } = req.body;

    if (!user_id || !caller_number || !transcript) {
      return res.status(400).json({
        error: 'Missing required fields: user_id, caller_number, transcript'
      });
    }

    console.log(`📞 Processing call from ${caller_number}...`);

    // Analyze the call for violations
    const analysis = await analyzeCallForViolations(transcript);

    // Insert call into database
    const { data: call, error: callError } = await supabase
      .from('calls')
      .insert({
        user_id,
        caller_number,
        call_duration: call_duration || 0,
        call_status: 'completed',
        transcript,
        is_spam: analysis.is_spam,
        recording_url: null,
      })
      .select()
      .single();

    if (callError) {
      console.error('❌ Error creating call:', callError);
      return res.status(500).json({ error: 'Failed to create call record' });
    }

    console.log(`✅ Call created with ID: ${call.id}`);

    // Insert violations
    const violationsInserted = [];
    for (const violation of analysis.violations) {
      const { data: violationData, error: violationError } = await supabase
        .from('violations')
        .insert({
          call_id: call.id,
          violation_type: violation.violation_type,
          violation_description: violation.violation_description,
          timestamp_in_call: violation.timestamp_in_call,
          confidence_score: violation.confidence_score,
        })
        .select()
        .single();

      if (!violationError && violationData) {
        violationsInserted.push(violationData);
        console.log(`   ⚠️  Violation added: ${violation.violation_type}`);
      }
    }

    console.log(`✨ Processing complete: ${violationsInserted.length} violations detected`);

    res.json({
      success: true,
      call: {
        id: call.id,
        caller_number: call.caller_number,
        is_spam: call.is_spam,
        caller_type: analysis.caller_type,
        summary: analysis.summary,
      },
      violations: violationsInserted,
      analysis,
    });

  } catch (error: any) {
    console.error('❌ Error processing call:', error);
    res.status(500).json({
      error: 'Failed to process call',
      message: error.message
    });
  }
});

// Get call by ID with violations
router.get('/:callId', async (req, res) => {
  try {
    const { callId } = req.params;

    // Fetch call
    const { data: call, error: callError } = await supabase
      .from('calls')
      .select('*')
      .eq('id', callId)
      .single();

    if (callError || !call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    // Fetch violations
    const { data: violations, error: violationsError } = await supabase
      .from('violations')
      .select('*')
      .eq('call_id', callId)
      .order('timestamp_in_call', { ascending: true });

    if (violationsError) {
      console.error('Error fetching violations:', violationsError);
    }

    res.json({
      success: true,
      call,
      violations: violations || [],
    });

  } catch (error: any) {
    console.error('❌ Error fetching call:', error);
    res.status(500).json({ error: 'Failed to fetch call' });
  }
});

// Get all calls for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: calls, error } = await supabase
      .from('calls')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching calls:', error);
      return res.status(500).json({ error: 'Failed to fetch calls' });
    }

    res.json({
      success: true,
      calls: calls || [],
      count: calls?.length || 0,
    });

  } catch (error: any) {
    console.error('❌ Error fetching calls:', error);
    res.status(500).json({ error: 'Failed to fetch calls' });
  }
});

// Analyze transcript without saving
router.post('/analyze', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Missing transcript' });
    }

    console.log('🔍 Analyzing transcript...');
    const analysis = await analyzeCallForViolations(transcript);

    res.json({
      success: true,
      analysis,
    });

  } catch (error: any) {
    console.error('❌ Error analyzing transcript:', error);
    res.status(500).json({ error: 'Failed to analyze transcript' });
  }
});

export default router;
