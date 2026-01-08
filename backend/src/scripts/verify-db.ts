import { supabase } from '../utils/supabase';

async function verifyDatabase() {
  console.log('🔍 Verifying database setup...\n');

  try {
    // Check if tables exist by trying to query them
    const tables = ['calls', 'violations', 'legal_cases', 'case_calls', 'user_settings'];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Table '${table}': NOT FOUND or ERROR`);
        console.log(`   Error: ${error.message}\n`);
      } else {
        console.log(`✅ Table '${table}': EXISTS`);
      }
    }

    console.log('\n📊 Database verification complete!\n');
    console.log('If any tables are missing, you need to run the SQL scripts in Supabase:');
    console.log('1. Go to: https://supabase.com/dashboard/project/xhywujwsdiqqigmgdoaj/sql');
    console.log('2. Run backend/database-schema.sql');
    console.log('3. Run backend/database-rls.sql\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  process.exit(0);
}

verifyDatabase();
