
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xifxkuxzfmssfxcncgdw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpZnhrdXh6Zm1zc2Z4Y25jZ2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MjgwODYsImV4cCI6MjA4NjIwNDA4Nn0.tWTFLpm063djceFcDaXM0Qw9vdMPzV-tECSmYqBv_KI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
