'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface VoterScore {
  id: string;
  name: string;
  phone: string;
  neighborhood: string;
  score: number;
  sentiment: 'apoiador' | 'neutro' | 'critico';
  lastInteraction: string;
  status: 'ativo' | 'inativo';
}

export function useVoterScores(globalRegionFilter: string | null) {
  return useQuery({
    queryKey: ['voters', 'scores', globalRegionFilter],
    queryFn: async () => {
      let query = supabase.from('voters').select(`
        id, 
        name, 
        phone, 
        neighborhood, 
        voter_score, 
        status, 
        interactions(created_at, sentiment)
      `);
      
      if (globalRegionFilter) {
        query = query.ilike('neighborhood', `%${globalRegionFilter}%`);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Supabase Error:', error);
        throw error;
      }
      
      return (data || []).map((voter: any) => {
        const interactions = voter.interactions || [];
        interactions.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const lastIn = interactions[0];
        
        let sentimentClass: 'apoiador' | 'neutro' | 'critico' = 'neutro';
        if (lastIn?.sentiment === 'Positivo') sentimentClass = 'apoiador';
        else if (lastIn?.sentiment === 'Negativo') sentimentClass = 'critico';
        else if (voter.voter_score > 70) sentimentClass = 'apoiador';
        else if (voter.voter_score < 40) sentimentClass = 'critico';

        return {
          id: voter.id,
          name: voter.name,
          phone: voter.phone || 'N/A',
          neighborhood: voter.neighborhood || 'Desconhecido',
          score: Number(voter.voter_score),
          sentiment: sentimentClass,
          lastInteraction: lastIn ? new Date(lastIn.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          status: voter.status as 'ativo' | 'inativo'
        };
      }) as VoterScore[];
    }
  });
}
