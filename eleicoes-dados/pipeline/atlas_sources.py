"""Importadores oficiais com timeout, provenance e ausências explícitas."""
import csv
import gzip
import json
import math
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'pipeline' / 'atlas_imports'


def fetch(url: str, cache: Path | None = None) -> bytes:
    if cache and cache.exists():
        return cache.read_bytes()
    request = urllib.request.Request(url, headers={'User-Agent': 'LogosPolis-Atlas/1.0 public-data-preparation',
                                                   'Accept-Encoding': 'gzip'})
    with urllib.request.urlopen(request, timeout=45) as response:
        data = response.read()
    if data[:2] == b'\x1f\x8b':
        data = gzip.decompress(data)
    if cache:
        cache.parent.mkdir(parents=True, exist_ok=True)
        cache.write_bytes(data)
    return data


def fetch_json(url: str, cache: Path | None = None):
    return json.loads(fetch(url, cache).decode('utf-8-sig'))


def parse_number(value):
    if value is None or str(value).strip() in {'', '-', '..', '...', 'X', 'x'}:
        return None
    number = float(str(value).replace(',', '.'))
    if not math.isfinite(number):
        raise ValueError('Valor não finito na fonte')
    return number


def parse_sidra(rows):
    result = {}
    for row in rows:
        code = str(row.get('D1C', ''))
        if code.isdigit() and len(code) == 7:
            if int(code) in result:
                raise ValueError('Mais de uma observação por município: rever classificação SIDRA')
            result[int(code)] = parse_number(row['V'])
    if not result:
        raise ValueError('Resposta SIDRA sem municípios')
    return result


def source(identifier, title, url, period, methodology, status='available'):
    return dict(id=identifier, title=title, url=url, period=period,
                collectedAt=datetime.now(timezone.utc).isoformat(), methodology=methodology, status=status)


def import_context(territories):
    configurations = [
        ('income', 'Renda domiciliar per capita', 'R$/mês', 10295, 13431,
         '/c2/6794/c86/95251/c58/95253', 'Rendimento nominal médio mensal domiciliar per capita; Censo 2022, tabela 10295, variável 13431; totais de sexo, cor e idade.'),
        ('education', 'Alfabetização · pessoas de 15 anos ou mais', '%', 9543, 2513,
         '/c2/6794/c86/95251/c287/100362', 'Taxa de alfabetização das pessoas de 15 anos ou mais; Censo 2022, tabela 9543, variável 2513; totais de sexo, cor e idade.'),
        ('density', 'Densidade demográfica', 'hab./km²', 4714, 614, '',
         'Densidade demográfica municipal; Censo 2022, tabela 4714, variável 614.'),
    ]
    values = {t['id']: dict(territoryId=t['id'], income=None, education=None, density=None)
              for t in territories if t['level'] == 'municipality'}
    indicators, sources = [], []
    for identifier, label, unit, table, variable, classifiers, methodology in configurations:
        url = f'https://apisidra.ibge.gov.br/values/t/{table}/n6/all/v/{variable}/p/2022{classifiers}'
        try:
            data = parse_sidra(fetch_json(url, CACHE / f'ibge-{identifier}-2022.json'))
            for t in territories:
                if t['id'] in values:
                    values[t['id']][identifier] = data.get(t['ibgeCode'])
            available = sum(v[identifier] is not None for v in values.values())
            status = 'available' if available == len(values) else ('partial' if available else 'unavailable')
            print(f'IBGE {identifier}: {available}/{len(values)} valores reais')
        except Exception as exc:
            status = 'unavailable'
            methodology += f' Importação indisponível: {type(exc).__name__}. Reexecute o preparador.'
            print(f'IBGE {identifier}: indisponível ({type(exc).__name__}: {exc})')
        sources.append(source(f'ibge-{identifier}', f'IBGE · Censo 2022 · {label}', url, '2022', methodology, status))
        indicators.append(dict(id=identifier, label=label, unit=unit, period='2022',
                               sourceId=f'ibge-{identifier}', status=status))
    return dict(values=list(values.values()), indicators=indicators, sources=sources)


