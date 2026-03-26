
import random
from datetime import datetime, timedelta

NEIGHBORHOODS = [
    "Jardim Ceu Azul", "Valparaiso I", "Valparaiso Ii", "Parque Esplanada I",
    "Parque Esplanada Ii", "Cidade Jardins", "Cruzeiro Do Sul", "Parque Rio Branco",
    "Morada Nobre", "Pacaembu", "Chacaras Anhanguera", "Vila Guaira", "Jardim Oriente",
    "Pedregal", "Lago Azul", "Lunabel", "Vila Uniao", "Jardim Abc", 
    "Parque Nova Friburgo", "Dom Bosco", "Jardim Do Inga", "Parque Industrial Mingone",
    "Parque Alvorada", "Jardim Zuleika", "Cidade Osfaya", "Setor Central", "Parque Estrela Dalva"
]

NAMES = [
    "Joao Silva", "Maria Santos", "Pedro Oliveira", "Ana Souza", "Carlos Lima",
    "Juliana Ferreira", "Lucas Ribeiro", "Beatriz Costa", "Ricardo Almeida", "Mariana Gomes",
    "Fernando Rocha", "Camila Martins", "Gabriel Silva", "Leticia Santos", "Paulo Oliveira",
    "Bruna Souza", "Marcelo Lima", "Vanessa Ferreira", "Thiago Ribeiro", "Amanda Costa",
    "Vitor Almeida", "Larissa Gomes", "Daniel Rocha", "Fernanda Martins", "Rafael Silva",
    "Isabela Santos", "Igor Oliveira", "Jessica Souza", "Leonardo Lima", "Tatiana Ferreira"
]

CAMPAIGNS = ["Mobilizacao Asfalto Já", "Saúde para Todos", "Segurança no Bairro", "Inscricao Programa Moradia", "Mutirão de Limpeza"]

sql = []

# 1. Clear some data if needed? No, let's keep existing.

# 2. Insert Voters (with historical dates)
sql.append("-- Inserting Mock Voters with Historical Dates")
for i in range(50):
    name = random.choice(NAMES) + f" {i}"
    neighborhood = random.choice(NEIGHBORHOODS)
    voter_score = random.randint(10, 100)
    influence_score = random.randint(5, 95)
    vote_prob = random.randint(0, 100)
    status = random.choice(['novo', 'ativo', 'fidelizado', 'desistente'])
    # Historical date within last 6 months
    days_ago = random.randint(0, 180)
    created_at = (datetime.now() - timedelta(days=days_ago)).isoformat()
    
    sql.append(f"INSERT INTO logos_polis.voters (name, phone, neighborhood, voter_score, influence_score, vote_probability, status, created_at) "
               f"VALUES ('{name}', '6199{random.randint(1111, 9999)}{random.randint(11, 99)}', '{neighborhood}', {voter_score}, {influence_score}, {vote_prob}, '{status}', '{created_at}');")

# 3. Campaigns
sql.append("\n-- Inserting Mock Campaigns")
for c_name in CAMPAIGNS:
    platform = random.choice(['WhatsApp', 'Facebook', 'Email'])
    spend = random.randint(100, 2000)
    conversions = random.randint(5, 50)
    cpa = round(spend / conversions if conversions > 0 else 0, 2)
    sql.append(f"INSERT INTO logos_polis.campaigns (name, platform, spend, cpa, conversions, status) "
               f"VALUES ('{c_name}', '{platform}', {spend}, {cpa}, {conversions}, 'Ativa');")

# 4. Campaign Engagements (Linking campaigns and voters)
sql.append("\n-- Inserting Campaign Engagements (Will use IDs in final SQL)")
# Since we don't have IDs yet, we might need a stored procedure or just IDs we know from insertion.
# But Supabase allows us to use subqueries.

sql.append("""
-- Link some voters to campaigns
INSERT INTO logos_polis.campaign_engagements (campaign_id, voter_id, responded, opened, clicked)
SELECT 
    (SELECT id FROM logos_polis.campaigns ORDER BY random() LIMIT 1),
    id,
    random() > 0.7,
    random() > 0.4,
    random() > 0.6
FROM logos_polis.voters
LIMIT 30;
""")

# 5. Interactions for CRM Evolution
sql.append("\n-- Inserting Mock Interactions")
sql.append("""
INSERT INTO logos_polis.interactions (voter_id, type, content, sentiment, priority, category)
SELECT 
    id,
    (ARRAY['vocal', 'whatsapp', 'presencial'])[floor(random() * 3 + 1)],
    'Feedback sobre as demandas do bairro',
    (ARRAY['positivo', 'negativo', 'neutro'])[floor(random() * 3 + 1)],
    (ARRAY['Alta', 'Media', 'Baixa'])[floor(random() * 3 + 1)],
    'Geral'
FROM logos_polis.voters
ORDER BY random()
LIMIT 20;
""")

with open("seed_data.sql", "w") as f:
    f.write("\n".join(sql))
