'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  zone: string;
  target: number;
  converted: number;
  status: string;
  is_digital: boolean;
  platform?: string;
  reach?: string;
  engagement?: number;
  topic?: string;
  conversion_rank?: string;
}

export function useTeam() {
  return useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return (data || []) as TeamMember[];
    }
  });
}
