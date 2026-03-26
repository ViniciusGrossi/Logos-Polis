# 🗺️ Mapeamento de Origem de Dados: Logos Polis

Este documento detalha exatamente quais tabelas e colunas do Supabase alimentam cada campo e aba do sistema **Logos Polis**.

---

## 🏗️ 1. Abas e Componentes

### 📊 Dashboard Executivo (Home)
| Campo / Card | Tabela (Supabase) | Coluna(s) | Lógica de Cálculo |
| :--- | :--- | :--- | :--- |
| **Força Política (Média)** | `voters` | `voter_score` | Média aritmética de todos os scores de afinidade. |
| **Base Ativa (>40pts)** | `voters` | `voter_score` | Contagem de eleitores onde `voter_score >= 40`. |
| **Gap Competitivo** | `dashboard_stats`* | `competitor_gap` | Diferença percentual entre o candidato e o principal rival (Mockado como dynamic). |
| **Eficácia de Campanhas**| `campaign_engagements` | `responded` | `(Respostas / Total de Disparos) * 100`. |
| **Principais Influenciadores**| `voters` | `name`, `influence_score` | Top 5 eleitores ordenados por `influence_score` DESC. |

---

### 💬 Mensagens & Atendimento
| Campo / Elemento | Tabela (Supabase) | Coluna(s) | Lógica de Cálculo |
| :--- | :--- | :--- | :--- |
| **Lista de Chats** | `interactions` | `content`, `created_at` | Ordenação cronológica (DESC). |
| **Nome do Eleitor** | `voters` | `name` | Join via `voter_id` na tabela `interactions`. |
| **Tag de Sentimento** | `interactions` | `sentiment` | Mapeado para badges (Positivo, Neutro, Negativo). |
| **Tag de Prioridade** | `interactions` | `priority` | Mapeado para cores (Crítica=Red, Alta=Orange, etc). |
| **Categoria (Tema)** | `interactions` | `category` | Agrupamento por (Saúde, Educação, etc). |

---

### 👥 Contatos (CRM Eleitoral)
| Campo / Elemento | Tabela (Supabase) | Coluna(s) | Lógica de Cálculo |
| :--- | :--- | :--- | :--- |
| **Lista de Contatos** | `voters` | `name`, `phone`, `neighborhood` | Filtros por nome e bairro. |
| **Afinidade (Score)** | `voters` | `voter_score` | Barra de progresso visual de 0 a 100. |
| **Status do Lead** | `voters` | `status` | (Ativo, Novo, Inativo). |
| **Probabilidade de Voto** | `voters` | `vote_probability` | Valor percentual calculado via IA/Modelo. |

---

### 🎯 Micro-campanhas
| Campo / Elemento | Tabela (Supabase) | Coluna(s) | Lógica de Cálculo |
| :--- | :--- | :--- | :--- |
| **Métricas Gerais (KPIs)** | `campaigns` | `spend`, `conversions` | `CPA = Total Spend / Total Conversions`. |
| **Engajamento Médio** | `campaign_engagements` | `opened`, `clicked` | `% de cliques comparado ao total de disparos`. |
| **Lista de Campanhas** | `campaigns` | `name`, `platform`, `status` | Filtros por plataforma e status. |

---

### 📍 Radar de Demandas
| Campo / Elemento | Tabela (Supabase) | Coluna(s) | Lógica de Cálculo |
| :--- | :--- | :--- | :--- |
| **Mapa de Demanda** | `demands` | `target_neighborhood` | Geocodificação (ou mockup de polígono) baseada no bairro. |
| **Status da Demanda** | `demands` | `status` | (Ativa, Pendente, Resolvida). |
| **Prioridade de Resolução** | `demands` | `priority` | Baseado no impacto e sentimento da interação original. |

---

### 👥 Equipe & Lideranças (Influenciadores)
| Campo / Elemento | Tabela (Supabase) | Coluna(s) | Lógica de Cálculo |
| :--- | :--- | :--- | :--- |
| **Total de Líderes** | `team_members` | Contagem (*) | Filtro para listar mobilizadores ativos. |
| **Meta de Conversão** | `team_members` | `target`, `converted` | Calculado como `(converted / target) * 100`. |
| **Ranking de Performance** | `team_members` | `conversion_rank` | Classificação (Ouro, Prata, Bronze) baseada na eficiência. |

---

## 🛠️ Detalhes do Schema (`logos_polis`)

Para conferir a estrutura completa via SQL, utilize:
```sql
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'logos_polis';
```