def read_trends(path: Path):
    metadata = path.with_suffix('.meta.json')
    if not metadata.exists():
        raise ValueError(f'Provenance obrigatória: {metadata.name}')
    meta = json.loads(metadata.read_text(encoding='utf-8'))
    required = {'id', 'name', 'geography', 'period', 'collectedAt', 'sourceUrl', 'normalization'}
    if not required.issubset(meta) or any(not isinstance(meta[k], str) or not meta[k].strip() for k in required):
        raise ValueError('Provenance incompleta ou inválida')
    if not meta['sourceUrl'].startswith('https://trends.google.'):
        raise ValueError('Origem Trends inválida')
    if meta['geography'] != 'BR' and not meta['geography'].startswith('BR-'):
        raise ValueError('Geografia Trends precisa ser BR ou BR-UF')
    lines = path.read_text(encoding='utf-8-sig').splitlines()
    start = next((i for i, line in enumerate(lines) if line.startswith(('Semana,', 'Week,', 'Mês,', 'Month,', 'Dia,', 'Day,', 'date,'))), None)
    if start is None:
        raise ValueError('Cabeçalho temporal não encontrado no CSV Trends')
    observations = []
    for row in list(csv.reader(lines[start:]))[1:]:
        if len(row) < 2 or not row[0].strip():
            continue
        # <1 é intervalo censurado, não número pontual zero ou 0,5.
        value = None if row[1].strip() == '<1' else parse_number(row[1])
        if value is not None and not 0 <= value <= 100:
            raise ValueError('Índice Trends fora de 0–100')
        # First-of-month anchors label monthly observations, not daily values.
        date = datetime.fromisoformat(row[0] + '-01' if len(row[0]) == 7 else row[0]).date().isoformat()
        observations.append(dict(date=date, value=value))
    if not observations:
        raise ValueError('CSV Trends vazio')
    return {k: meta[k] for k in required} | {'values': observations}


def import_themes():
    topics = [dict(id=i, name=n, description=d) for i, n, d in [
        ('security', 'Segurança pública', 'Violência, proteção e condições observadas.'),
        ('health', 'Saúde', 'Acesso, atendimento e preocupação declarada.'),
        ('employment', 'Emprego e renda', 'Trabalho, rendimento e estabilidade econômica.'),
        ('cost', 'Custo de vida', 'Preços e poder de compra.'),
        ('education', 'Educação', 'Escolaridade, aprendizagem e acesso.'),
        ('corruption', 'Corrupção', 'Percepção pública e integridade institucional.')]]
    url = 'https://www.senado.leg.br/institucional/datasenado/relatorio_online/pesquisa_principais_preocupacoes/interativo.html'
    surveys = []
    methodology = ('Panorama Político 2024; coleta de 5 a 28 de junho de 2024, amostra probabilística, '
                   'entrevistas telefônicas; uma principal preocupação por entrevistado. Percentuais publicados arredondados; '
                   'categorias exibidas não precisam somar 100. Pesquisa nacional não atribuída aos municípios.')
    try:
        body = fetch(url, CACHE / 'datasenado-preocupacoes-2024.html').decode('utf-8', errors='replace')
        if '29%' not in body or '16%' not in body or 'principal preocupação' not in body:
            raise ValueError('A publicação mudou; confirmar percentuais antes de importar')
        surveys.append(dict(id='datasenado-2024', institution='Instituto de Pesquisa DataSenado',
            title='Panorama Político 2024 · principais preocupações',
            question='Qual é a sua maior preocupação hoje?', universe='População brasileira de 16 anos ou mais',
            geography='Brasil', collectedAt='2024-06-05 a 2024-06-28', sourceUrl=url, methodology=methodology,
            results=[dict(topic=t, percentage=v) for t,v in [('Saúde',29), ('Custo de vida',16), ('Corrupção',16),
                                                            ('Segurança pública',15), ('Educação',10), ('Emprego',10)]]))
        survey_source = source('datasenado-2024', 'DataSenado · Panorama Político 2024', url, '2024-06-05 a 2024-06-28', methodology)
    except Exception as exc:
        survey_source = source('datasenado-2024', 'DataSenado · Panorama Político 2024', url, '2024',
                               f'Importação pendente: {type(exc).__name__}.', 'unavailable')
    trend_files = sorted((CACHE / 'trends').glob('*.csv'))
    series = [read_trends(path) for path in trend_files]
    trend_source = source('google-trends', 'Google Trends · interesse relativo de busca',
        'https://support.google.com/trends/answer/4365533?hl=pt-BR', 'Período definido por exportação',
        'Séries CSV com provenance individual. Escala própria 0–100; não comparar níveis entre exportações separadas. '
        'Nenhum CSV validado disponível.' if not series else 'Séries CSV documentadas; índices 0–100 normalizados dentro da exportação, sem inferir intenção de voto.',
        'available' if series else 'unavailable')
    return dict(topics=topics, series=series, surveys=surveys, sources=[survey_source, trend_source])
