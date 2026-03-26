import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Configuração do Supabase Client
// Nota: O schema 'logos_polis' não está exposto nas configurações de API do Supabase (Erro 406).
// Por isso, utilizamos as views criadas no schema 'public' como fallback (Regra #5).
export const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
        fetch: (url, options) => {
            const newOptions = { ...options };
            newOptions.headers = {
                ...newOptions.headers,
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            };
            return fetch(url, newOptions);
        }
    }
});
