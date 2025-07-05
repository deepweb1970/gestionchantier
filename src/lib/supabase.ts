import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erreur: Variables d\'environnement Supabase manquantes. Veuillez configurer votre fichier .env');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);