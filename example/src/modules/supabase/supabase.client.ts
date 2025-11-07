import {createClient} from '@supabase/supabase-js';
import {Database} from './supabase';

const supabaseUrl = 'https://rjcogfxactzvhldzuxfb.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqY29nZnhhY3R6dmhsZHp1eGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDIyNjgwNzEsImV4cCI6MjAxNzg0NDA3MX0.2-nMK_XS-8PKSb0AixNS-8lToPB4d4mczFoeNWBln68';
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseKey);
