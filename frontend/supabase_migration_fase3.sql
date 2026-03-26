-- Execute este script no SQL Editor do Supabase para criar as tabelas necessárias que substituirão os últimos mocks.

CREATE TABLE IF NOT EXISTS logos_polis.campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  platform text NOT NULL,
  spend numeric DEFAULT 0,
  cpa numeric DEFAULT 0,
  conversions integer DEFAULT 0,
  status text DEFAULT 'Ativa',
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS (opcional para a fase de testes, mas recomendado)
ALTER TABLE logos_polis.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read campaigns" ON logos_polis.campaigns FOR SELECT USING (true);


CREATE TABLE IF NOT EXISTS logos_polis.competitor_mentions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  text text NOT NULL,
  platform text NOT NULL,
  sentiment text NOT NULL,
  engagement text DEFAULT 'Baixo',
  competitor_id text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE logos_polis.competitor_mentions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read competitor mentions" ON logos_polis.competitor_mentions FOR SELECT USING (true);


CREATE TABLE IF NOT EXISTS logos_polis.team_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL,
  zone text,
  target integer DEFAULT 0,
  converted integer DEFAULT 0,
  status text DEFAULT 'Ativo',
  is_digital boolean DEFAULT false,
  platform text,
  reach text,
  engagement numeric,
  topic text,
  conversion_rank text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE logos_polis.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read team members" ON logos_polis.team_members FOR SELECT USING (true);
