import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Logos Polis data, including the custom login table, lives in this schema.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'logos_polis' },
});
