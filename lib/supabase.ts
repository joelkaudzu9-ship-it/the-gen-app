// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ✅ Add check to make sure variables exist
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase environment variables are missing!')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const getParticipant = async (userId: string) => {
  const { data } = await supabase
    .from('participants')
    .select('*, groups(*), transport(*)')
    .eq('user_id', userId)
    .single()
  return data
}