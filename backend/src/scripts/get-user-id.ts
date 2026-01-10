import { supabase } from '../utils/supabase';

async function getUserId() {
  console.log('👤 Fetching Supabase auth users...\n');

  // Get users from Supabase Auth (requires service role key)
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('❌ Error fetching users:', error);
    return;
  }

  if (!data.users || data.users.length === 0) {
    console.log('📭 No users found');
    return;
  }

  console.log(`✅ Found ${data.users.length} user(s):\n`);

  data.users.forEach((user, i) => {
    console.log(`${i + 1}. User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
    console.log('');
  });

  console.log('\n💡 Use this user ID in your calls!');
}

getUserId()
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
