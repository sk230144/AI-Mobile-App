import { supabase } from '../utils/supabase';

interface TestCall {
  caller_number: string;
  call_duration: number;
  call_status: string;
  transcript: string;
  is_spam: boolean;
  violations: Array<{
    violation_type: string;
    violation_description: string;
    timestamp_in_call: number;
    confidence_score: number;
  }>;
}

const testCalls: TestCall[] = [
  {
    caller_number: '+1-555-0123',
    call_duration: 145,
    call_status: 'completed',
    transcript: 'Hello, this is David from ABC Debt Collection. You owe $5,000 on your credit card. If you don\'t pay immediately, we will send the police to your house and garnish your wages.',
    is_spam: true,
    violations: [
      {
        violation_type: 'FDCPA - False Threats',
        violation_description: 'Threatened to send police to consumer\'s house, which is a false threat prohibited under FDCPA',
        timestamp_in_call: 15,
        confidence_score: 0.95,
      },
      {
        violation_type: 'FDCPA - Harassment',
        violation_description: 'Threatened wage garnishment without legal process',
        timestamp_in_call: 18,
        confidence_score: 0.88,
      },
    ],
  },
  {
    caller_number: '+1-555-0456',
    call_duration: 98,
    call_status: 'completed',
    transcript: 'Hi, I\'m calling about your car\'s extended warranty. This is your final notice. Press 1 to speak with an agent or you\'ll lose coverage forever.',
    is_spam: true,
    violations: [
      {
        violation_type: 'TCPA - Robocall',
        violation_description: 'Unsolicited robocall without prior express consent',
        timestamp_in_call: 0,
        confidence_score: 0.92,
      },
      {
        violation_type: 'TCPA - False Urgency',
        violation_description: 'Created false sense of urgency with "final notice" claim',
        timestamp_in_call: 8,
        confidence_score: 0.85,
      },
    ],
  },
  {
    caller_number: '+1-555-0789',
    call_duration: 187,
    call_status: 'completed',
    transcript: 'This is Sarah from XYZ Collections calling about your medical bill. You need to pay $2,500 today or we will report you to the credit bureaus and sue you. We\'ve already contacted your employer about this debt.',
    is_spam: true,
    violations: [
      {
        violation_type: 'FDCPA - Third Party Disclosure',
        violation_description: 'Disclosed debt information to consumer\'s employer, violating third-party disclosure rules',
        timestamp_in_call: 25,
        confidence_score: 0.97,
      },
      {
        violation_type: 'FDCPA - False Threats',
        violation_description: 'Threatened immediate credit reporting and lawsuit without proper legal process',
        timestamp_in_call: 12,
        confidence_score: 0.90,
      },
      {
        violation_type: 'FDCPA - Harassment',
        violation_description: 'Used threatening and oppressive tactics to coerce payment',
        timestamp_in_call: 15,
        confidence_score: 0.87,
      },
    ],
  },
  {
    caller_number: '+1-555-0321',
    call_duration: 67,
    call_status: 'completed',
    transcript: 'Congratulations! You\'ve been selected to receive a free cruise to the Bahamas. Press 1 now to claim your prize before it expires!',
    is_spam: true,
    violations: [
      {
        violation_type: 'TCPA - Unsolicited Call',
        violation_description: 'Unsolicited telemarketing call without prior consent',
        timestamp_in_call: 0,
        confidence_score: 0.93,
      },
      {
        violation_type: 'FTC - Deceptive Practices',
        violation_description: 'False "free prize" claim likely designed to collect personal information',
        timestamp_in_call: 5,
        confidence_score: 0.89,
      },
    ],
  },
  {
    caller_number: '+1-555-0654',
    call_duration: 213,
    call_status: 'completed',
    transcript: 'Hello, I\'m calling from Microsoft Technical Support. We\'ve detected viruses on your computer. You need to give me remote access right now to fix this critical security issue, or your computer will crash and you\'ll lose all your data.',
    is_spam: true,
    violations: [
      {
        violation_type: 'TCPA - Fraudulent Call',
        violation_description: 'Fraudulent tech support scam call impersonating legitimate company',
        timestamp_in_call: 0,
        confidence_score: 0.98,
      },
      {
        violation_type: 'FTC - Deceptive Practices',
        violation_description: 'False security threat to coerce immediate action and access to computer',
        timestamp_in_call: 10,
        confidence_score: 0.96,
      },
    ],
  },
  {
    caller_number: '+1-555-0987',
    call_duration: 42,
    call_status: 'completed',
    transcript: 'Hello, this is a quick call from your bank regarding suspicious activity on your account. Please call us back immediately at this number to verify your identity.',
    is_spam: true,
    violations: [
      {
        violation_type: 'TCPA - Spoofing',
        violation_description: 'Caller ID spoofing to impersonate legitimate financial institution',
        timestamp_in_call: 0,
        confidence_score: 0.91,
      },
    ],
  },
];

async function seedTestData(userIdParam?: string) {
  try {
    console.log('🌱 Starting test data seed...\n');

    let userId: string | undefined = userIdParam || process.env.SEED_USER_ID;

    // If no user ID provided, try to find one from existing data
    if (!userId) {
      console.log('🔍 Looking for existing user...\n');

      // Try fetching from calls table
      const { data: existingCalls } = await supabase
        .from('calls')
        .select('user_id')
        .limit(1);

      if (existingCalls && existingCalls.length > 0) {
        userId = existingCalls[0].user_id;
        console.log(`✅ Found existing user from previous calls: ${userId}\n`);
      }
    }

    if (!userId) {
      console.error('❌ No user ID found. Please create an account first:\n');
      console.error('   Option 1: Create account in mobile app, then run:');
      console.error('             npm run seed\n');
      console.error('   Option 2: Provide user ID from Supabase Dashboard:');
      console.error('             SEED_USER_ID=your-user-id npm run seed\n');
      return;
    }

    console.log(`👤 Using user ID: ${userId}\n`);

    for (const testCall of testCalls) {
      console.log(`📞 Creating call from ${testCall.caller_number}...`);

      // Insert call
      const { data: call, error: callError } = await supabase
        .from('calls')
        .insert({
          user_id: userId,
          caller_number: testCall.caller_number,
          call_duration: testCall.call_duration,
          call_status: testCall.call_status,
          transcript: testCall.transcript,
          is_spam: testCall.is_spam,
          recording_url: null,
        })
        .select()
        .single();

      if (callError) {
        console.error(`❌ Error creating call: ${callError.message}`);
        continue;
      }

      console.log(`✅ Call created with ID: ${call.id}`);

      // Insert violations
      for (const violation of testCall.violations) {
        const { error: violationError } = await supabase
          .from('violations')
          .insert({
            call_id: call.id,
            violation_type: violation.violation_type,
            violation_description: violation.violation_description,
            timestamp_in_call: violation.timestamp_in_call,
            confidence_score: violation.confidence_score,
          });

        if (violationError) {
          console.error(`❌ Error creating violation: ${violationError.message}`);
        } else {
          console.log(`   ⚠️  Violation added: ${violation.violation_type}`);
        }
      }

      console.log('');
    }

    console.log('✨ Test data seeding complete!\n');
    console.log('📊 Summary:');
    console.log(`   - ${testCalls.length} test calls created`);
    console.log(`   - ${testCalls.reduce((sum, call) => sum + call.violations.length, 0)} violations detected`);
    console.log(`   - All calls marked as spam\n`);
    console.log('🎉 You can now view these calls in your mobile app!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the seed function
seedTestData();
