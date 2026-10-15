# Atlas: cruzamentos territoriais sobre o mapa

Spec: plano completo autorizado pelo usuário; retomada explícita em 13/10/2026 após publicação da composição imersiva.

## Contrato da wave

- `ContextIndicator`: income, education, density, gdp, homicide. Campos novos opcionais/nullable para ler a release anterior.
- PIB per capita oficial IBGE pesquisa38/indicador47001, série revisada2022, R$/habitante/ano. SIM2022: óbitos não fetais com causa básica X85–Y09 por município de residência, divididos pela população residente Censo2022 ×100.000. Excluir Y35; não chamar de violência geral ou estimativa de homicídios ocultos.
- Guardar somente agregados no snapshot. CSV SIM bruto fica no cache local privado/ignorado; nenhum registro individual nas APIs. Contabilizar códigos não localizados.
- Contexto aceita candidato PT ou PL (PSL em2018 via identidade histórica existente); porcentagem ou variação. Nenhuma inferência de intenção individual ou causalidade.
- Mapas: indicador contextual ou bivariado3×3. Tercis calculados sobre pares municipais válidos do recorte, iguais em ambos os eixos; mesmos valores recebem mesma classe. Zero legítimo preservado, ausente neutro. Estados mostram mediana municipal identificada, nunca média de taxas apresentada como taxa estadual. Zoommunicipal revela valores próprios; câmera não altera amostra.
- Selecionar célula da legenda destaca municípios, agrega votos/denominadores e mostra contribuição por candidatura, sem média dos percentuais. Candidaturas nominais e períodos exibidos.
- Spearman existente com n>=30 e sensibilidade eleitoral. Dispersão e grupos conectados ao mapa. Fontes e cobertura no painel; explicitar instabilidade de taxas em municípios pequenos.
- Nova release imutável; manter a anterior. Sem deploy automático desta wave.

## Tarefas

1. Testes RED→GREEN de importação SIM e PIB; obter fontes públicas, publicar agregados em nova preparação, relatório de cobertura.
2. Contratos e serviços: candidatos/indicadores, bivariado e grupos agregados tipados; testes RED→GREEN.
3. MapLibre recebe métrica contextual e classes; controles/legenda/painel no Contexto, URL e fonte; testes e browser.
4. Suíte, tipos, lint, build, revisão independente e atualização do estado; continuar waves de cargos e pautas salvo gate humano.

## Ledger

- Início: repositório próprio isolado, branch feat/atlas-cruzamentos-territoriais a partir de produção6e1eb86. User changes no vault não são capturadas.
- Ruling: sequência prioriza as camadas/compare sobre o mapa solicitadas agora; cargos continuam próximos. Custo: seletores de cargos ainda não expandem nesta wave.
- Ruling: implementação inline, review independente no fim; evita múltiplos workers editando contrato/mapa compartilhado. Não publicar nem alterar auth. Custo se errado: menor paralelismo e revisão independente concentrada no fim.
- Preflight: importação→ContextValue→service points→classificação→map/legenda; códigos SIM/IBGE6 dígitos conciliados ao catálogo7 dígitos por prefixo unívoco; valores novos opcionais mantêm release anterior legível.

## Retomada e evidências — 15/10/2026

