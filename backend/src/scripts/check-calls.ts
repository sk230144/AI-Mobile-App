import { supabase } from '../utils/supabase';

async function checkRecentCalls() {
  console.log('🔍 Checking recent calls in database...\n');

  // Get all calls from the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: calls, error } = await supabase
    .from('calls')
    .select('*')
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching calls:', error);
    return;
  }

  if (!calls || calls.length === 0) {
    console.log('📭 No calls found in the last hour');
    return;
  }

  console.log(`📞 Found ${calls.length} call(s):\n`);

  for (const call of calls) {
    console.log('─────────────────────────────────────');
    console.log(`📱 Call ID: ${call.id}`);
    console.log(`📞 Caller: ${call.caller_number}`);
    console.log(`⏱️  Duration: ${call.call_duration} seconds`);
    console.log(`📊 Status: ${call.call_status}`);
    console.log(`🚨 Is Spam: ${call.is_spam ? 'YES' : 'NO'}`);
    console.log(`🎙️  Recording: ${call.recording_url || 'Not available'}`);
    console.log(`📝 Transcript: ${call.transcript?.substring(0, 100) || 'Not available'}...`);
    console.log(`🕐 Created: ${new Date(call.created_at).toLocaleString()}`);
    console.log('');
  }

  console.log('─────────────────────────────────────\n');

  // Check for violations
  for (const call of calls) {
    const { data: violations } = await supabase
      .from('violations')
      .select('*')
      .eq('call_id', call.id);

    if (violations && violations.length > 0) {
      console.log(`⚠️  Call ${call.id} has ${violations.length} violation(s):`);
      violations.forEach((v, i) => {
        console.log(`   ${i + 1}. ${v.violation_type}`);
        console.log(`      ${v.violation_description}`);
        console.log(`      Confidence: ${(v.confidence_score * 100).toFixed(0)}%`);
      });
      console.log('');
    }
  }
}

checkRecentCalls()
  .then(() => {
    console.log('✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
