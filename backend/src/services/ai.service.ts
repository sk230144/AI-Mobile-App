import Groq from 'groq-sdk';

// Lazy-load Groq client to ensure env variables are loaded
let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY!,
    });
  }
  return groqClient;
}

export async function generateAIResponse(
  conversationHistory: string,
  callerMessage: string
): Promise<string> {
  try {
    console.log('🤖 Generating AI response for:', callerMessage);
    const groq = getGroqClient();

    const systemPrompt = `You are an AI assistant answering a potential spam or debt collection call. Keep the caller talking to gather evidence. Ask questions to identify the company name and purpose. Be polite but persistent. Never give personal information. Keep responses under 30 words.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Caller said: "${callerMessage}". How do you respond?` },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 100,
    });

    const aiResponse = completion.choices[0]?.message?.content || '';
    console.log('✅ AI response:', aiResponse.substring(0, 50) + '...');
    return aiResponse.trim();
  } catch (error) {
    console.error('❌ Error:', error);
    return "I'm sorry, could you repeat that?";
  }
}

export async function identifyCall(transcript: string): Promise<any> {
  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a call analysis expert. Return only valid JSON.' },
        { role: 'user', content: `Analyze if this is spam: "${transcript}". Return JSON with isSpam, confidence, callerType, companyName, purpose.` },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 200,
    });

    const response = completion.choices[0]?.message?.content || '';
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    
    return { isSpam: false, confidence: 0.5, callerType: 'unknown' };
  } catch (error) {
    console.error('❌ Error identifying:', error);
    return { isSpam: false, confidence: 0, callerType: 'unknown' };
  }
}
