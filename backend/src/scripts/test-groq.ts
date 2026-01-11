import Groq from 'groq-sdk';

async function testGroq() {
  console.log('🧪 Testing Groq API...\n');

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
  });

  try {
    console.log('📤 Sending test request to Groq...');

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Keep responses very short.'
        },
        {
          role: 'user',
          content: 'Hello, you owe five thousand dollars'
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 80,
    });

    const response = completion.choices[0]?.message?.content || 'No response';

    console.log('✅ Groq API is working!');
    console.log(`📝 Response: "${response}"`);
    console.log(`⏱️  Time taken: ${completion.usage?.total_time || 'N/A'}ms`);

  } catch (error: any) {
    console.error('❌ Groq API Error:', error.message);
    if (error.status) console.error(`   Status: ${error.status}`);
    if (error.code) console.error(`   Code: ${error.code}`);
  }
}

testGroq()
  .then(() => {
    console.log('\n✅ Test complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
