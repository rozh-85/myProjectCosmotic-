
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wckhoayjgzfoizvptjer.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indja2hvYXlqZ3pmb2l6dnB0amVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNTMxNDEsImV4cCI6MjA4MjkyOTE0MX0.TQ5rPcKKZPboGt_nr19aJw3mpMJ8uPtPmYJRCOuOqRs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
