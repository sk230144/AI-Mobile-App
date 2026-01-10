import twilio from 'twilio';
import { analyzeCallForViolations } from './violation-detection.service';
import { supabase } from '../utils/supabase';
import Groq from 'groq-sdk';

const VoiceResponse = twilio.twiml.VoiceResponse;

// Initialize Groq for AI conversation
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

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

    // Generate AI response using Groq
    const aiResponse = await generateAIResponse(speechResult);
    console.log(`🤖 AI Response: "${aiResponse}"`);

    // Speak the AI response
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

  } catch (error) {
    console.error('❌ Error processing speech:', error);
    response.say('I apologize, there was a technical issue. Goodbye.');
    response.hangup();
  }

  return response.toString();
}

/**
 * Generate AI response to keep conversation going
 * This uses Groq LLM to respond intelligently
 */
async function generateAIResponse(userInput: string): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant answering phone calls. Your goal is to:
1. Keep the conversation going to collect information
2. Ask clarifying questions
3. Be polite and professional
4. If caller is trying to sell something or collect debt, ask for their company name, callback number, and purpose
5. Keep responses short (1-2 sentences)
6. Don't reveal you're an AI`
        },
        {
          role: 'user',
          content: userInput
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 100,
    });

    const aiResponse = completion.choices[0]?.message?.content ||
      'I see. Could you tell me more about that?';

    return aiResponse;

  } catch (error) {
    console.error('❌ Error generating AI response:', error);
    return 'I understand. Could you please provide more details?';
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

    // TODO: Download and transcribe the recording using Groq Whisper
    // For now, we'll use a placeholder transcript
    const transcript = 'Call transcript will be generated here after implementing Groq Whisper integration';

    // Analyze for violations
    const analysis = await analyzeCallForViolations(transcript);

    // Save to database
    const { data: call, error: callError } = await supabase
      .from('calls')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // TODO: Get actual user ID
        caller_number: callerNumber,
        call_duration: duration,
        call_status: 'completed',
        transcript: transcript,
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

  } catch (error) {
    console.error('❌ Error handling recording:', error);
  }
}
