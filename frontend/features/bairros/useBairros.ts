import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useBairros() {
  return useQuery({
    queryKey: ['bairros'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bairros')
        .select('cidade, bairro, latitude, longitude')
        .order('bairro');

      if (error) throw error;
      
      const uniqueBairros = Array.from(new Set(data.map(b => b.bairro)));
      return uniqueBairros;
    }
  });
}
