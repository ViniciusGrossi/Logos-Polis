# 📊 Guia de Métricas e Scores — Logos Polis

Este documento detalha a lógica de cálculo, pesos e variáveis dos principais indicadores de inteligência política da plataforma.

---

## 1. Score do Eleitor (Voter Score)

O Score do Eleitor é uma métrica dinâmica (0 a 100) que mede a força do relacionamento de um cidadão com o mandato. Ele é recalculado automaticamente a cada 7 dias ou após qualquer nova interação.

### 📋 Fórmula de Cálculo
O score é composto por quatro pilares com pesos distintos:

| Pilar | Peso | Descrição |
| :--- | :--- | :--- |
| **Frequência** | 30% | Volume total de interações iniciadas pelo eleitor no período. |
| **Recência** | 25% | Tempo decorrido desde a última interação (penaliza inatividade). |
| **Sentimento/Tipo** | 25% | Peso baseado na categoria: Apoio (1.0) > Sugestão (0.8) > Pedido (0.6) > Reclamação (0.4). |
| **Engajamento** | 20% | Taxa de resposta do eleitor quando o gabinete entra em contato ativamente. |

### 🏷️ Classificações
- **70–100 (Apoiador Ativo):** Eleitor altamente engajado e defensor orgânico.
- **40–69 (Neutro):** Interage esporadicamente; alvo principal para nutrição de conteúdo.
- **10–39 (Distante):** Interações raras ou sentimento negativo persistente; necessita atenção.
- **0–9 (Inativo):** Sem interações recentes; entra automaticamente na fila de reativação IA.

---

## 2. Probabilidade de Voto (Vote Probability)

Embora o voto seja secreto, o Logos Polis utiliza modelos estatísticos para estimar a probabilidade de conversão baseada em comportamento digital.

### 🧪 Variáveis de Input
1. **Consistência do Score:** Manutenção de um Voter Score alto (>75) por mais de 90 dias.
2. **Polaridade de Sentimento:** Frequência de palavras de apoio e agradecimento em interações via WhatsApp.
3. **Alinhamento Temático:** Se as demandas resolvidas pelo gabinete coincidem com as preocupações prioritárias expressas pelo eleitor.
4. **Resonância das Micro-campanhas:** Taxa de leitura e clique em mensagens segmentadas enviadas ao eleitor.

**Lógica:** `Probabilidade = (Tendência do Score × 0.4) + (Consistência de Sentimento × 0.4) + (Engajamento em Campanhas × 0.2)`

---

## 3. Previsão de Demandas com IA (Radar de Demandas)

A "I.A. Predict" no mapa de demandas identifica tendências antes que elas se tornem crises generalizadas.

### 🔍 Identificação de "Buracos Eleitorais"
O sistema cruza três camadas para sinalizar áreas de oportunidade ou risco:
- **Densidade de Demandas:** Volume fora do normal em um bairro específico.
- **Taxa de Atendimento:** Histórico de quão rápido o gabinete resolve problemas naquela área.
- **Score Médio Territorial:** A "temperatura" política da vizinhança.

**Regra de Ouro:** Uma região com **Alta Densidade + Baixa Resposta + Score em Queda** é marcada como **Prioridade 1 (Vermelho Pulsante)** no mapa, sugerindo uma ação presencial ou micro-campanha informativa imediata.

---

## 4. Influence Score (Multiplicadores Locais)

Mede a capacidade de um eleitor influenciar seu círculo social ou bairro.

### 🧱 Pilares de Influência
- **Alcance Estimado (30%):** Tamanho da rede de contatos e frequência de compartilhamento (mensurado via links rastreáveis).
- **Engajamento Histórico (30%):** Qualidade e impacto das sugestões enviadas.
- **Centralidade (20%):** Se o eleitor é citado ou serve de ponte para outros contatos do mesmo bairro.
- **Atividade Recente (20%):** Frequência de participação em consultas e reuniões públicas.

---

## 5. Sentiment Analysis (LN)

As mensagens são processadas via LLM (IA) para extrair o tom emocional.

- **Positivo:** Mensagens de agradecimento, apoio ou elogio à gestão.
- **Neutro:** Solicitações técnicas de informação ou dúvidas simples.
- **Negativo:** Reclamações severas, críticas ou cobranças agressivas.

> [!TIP]
> O sentimento negativo não diminui necessariamente o score de influência, mas impacta diretamente a **Probabilidade de Voto** se não houver uma resposta resolutiva rápida do gabinete.

---

*Este documento é uma referência técnica para a inteligência de dados do Logos Polis. Os algoritmos são refinados continuamente conforme a base de dados cresce.*
