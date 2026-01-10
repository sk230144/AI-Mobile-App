import { supabase } from '../utils/supabase';

async function createDefaultUser() {
  console.log('👤 Creating default user...\n');

  const defaultUserId = '00000000-0000-0000-0000-000000000000';

  // Check if user already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', defaultUserId)
    .single();

  if (existing) {
    console.log('✅ Default user already exists!');
    return;
  }

  // Create default user
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: defaultUserId,
      email: 'default@ai-spam-defender.com',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating user:', error);
    return;
  }

  console.log('✅ Default user created successfully!');
  console.log('   ID:', data.id);
  console.log('   Email:', data.email);
}

createDefaultUser()
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
