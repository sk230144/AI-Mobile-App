import { createClient } from '@supabase/supabase-js';

console.log('🔧 Initializing Supabase client...');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

console.log('✅ Environment variables loaded');
console.log('📍 Supabase URL:', supabaseUrl);
console.log('🔑 Anon Key:', supabaseAnonKey ? '✅ Present' : '❌ Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  throw new Error('Missing Supabase environment variables');
}

console.log('🔐 Creating Supabase client WITHOUT session persistence...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: undefined,
    autoRefreshToken: true,
    persistSession: false, // Disable session persistence to avoid AsyncStorage issues
    detectSessionInUrl: false,
  },
});

console.log('✅ Supabase client created successfully');
