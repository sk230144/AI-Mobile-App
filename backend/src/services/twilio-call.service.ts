import twilio from 'twilio';
import { analyzeCallForViolations } from './violation-detection.service';
import { supabase } from '../utils/supabase';
import Groq from 'groq-sdk';

const VoiceResponse = twilio.twiml.VoiceResponse;

// Initialize Groq for AI conversation
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

// Store conversation history per call (in-memory cache)
interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface CallConversation {
  callSid: string;
  history: ConversationTurn[];
  detectedIntent: string | null;
  startTime: number;
}

const conversationCache = new Map<string, CallConversation>();

// Clean up old conversations (older than 1 hour)
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [callSid, conversation] of conversationCache.entries()) {
    if (conversation.startTime < oneHourAgo) {
      conversationCache.delete(callSid);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

/**
 * Generate TwiML response for incoming call
 * This tells Twilio what to do when call comes in
 */
export function generateInitialCallResponse(): string {
  const response = new VoiceResponse();

  // Greet the caller with AI voice
  response.say(
    {
      voice: 'Polly.Joanna',
      language: 'en-US',
    },
    'Hello, thank you for calling. How can I assist you today?'
  );

  // Start recording the call
  response.record({
    transcribe: false, // We'll use Groq for transcription
    maxLength: 300, // 5 minutes max
    playBeep: false,
    action: '/api/calls/recording-complete', // Where to send recording URL
  });

  // Gather input from caller (their response)
  const gather = response.gather({
    input: ['speech'],
    timeout: 5,
    speechTimeout: 'auto',
    action: '/api/calls/process-speech',
    method: 'POST',
  });

  // If no response, prompt again
  response.say('I didn\'t hear anything. Please speak after the tone.');
  response.redirect('/api/calls/incoming');

  return response.toString();
}

/**
 * Detect caller's intent from conversation history
 * This helps AI adapt its strategy
 */
function detectIntent(conversationHistory: ConversationTurn[]): string {
  const allText = conversationHistory
    .map(turn => turn.content.toLowerCase())
    .join(' ');

  // Debt collection indicators
  if (
    allText.includes('debt') ||
    allText.includes('owe') ||
    allText.includes('payment') ||
    allText.includes('collection') ||
    allText.includes('past due') ||
    allText.includes('outstanding balance')
  ) {
    return 'debt_collection';
  }

  // Telemarketing indicators
  if (
    allText.includes('special offer') ||
    allText.includes('limited time') ||
    allText.includes('discount') ||
    allText.includes('save money') ||
    allText.includes('interested in') ||
    allText.includes('product') ||
    allText.includes('service')
  ) {
    return 'telemarketing';
  }

  // Tech support scam indicators
  if (
    allText.includes('computer') ||
    allText.includes('virus') ||
    allText.includes('security') ||
    allText.includes('microsoft') ||
    allText.includes('windows') ||
    allText.includes('technical support') ||
    allText.includes('refund')
  ) {
    return 'tech_scam';
  }

  // IRS/Government scam indicators
  if (
    allText.includes('irs') ||
    allText.includes('tax') ||
    allText.includes('government') ||
    allText.includes('social security') ||
    allText.includes('warrant') ||
    allText.includes('arrest') ||
    allText.includes('legal action')
  ) {
    return 'government_scam';
  }

  // Unknown/general call
  return 'unknown';
}

/**
 * Get adaptive system prompt based on detected intent
 */
function getAdaptivePrompt(intent: string): string {
  const basePrompt = `You are answering a phone call. Your goal is to keep the conversation going naturally to collect as much information as possible about the caller.`;

  switch (intent) {
    case 'debt_collection':
      return `${basePrompt}

DETECTED: This appears to be a debt collection call.

Your strategy:
- Play confused about what debt they're talking about
- Ask for specific details: company name, callback number, account number, amount owed
- Ask them to send written verification by mail
- Ask who they work for and their employee ID
- Don't confirm or deny owing any debt
- Keep asking clarifying questions
- Sound slightly confused but cooperative`;

    case 'telemarketing':
      return `${basePrompt}

DETECTED: This appears to be a telemarketing/sales call.

Your strategy:
- Show mild interest to keep them talking
- Ask detailed questions about their product/service
- Ask for their company name, callback number
- Ask about pricing and "too good to be true" details
- Ask how they got your number
- Sound interested but ask lots of questions before "deciding"`;

    case 'tech_scam':
      return `${basePrompt}

DETECTED: This appears to be a tech support scam.

Your strategy:
- Play confused elderly person who doesn't understand technology
- Ask them to explain everything slowly
- Ask for their company name, callback number
- Ask how they detected the "problem"
- Say you need to ask your grandson/granddaughter for help
- Keep them talking by asking basic questions`;

    case 'government_scam':
      return `${basePrompt}

DETECTED: This appears to be an IRS/government scam.

Your strategy:
- Sound worried and concerned
- Ask for their badge number, department, callback number
- Ask for written documentation
- Ask specific questions about the "issue"
- Say you want to verify with the real IRS/government agency first
- Keep asking for official proof`;

    default:
      return `${basePrompt}

Your strategy:
- Be polite and professional
- Ask clarifying questions about why they're calling
- Ask for company name and callback number if it's business
- Keep responses natural and conversational
- Try to understand their purpose`;
  }
}

/**
 * Add natural speech patterns to AI response
 */
function addNaturalSpeech(text: string): string {
  // Add SSML pauses for more natural speech
  let natural = text;

  // Add pauses after "um", "uh", "well"
  natural = natural.replace(/\bum\b/gi, 'um<break time="300ms"/>');
  natural = natural.replace(/\buh\b/gi, 'uh<break time="300ms"/>');
  natural = natural.replace(/\bwell\b/gi, 'well<break time="400ms"/>');
  natural = natural.replace(/\bokay\b/gi, 'okay<break time="300ms"/>');

  // Add pauses after sentences
  natural = natural.replace(/\.\s+/g, '.<break time="500ms"/> ');
  natural = natural.replace(/\?\s+/g, '?<break time="600ms"/> ');

  // Wrap in SSML speak tag
  return `<speak>${natural}</speak>`;
}

/**
 * Process speech input from caller
 * This is called when caller speaks
 */
export async function processSpeechInput(
  speechResult: string,
  callSid: string
): Promise<string> {
  const response = new VoiceResponse();

  try {
    console.log(`📞 Processing speech from call ${callSid}: "${speechResult}"`);
    console.log(`🔑 Environment check: GROQ_API_KEY=${process.env.GROQ_API_KEY?.substring(0, 10)}...`);

    // Get or create conversation for this call
    let conversation = conversationCache.get(callSid);
    if (!conversation) {
      conversation = {
        callSid,
        history: [],
        detectedIntent: null,
        startTime: Date.now(),
      };
      conversationCache.set(callSid, conversation);
    }

    // Add user's speech to history
    conversation.history.push({
      role: 'user',
      content: speechResult,
      timestamp: Date.now(),
    });

    // Detect intent if not already detected
    if (!conversation.detectedIntent && conversation.history.length >= 2) {
      conversation.detectedIntent = detectIntent(conversation.history);
      console.log(`🎯 Detected intent: ${conversation.detectedIntent}`);
    }

    // Generate AI response using conversation history
    console.log(`🔄 Calling Groq API with ${conversation.history.length} conversation turns...`);
    const aiResponse = await generateAIResponse(
      speechResult,
      conversation.history,
      conversation.detectedIntent || 'unknown'
    );
    console.log(`🤖 AI Response: "${aiResponse}"`);

    // Add AI response to history
    conversation.history.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: Date.now(),
    });

    // Speak the AI response (without SSML for now to avoid errors)
    response.say(
      {
        voice: 'Polly.Joanna',
        language: 'en-US',
      },
      aiResponse
    );

    // Continue conversation - gather more input
    const gather = response.gather({
      input: ['speech'],
      timeout: 5,
      speechTimeout: 'auto',
      action: '/api/calls/process-speech',
      method: 'POST',
    });

    // If no more input, end gracefully
    response.say('Thank you for calling. Have a great day!');
    response.hangup();

  } catch (error: any) {
    console.error('❌ Error processing speech:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      callSid,
      speechResult
    });

    response.say(
      {
        voice: 'Polly.Joanna',
        language: 'en-US',
      },
      'I apologize, there was a technical issue. Please try again later. Goodbye.'
    );
    response.hangup();
  }

  return response.toString();
}

