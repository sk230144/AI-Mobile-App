import { supabase } from '../utils/supabase';
import * as fs from 'fs';
import * as path from 'path';

async function downloadRecording() {
  console.log('🎙️  Fetching latest call with recording...\n');

  // Get the most recent call with a recording
  const { data: calls, error } = await supabase
    .from('calls')
    .select('*')
    .not('recording_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !calls || calls.length === 0) {
    console.error('❌ No calls with recordings found');
    return;
  }

  const call = calls[0];
  console.log(`📞 Call ID: ${call.id}`);
  console.log(`📱 Caller: ${call.caller_number}`);
  console.log(`⏱️  Duration: ${call.call_duration} seconds`);
  console.log(`🎙️  Recording URL: ${call.recording_url}\n`);

  // Download the recording
  const recordingUrl = call.recording_url;
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;

  console.log('⬇️  Downloading recording...');

  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const response = await fetch(recordingUrl, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to file
    const fileName = `recording_${call.id}_${Date.now()}.wav`;
    const filePath = path.join(process.cwd(), 'recordings', fileName);

    // Create recordings directory if it doesn't exist
    const recordingsDir = path.join(process.cwd(), 'recordings');
    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true });
    }

    fs.writeFileSync(filePath, buffer);

    console.log(`✅ Recording saved to: ${filePath}`);
    console.log(`📊 File size: ${(buffer.length / 1024).toFixed(2)} KB`);

  } catch (error: any) {
    console.error('❌ Error downloading recording:', error.message);
  }
}

downloadRecording()
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
