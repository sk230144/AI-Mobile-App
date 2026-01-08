import express from 'express';
import {
  createCase,
  getCaseById,
  getUserCases,
  updateCaseStatus,
  addCallsToCase,
  removeCallFromCase,
  deleteCase,
  getUnassignedSpamCalls,
} from '../services/case-management.service';

const router = express.Router();

// Create a new legal case
router.post('/create', async (req, res) => {
  try {
    const { user_id, case_title, call_ids, notes } = req.body;

    if (!user_id || !case_title || !call_ids || call_ids.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields: user_id, case_title, call_ids'
      });
    }

    const legalCase = await createCase({
      user_id,
      case_title,
      call_ids,
      notes,
    });

    if (!legalCase) {
      return res.status(500).json({ error: 'Failed to create case' });
    }

    res.json({
      success: true,
      case: legalCase,
    });

  } catch (error: any) {
    console.error('❌ Error creating case:', error);
    res.status(500).json({ error: 'Failed to create case' });
  }
});

// Get case by ID with full details
router.get('/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;

    const caseDetails = await getCaseById(caseId);

    if (!caseDetails) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json({
      success: true,
      case: caseDetails,
    });

  } catch (error: any) {
    console.error('❌ Error fetching case:', error);
    res.status(500).json({ error: 'Failed to fetch case' });
  }
});

// Get all cases for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const cases = await getUserCases(userId);

    res.json({
      success: true,
      cases,
      count: cases.length,
    });

  } catch (error: any) {
    console.error('❌ Error fetching user cases:', error);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

// Update case status
router.patch('/:caseId/status', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { status, actual_payout } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const success = await updateCaseStatus(caseId, status, actual_payout);

    if (!success) {
      return res.status(500).json({ error: 'Failed to update case status' });
    }

    res.json({
      success: true,
      message: 'Case status updated',
    });

  } catch (error: any) {
    console.error('❌ Error updating case status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Add calls to a case
router.post('/:caseId/calls', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { call_ids } = req.body;

    if (!call_ids || call_ids.length === 0) {
      return res.status(400).json({ error: 'call_ids array is required' });
    }

    const success = await addCallsToCase(caseId, call_ids);

    if (!success) {
      return res.status(500).json({ error: 'Failed to add calls to case' });
    }

    res.json({
      success: true,
      message: `Added ${call_ids.length} calls to case`,
    });

  } catch (error: any) {
    console.error('❌ Error adding calls to case:', error);
    res.status(500).json({ error: 'Failed to add calls' });
  }
});

// Remove call from case
router.delete('/:caseId/calls/:callId', async (req, res) => {
  try {
    const { caseId, callId } = req.params;

    const success = await removeCallFromCase(caseId, callId);

    if (!success) {
      return res.status(500).json({ error: 'Failed to remove call from case' });
    }

    res.json({
      success: true,
      message: 'Call removed from case',
    });

  } catch (error: any) {
    console.error('❌ Error removing call from case:', error);
    res.status(500).json({ error: 'Failed to remove call' });
  }
});

// Delete case
router.delete('/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;

    const success = await deleteCase(caseId);

    if (!success) {
      return res.status(500).json({ error: 'Failed to delete case' });
    }

    res.json({
      success: true,
      message: 'Case deleted',
    });

  } catch (error: any) {
    console.error('❌ Error deleting case:', error);
    res.status(500).json({ error: 'Failed to delete case' });
  }
});

// Get unassigned spam calls for a user
router.get('/user/:userId/unassigned', async (req, res) => {
  try {
    const { userId } = req.params;

    const unassignedCalls = await getUnassignedSpamCalls(userId);

    res.json({
      success: true,
      calls: unassignedCalls,
      count: unassignedCalls.length,
    });

  } catch (error: any) {
    console.error('❌ Error fetching unassigned calls:', error);
    res.status(500).json({ error: 'Failed to fetch unassigned calls' });
  }
});

export default router;