- Preparação local imutável: `atlas-v1-845ce0fdfb43a137`, anterior preservada. PIB e SIM com 5.570 valores municipais; ausência do município criado após a edição territorial de 2022 permanece explícita.
- Auditoria da preparação SIM: 1.544.266 registros processados, 44.367 óbitos não fetais por agressões, 43.806 vinculados ao catálogo e 561 sem correspondência municipal. Os não vinculados não foram distribuídos artificialmente. Somente agregados publicados na preparação; nenhum registro individual no frontend.
- Revisão independente concluída: nenhum crítico, dois importantes, dois menores. Importantes acolhidos: variação de grupo deve comparar participações agregadas nos dois períodos; limpar ou redesenhar seleção deve remover a célula persistida na URL.
- Final: fixed variação agregada — regressão observada RED (0 em lugar de −64 p.p.) → GREEN; transportados numeradores e denominadores dos dois períodos. Suíte fresca em 15/10: 41/41.
- Final: fixed seleção persistida — limpeza e seleção da dispersão removem a célula da URL. RED→GREEN observado no navegador: compilação em memória sem o reset mantém `cell`; compilação do código atual remove `cell`, sem erros na página. Teste persistido em `frontend/scripts/test-atlas-selection.mjs`, sem editar código de produção durante o teste ou iniciar outro servidor.
- Navegador fresco: 6/6 cenários, sem `pageerror`; valores reais de PIB, legenda 3×3, grupo, câmera preservada, troca PT/PL e SIM, região, 768 e 375 px. Capturas em `outputs/atlas-*.png` no workspace da conversa.
- Verificação fresca de 15/10: 41/41 testes Atlas, 21/21 testes Python, 80 asserções HTTP (seis APIs autenticadas), `tsc --noEmit` e build Next com saída 0. Lint identificou callback antes do setter; movido após a declaração e nova execução passou sem erros. Onze cenários de navegação imersiva também passaram, sem erros na página.
- Código sincronizado seletivamente com a pasta original do Polis após confirmar igualdade dos seis arquivos existentes com a base publicada. Nenhum arquivo de login, segredo ou mudança local não relacionada copiado.
- Tentativa de iniciar prévia isolada rejeitada pela política; callback restaurado no `finally`. Nenhum novo processo de servidor criado. A regressão foi depois reproduzida com mutação exclusivamente em memória, na prévia já existente. Teste portátil persistido executado: RED retém célula / GREEN remove célula, zero erros na página.
- Fontes Python de preparação e três testes incluídos no repositório isolado para reprodução; cache bruto explicitamente ignorado. Testes dos arquivos copiados: 3/3. Na pasta original, suíte Atlas completa após sincronização: 41/41. Build final após ajuste do callback: saída 0.
- Final: minor (deferred): legenda bivariada ainda não apresenta os limites numéricos do eixo eleitoral; classes e contagens estão disponíveis.
- Final: minor (deferred): cache de lotes PIB usa índice de lote; vincular cache a hash da URL/lista municipal antes de mudar a composição do catálogo.
- Final: Ruling: revisão não certificou remotamente o esquema posicional SIM2022 — manter metodologia de recuperação explícita e tratar como preparação auditada localmente, não reconciliação independente com totais oficiais — custo se errado: retirar a camada de conclusões e regenerar após validação oficial.
- Final: Ruling: o revisor não reexecutou build/navegador — autor reexecutou suíte, tipos, lint, build, HTTP e navegação real após as correções, todos aprovados — custo se errado: um problema específico de outro ambiente ainda exige reprodução independente.
- Final: Ruling: não publicar automaticamente esta wave — aprovação de deploy anterior referia-se à composição já publicada; preservar produção enquanto a nova preparação é validada — custo: novas análises continuam locais até publicação autorizada.

Próxima etapa após estes gates: preparar cargos e candidaturas por circunscrição, mantendo votos nominais, legenda e cadeiras separados; depois integrar preocupações, buscas e notícias somente onde houver cobertura documentada. O plano completo não está concluído.

### Preflight dos próximos cargos

Consulta DuckDB somente leitura confirmou cobertura 2018/2022: presidente, governador, senador, deputado federal, estadual e distrital. Governo tem segundo turno apenas em 14 UFs em 2018 e 12 em 2022; distrital somente DF, estadual nas outras 26 UFs. Candidaturas dos dois turnos estão presentes.

`votos` e `votos_validos` não são intercambiáveis. Em 2022, por exemplo, o Senado tem 100.128.660 votos nominais brutos e 99.594.050 nominais válidos. Não publicar os brutos como participação nos válidos. Para proporcionais, somar legenda válida separadamente, sem atribuí-la a pessoas.

Reconciliação pendente localizada: deputado federal2018, AM: partidos totalizam 1.770.246 válidos; detalhe de votação, 1.763.198. Diferença de 7.048, que explica toda a divergência nacional desse cargo/ano entre essas duas tabelas. Não corrigida silenciosamente nem promovida a resultado certificado. Senado2018 exige denominador de escolhas válidas (duas vagas), nunca percentual de eleitores por simples divisão desse total.

## Reproduzir a preparação e a verificação

- Abrir a [comparação de PIB × voto](http://127.0.0.1:3802/atlas?tab=contexto&uf=BR&year=2022&round=2&context=gdp&candidate=PT&contextView=bivariate) ou [mortalidade por agressões × voto](http://127.0.0.1:3802/atlas?tab=contexto&uf=BR&year=2022&round=2&context=homicide&candidate=PT&contextView=bivariate). Prévia exclusivamente local; esta wave não foi publicada na Vercel.
- Preparação: Python em `eleicoes-dados/pipeline/atlas_context_layers.py`, argumento de saída `frontend/data/atlas`, a partir da preparação existente. Dependências desta ampliação são da biblioteca padrão; cache público de origem fica em `eleicoes-dados/pipeline/atlas_imports`, ignorado pelo Git. Não enviar esse cache a Vercel ou navegador.
- Testes: `python -m unittest test_atlas_context_layers -q` na pasta de preparação; `npm run test:atlas` no frontend; `node scripts/test-atlas-http.ts` deve ser executado via `tsx`, conforme o projeto.
- Regressão de seleção: prévia local existente em3802, `node scripts/test-atlas-selection.mjs`. Playwright precisa estar instalado no ambiente de testes; `ATLAS_PLAYWRIGHT_PATH` pode indicar o pacote já disponível. `ATLAS_QA_BASE` permite outra prévia explicitamente escolhida. Não usa login real, não modifica arquivos da aplicação e não publica nada.
- Limites do aceite: ensaio humano de dez minutos, latência repetida no computador da apresentação, reconciliação externa SIM e cargos completos ainda não certificados. Os dois menores deferidos acima não foram corrigidos nesta passagem.