/**
 * Generate AI response to keep conversation going
 * This uses Groq LLM with full conversation context and adaptive strategy
 */
async function generateAIResponse(
  userInput: string,
  conversationHistory: ConversationTurn[],
  detectedIntent: string
): Promise<string> {
  try {
    console.log(`🎯 Generating AI response for intent: ${detectedIntent}`);

    // Get adaptive system prompt based on intent
    const systemPrompt = getAdaptivePrompt(detectedIntent);

    // Build messages array with full conversation history
    const messages: any[] = [
      {
        role: 'system',
        content: systemPrompt + `

CRITICAL RULES:
- Keep responses SHORT (1-2 sentences maximum)
- Sound natural - use "um", "okay", "I see", "well" occasionally
- Don't reveal you're an AI
- Ask one question at a time
- Remember everything said in this conversation
- Adapt your tone based on what you've learned`
      }
    ];

    // Add conversation history (limit to last 10 turns to save tokens)
    const recentHistory = conversationHistory.slice(-10);
    for (const turn of recentHistory) {
      messages.push({
        role: turn.role,
        content: turn.content
      });
    }

    // Generate response with full context
    console.log(`📤 Sending request to Groq API...`);
    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8, // Slightly higher for more natural variation
      max_tokens: 80, // Shorter for more concise responses
      top_p: 0.9,
    });

    console.log(`📥 Received response from Groq API`);

    const aiResponse = completion.choices[0]?.message?.content ||
      'Um, I see. Could you tell me more about that?';

    return aiResponse;

  } catch (error: any) {
    console.error('❌ Error generating AI response:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error status:', error.status);
    return 'Well, I understand. Could you please provide more details?';
  }
}

