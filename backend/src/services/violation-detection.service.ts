import Groq from 'groq-sdk';

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY!,
    });
  }
  return groqClient;
}

interface Violation {
  violation_type: string;
  violation_description: string;
  timestamp_in_call: number;
  confidence_score: number;
}

interface ViolationAnalysis {
  is_spam: boolean;
  violations: Violation[];
  caller_type: string;
  summary: string;
}

export async function analyzeCallForViolations(transcript: string): Promise<ViolationAnalysis> {
  try {
    console.log('🔍 Analyzing call transcript for violations...');
    const groq = getGroqClient();

    const systemPrompt = `You are a legal expert specializing in TCPA (Telephone Consumer Protection Act) and FDCPA (Fair Debt Collection Practices Act) violations.

Analyze the call transcript and identify any legal violations. Return a JSON object with:
- is_spam: boolean indicating if this is a spam call
- caller_type: string (e.g., "debt_collector", "telemarketer", "scammer", "legitimate", "robocall")
- summary: brief description of the call
- violations: array of violation objects, each with:
  - violation_type: specific violation (e.g., "FDCPA - False Threats", "TCPA - Robocall", "FDCPA - Third Party Disclosure")
  - violation_description: detailed explanation of the violation
  - timestamp_in_call: estimated seconds into call when violation occurred (0-300)
  - confidence_score: confidence level (0.0-1.0)

Common violations to look for:
FDCPA:
- False threats (jail, arrest, wage garnishment without legal process)
- Third-party disclosure (discussing debt with others)
- Harassment or oppressive tactics
- Misrepresentation of debt amount or legal status
- Calling at unreasonable times
- Failure to validate debt

TCPA:
- Unsolicited robocalls without consent
- Calls to numbers on Do Not Call registry
- Calling before 8 AM or after 9 PM
- Using automated dialing systems without consent
- Caller ID spoofing

FTC Violations:
- Deceptive practices
- False advertising
- Fraudulent schemes

Return ONLY valid JSON, no other text.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Analyze this call transcript for legal violations:\n\n"${transcript}"\n\nReturn only valid JSON.`
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content || '';
    console.log('📝 Raw AI response:', response.substring(0, 200) + '...');

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️  No JSON found in response, returning default analysis');
      return {
        is_spam: false,
        violations: [],
        caller_type: 'unknown',
        summary: 'Unable to analyze call',
      };
    }

    const analysis = JSON.parse(jsonMatch[0]) as ViolationAnalysis;

    console.log('✅ Analysis complete:');
    console.log(`   - Is Spam: ${analysis.is_spam}`);
    console.log(`   - Caller Type: ${analysis.caller_type}`);
    console.log(`   - Violations Found: ${analysis.violations.length}`);

    return analysis;

  } catch (error) {
    console.error('❌ Error analyzing violations:', error);
    return {
      is_spam: false,
      violations: [],
      caller_type: 'unknown',
      summary: 'Error analyzing call',
    };
  }
}

export async function detectSpamCall(transcript: string, callerNumber: string): Promise<{
  is_spam: boolean;
  confidence: number;
  reason: string;
}> {
  try {
    const groq = getGroqClient();

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a spam call detection expert. Analyze if this is a spam/scam call. Return only JSON with: is_spam (boolean), confidence (0-1), reason (string).'
        },
        {
          role: 'user',
          content: `Caller: ${callerNumber}\nTranscript: "${transcript}"\n\nIs this spam? Return JSON only.`
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 200,
    });

    const response = completion.choices[0]?.message?.content || '';
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        is_spam: result.is_spam || false,
        confidence: result.confidence || 0.5,
        reason: result.reason || 'Unknown',
      };
    }

    return { is_spam: false, confidence: 0, reason: 'Unable to analyze' };

  } catch (error) {
    console.error('❌ Error detecting spam:', error);
    return { is_spam: false, confidence: 0, reason: 'Error' };
  }
}
