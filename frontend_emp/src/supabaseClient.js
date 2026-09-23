import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mbblahvstusfzlbzztrp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iYmxhaHZzdHVzZnpsYnp6dHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNDc0MDgsImV4cCI6MjEwNTcyMzQwOH0.8yB_vYgCEZ8zcBVULYUVJv-eIdU3JdSRVX3LgEdYg3w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
