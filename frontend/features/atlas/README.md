# Atlas Eleitoral — primeira entrega local

Rota: `/atlas`, integrada à navegação e sessão assinada do Polis. Não altera o protótipo de referência em `eleicoes-dados/prototipo/index.html`.

## Preparar e executar

### Demonstração individual sem depender do login

`npm run preview:atlas` abre `http://127.0.0.1:3802/atlas` com os mesmos componentes, regras analíticas e snapshots imutáveis da feature. A escuta é exclusivamente em loopback; não disponibilizar esse servidor na rede ou na hospedagem. Ele não oferece endpoints de conta nem acesso ao banco operacional. A página e APIs reais do Polis continuam autenticadas. Essa modalidade foi autorizada pelo usuário em 2026-10-12, adiando a configuração do login para depois da avaliação visual.

### Integração ao Polis

1. Instalar dependências com `npm install` em `frontend`. O pós-instalação prepara o worker cartográfico local.
2. Preparar com `npm run prepare:atlas`. Para congelar a preparação existente sem nova coleta: `../eleicoes-dados/.venv/Scripts/python.exe ../eleicoes-dados/pipeline/atlas_releases.py data/atlas`.
3. Configurar os segredos somente no servidor, em `.env.local` ignorado pelo Git ou no gerenciador de segredos da hospedagem:
   - `SUPABASE_SECRET_KEY`, ou a chave legada `SUPABASE_SERVICE_ROLE_KEY`: necessária para o login personalizado existente consultar `logos_polis.users`. Nunca utilizar prefixo `NEXT_PUBLIC_` para esse segredo, nem abrir políticas públicas de leitura de senhas/contas.
   - `JWT_SECRET`: segredo aleatório de pelo menos 32 caracteres; obrigatório em produção. Em desenvolvimento, sem configuração explícita, a chave efêmera dura apenas o processo.
   - `ATLAS_SNAPSHOT=atlas-v1-b730629dd655f9b4` opcional para fixar explicitamente uma preparação publicada.
4. Executar `npm run dev -- --hostname 127.0.0.1 --port 3000`, entrar com a conta do Polis e abrir `/atlas`.

Não criar contas novas para contornar configuração local; não desativar RLS. A instalação na Vercel e o servidor local não compartilham cookies.

## Versão e atualização

Os 61 JSON analíticos são publicados em `data/atlas/releases/{snapshotId}/`, com manifesto SHA-256. O servidor fixa um diretório no primeiro acesso; todas as respostas daquela instância usam essa versão. A publicação acontece por renomeação da pasta de preparação completa. Releases existentes nunca são sobrescritas.

Preparar uma nova versão e reiniciar o serviço promove a atualização. Durante a apresentação, usar `ATLAS_SNAPSHOT` e evitar preparação/deploy simultâneo. Geometria e métricas municipais continuam sob demanda por UF. A base bruta DuckDB não é transportada ao navegador.

## Verificar

- `npm run test:atlas`: contratos, serviço, associações, continuidade política, precisão, ausências, distribuição e isolamento da versão.
- `node --import tsx scripts/verify-atlas.ts`: reconciliação da preparação real.
- `node --import tsx scripts/test-atlas-http.ts`: sessões ausentes/forjadas/expiradas/incompletas, validação HTTP e sessão assinada válida em servidor de teste isolado. Não cria usuário nem altera Supabase.
- `npx tsc --noEmit` e `npm run build`.

## Limitações para o aceite final

- Google Trends recusou consultas com HTTP429. O importador CSV documentado está pronto; nenhuma série fictícia foi incluída. A área Pautas distingue ausência de busca, pesquisa DataSenado2024 e indicadores observados.
- Alfabetização de pessoas de 15 anos ou mais é o indicador educacional inicial, não ensino superior.
- Boa Esperança do Norte tem resultados preservados, sem polígono histórico/indicadores do Censo2022. Desmembramentos não foram harmonizados retrospectivamente.
- 2026 é preparação local provisória, sem certificação externa independente; apenas primeiro turno disponível.
- Login real local depende da configuração privada do servidor pelo responsável. A aprovação visual, o ensaio de dez minutos, o PDF final e as metas de 2,5s/300ms ainda requerem validação no ambiente de apresentação. Testes de serviço não são medições de desempenho do navegador.

As quatro áreas são Atlas, Evolução, Contexto e Pautas. Dossiê preserva todos os turnos, representação por UF, fontes, recorte de origem e exporta HTML autônomo com fontes incorporadas, além de impressão para PDF. Apresentação tem seis cenas; Esc encerra, setas navegam.

## Revisão de design e regiões — 12/10/2026

Aliases dos tokens do Polis: obsidian/charcoal/panel/concrete/acid; Inter/JetBrains Mono/Playfair Display. Selecionar estado mantém país/região e abre resumo; `Aprofundar` abre municípios. Hover/foco e seleção distintos, relevo decorativo e opção 2D. Símbolos e comparações planos. Fontes auto-hospedadas do Next em `public/fonts/polis`, com OFL, incorporadas no HTML.

IDs adicionais em `uf`: `NORTE`, `NORDESTE`, `CENTRO-OESTE`, `SUDESTE`, `SUL`; os mesmos IDs funcionam no dossiê. Catálogo deriva cinco territórios `level: region`, sem alterar a release. Somar votos e denominadores antes de calcular percentual; excluir exterior. Comparação/Spearman usam municípios do recorte, representação conservada por UF.

`tests/atlas-regions.test.ts` reconcilia todas as regiões/eleições/turnos/candidatos com Brasil menos exterior, verifica faltantes, denominadores, filtros, geometria e representação. Executar teste HTTP e build **sequencialmente**: processos Next geram referências locais de tipos e podem competir nesses artefatos, mesmo usando diretórios de build diferentes.
