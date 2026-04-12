// ─── SUPABASE SETUP ─────────────────────────────────────────
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://qqbfiwixlqsnjsmwirtf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYmZpd2l4bHFzbmpzbXdpcnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5Mjc2OTEsImV4cCI6MjA5MTUwMzY5MX0.Qy2_QBt4l2uRPiLQIKAaao4gNwZf0bkniUob9EtBXMY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