/**
 * Handle recording completion
 * This is called when call ends and recording is ready
 */
export async function handleRecordingComplete(
  recordingUrl: string,
  callSid: string,
  callerNumber: string,
  duration: number
): Promise<void> {
  try {
    console.log(`📹 Recording complete for call ${callSid}`);
    console.log(`   URL: ${recordingUrl}`);
    console.log(`   Duration: ${duration} seconds`);

    // Get conversation history for this call
    const conversation = conversationCache.get(callSid);
    let fullTranscript = '';

    if (conversation && conversation.history.length > 0) {
      // Build transcript from conversation history
      fullTranscript = conversation.history
        .map((turn, index) => {
          const speaker = turn.role === 'user' ? 'Caller' : 'AI';
          return `[${speaker}]: ${turn.content}`;
        })
        .join('\n\n');

      console.log(`📝 Conversation transcript generated (${conversation.history.length} turns)`);
    } else {
      fullTranscript = 'Call transcript will be generated here after implementing Groq Whisper integration';
    }

    // Analyze for violations
    const analysis = await analyzeCallForViolations(fullTranscript);

    // Save to database with actual user ID
    // TODO: In production, get user_id from request/session
    const userId = 'cd52ff3b-2038-4888-960d-e142e660a544'; // Your Supabase auth user ID

    const { data: call, error: callError } = await supabase
      .from('calls')
      .insert({
        user_id: userId,
        caller_number: callerNumber,
        call_duration: duration,
        call_status: 'completed',
        transcript: fullTranscript,
        is_spam: analysis.is_spam,
        recording_url: recordingUrl,
      })
      .select()
      .single();

    if (callError) {
      console.error('❌ Error saving call:', callError);
      return;
    }

    console.log(`✅ Call saved with ID: ${call.id}`);
    if (conversation?.detectedIntent) {
      console.log(`🎯 Detected intent: ${conversation.detectedIntent}`);
    }

    // Save violations
    for (const violation of analysis.violations) {
      await supabase
        .from('violations')
        .insert({
          call_id: call.id,
          violation_type: violation.violation_type,
          violation_description: violation.violation_description,
          timestamp_in_call: violation.timestamp_in_call,
          confidence_score: violation.confidence_score,
        });
    }

    console.log(`✨ Analysis complete: ${analysis.violations.length} violations detected`);

    // Clean up conversation from cache
    conversationCache.delete(callSid);

  } catch (error) {
    console.error('❌ Error handling recording:', error);
  }
}
