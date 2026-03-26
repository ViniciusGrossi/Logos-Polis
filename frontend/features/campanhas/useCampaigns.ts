'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Campaign {
  id: string;
  name: string;
  platform: string;
  spend: number;
  cpa: number;
  conversions: number;
  status: string;
}

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Mapeamento e fallback para garantir renderização correta mesmo sem dados perfeitos
      return (data || []).map(camp => ({
        id: camp.id || Math.random().toString(),
        name: camp.name || 'Nova Campanha',
        platform: camp.platform || 'Desconhecida',
        spend: parseFloat(camp.spend) || 0,
        cpa: parseFloat(camp.cpa) || 0,
        conversions: camp.conversions || 0,
        status: camp.status || 'Ativa'
      })) as Campaign[];
    }
  });
}
