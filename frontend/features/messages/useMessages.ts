import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useMessages() {
  return useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      // Fetch interactions and join with voters and demands
      // We will map this to the format expected by the UI
      const { data, error } = await supabase
        .from('interactions')
        .select(`
          id,
          content,
          type,
          category,
          priority,
          sentiment,
          created_at,
          voter:voters(name, phone, neighborhood),
          demands(status)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      return (data || []).map((msg: any) => {
        // Calculate time ago
        const date = new Date(msg.created_at);
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
        let timeAgo = `${diffMinutes} min atrás`;
        if (diffMinutes > 60) {
          const hours = Math.floor(diffMinutes / 60);
          timeAgo = `${hours} h atrás`;
          if (hours > 24) {
            timeAgo = `${Math.floor(hours / 24)} dias atrás`;
          }
        }

        const demand = msg.demands?.[0];

        return {
          id: msg.id,
          name: msg.voter?.name || 'Desconhecido',
          phone: msg.voter?.phone || 'S/N',
          hood: msg.voter?.neighborhood || 'N/A',
          text: msg.content,
          theme: msg.category || 'Outros',
          priority: msg.priority || 'Média',
          type: msg.type || 'Informação',
          sentiment: msg.sentiment || 'Neutro',
          status: demand?.status || 'Pendente',
          time: timeAgo,
        };
      });
    }
  });
}
