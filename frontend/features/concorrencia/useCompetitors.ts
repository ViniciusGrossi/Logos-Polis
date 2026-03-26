'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CompetitorMention {
  id: string;
  text: string;
  platform: string;
  sentiment: string;
  engagement: string;
  competitor_id: string;
  created_at: string;
}

export function useCompetitors(competitorId: string) {
  return useQuery({
    queryKey: ['competitors', 'mentions', competitorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitor_mentions')
        .select('*')
        .eq('competitor_id', competitorId)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      
      return (data || []) as CompetitorMention[];
    }
  });
}
