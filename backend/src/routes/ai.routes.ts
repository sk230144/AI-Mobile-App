import express, { Request, Response } from 'express';
import { generateAIResponse, identifyCall } from '../services/ai.service';

const router = express.Router();

/**
 * Test AI conversation generation
 * POST /api/ai/chat
 * Body: { message: string, history?: string }
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history = '' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const aiResponse = await generateAIResponse(history, message);

    res.json({
      success: true,
      userMessage: message,
      aiResponse,
    });
  } catch (error: any) {
    console.error('AI chat error:', error);
    res.status(500).json({
      error: 'Failed to generate AI response',
      message: error.message,
    });
  }
});

/**
 * Test call identification
 * POST /api/ai/identify
 * Body: { transcript: string }
 */
router.post('/identify', async (req: Request, res: Response) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const identification = await identifyCall(transcript);

    res.json({
      success: true,
      identification,
    });
  } catch (error: any) {
    console.error('Call identification error:', error);
    res.status(500).json({
      error: 'Failed to identify call',
      message: error.message,
    });
  }
});

export default router;
