import {createClient, SupportedStorage} from '@supabase/supabase-js';
import {Database} from './supabase';
import {MMKV} from 'react-native-mmkv';

const supabaseUrl = 'https://rjcogfxactzvhldzuxfb.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqY29nZnhhY3R6dmhsZHp1eGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDIyNjgwNzEsImV4cCI6MjAxNzg0NDA3MX0.2-nMK_XS-8PKSb0AixNS-8lToPB4d4mczFoeNWBln68';

const mmkv = new MMKV({
  id: '@openroad/mmkv',
});

class Storage implements SupportedStorage {
  async getItem(key: string) {
    return mmkv.getString(key);
  }

  async setItem(key: string, value: string) {
    mmkv.set(key, value);
  }

  async removeItem(key: string) {
    mmkv.delete(key);
  }
}

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: new Storage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
