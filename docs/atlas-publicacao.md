# Atlas Eleitoral: integração e publicação

## Escopo desta entrega

Página `/atlas` autenticada e item “Atlas Eleitoral” na sidebar Estratégia. Composição imersiva com MapLibre 6, leitura territorial, evolução, contexto, pautas, regiões, dossiê e apresentação. A câmera é independente do universo analítico. Geometrias municipais e métricas são carregadas por UF e eleição.

A release pública agregada está fixada em `atlas-v1-b730629dd655f9b4`, com manifesto SHA-256. A base bruta DuckDB, credenciais, referências privadas e o protótipo não fazem parte da publicação. Os dados locais de 2026 são provisórios, não certificados externamente.

O login RPC já presente no repositório é preservado. Página e seis APIs validam sessões assinadas e expiradas; cookies inválidos não bloqueiam reautenticação. A chave JWT de produção deve ter pelo menos 32 caracteres, configurada somente na Vercel. Chaves secretas da Vercel não podem ser recuperadas por `env pull`; campos vazios no arquivo local não demonstram ausência em produção.

## Verificação

`npm ci` em frontend prepara o worker MapLibre local. `npm run test:atlas` executa testes de navegação, segurança, cálculos, regiões, contratos e integridade. `npm run build` verifica compilação e tipos. `scripts/test-atlas-http.ts` testa página e APIs em servidor isolado com chave temporária, nunca com sessões reais.

O projeto Vercel existente é `logos-polis`, diretório raiz `frontend`. Não criar projeto paralelo nem enviar o vault da Logos. Os snapshots são incluídos no tracing das funções por `next.config.ts`.

## Limitações e próximas entregas

Esta publicação corresponde à etapa atual, não ao plano integral: novos cargos eleitorais, PIB per capita, mortalidade por agressões, pesquisas estaduais, buscas/notícias com cobertura geográfica e cruzamentos avançados ainda não foram entregues. Fontes ausentes não recebem números fictícios.

A instalação limpa relata cinco alertas de segurança em dependências de desenvolvimento do ESLint (cadeia de glob). Não aplicar atualização forçada que rebaixe o framework. Ensaio humano completo e benchmark no computador de apresentação continuam pendentes.
