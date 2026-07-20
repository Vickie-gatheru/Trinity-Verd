import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const hasPlaceholderValue = (value?: string) =>
  !value || value.includes('your_') || value.includes('YOUR_') || value.includes('replace_me');

const looksLikeSecretKey = (value?: string) => Boolean(value && value.startsWith('sb_') && value.includes('secret'));

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !hasPlaceholderValue(supabaseUrl) &&
  !hasPlaceholderValue(supabaseAnonKey) &&
  !looksLikeSecretKey(supabaseAnonKey)
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

if (!isSupabaseConfigured) {
  console.warn('Supabase is not configured. Add your real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values to .env.local, then restart the dev server.');
}
