import { createClient } from '@supabase/supabase-js';

// 1. Usamos .trim() para matar cualquier espacio invisible accidental.
// 2. Metemos una URL temporal estructuralmente válida. Así, si Vercel se atonta 
//    durante el build, engañamos al empaquetador para que pase de largo sin colapsar.
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://temporal.supabase.co').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'llave-temporal').trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);