"""Prepare public municipal aggregates only; raw SIM never leaves local cache."""
import argparse
import csv
import hashlib
import gzip
import io
import json
import math
import shutil
import zipfile
import urllib.request
import struct
import zlib
import itertools
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

from atlas_sources import CACHE, parse_sidra, source
from atlas_releases import freeze_existing

SIM_URL = 'https://s3.sa-east-1.amazonaws.com/ckan.saude.gov.br/SIM/csv/Mortalidade_Geral_2022_csv.zip'
GDP_BASE = 'https://servicodados.ibge.gov.br/api/v1/pesquisas/38/indicadores/47001/resultados/'
POP_URL = 'https://apisidra.ibge.gov.br/values/t/4714/n6/all/v/93/p/2022'


def retrieve(url, cache):
    if cache.exists():
        return cache.read_bytes()
    # This machine's inherited HTTP proxy closes official IBGE connections.
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    request = urllib.request.Request(url.replace('|', '%7C'), headers={'Accept-Encoding':'gzip','User-Agent':'LogosPolis-public-aggregate-preparation'})
    with opener.open(request, timeout=120) as response:
        body = response.read()
    if body[:2] == b'\x1f\x8b':
        body = gzip.decompress(body)
    cache.parent.mkdir(parents=True,exist_ok=True)
    cache.write_bytes(body)
    return body


def retrieve_json(url, cache):
    return json.loads(retrieve(url,cache).decode('utf-8-sig'))


def mortality_rate(count, population):
    return count * 100000 / population if population is not None and population > 0 else None


def aggregate_aggressions(rows, codes):
    counts = Counter()
    audit = dict(records=0, aggressions=0, unmatchedAggressions=0)
    for raw in rows:
        row = {key.upper(): value for key, value in raw.items()}
        audit['records'] += 1
        cause = str(row.get('CAUSABAS', '')).strip().upper()[:3]
        if str(row.get('TIPOBITO', '2')).strip() != '2':
            continue
        aggression = len(cause) == 3 and cause[1:].isdigit() and (
            cause[0] == 'X' and 85 <= int(cause[1:]) <= 99 or
            cause[0] == 'Y' and 0 <= int(cause[1:]) <= 9)
        if not aggression:
            continue
        audit['aggressions'] += 1
        code = str(row.get('CODMUNRES', '')).strip()[:6]
        if code in codes:
            counts[codes[code]] += 1
        else:
            audit['unmatchedAggressions'] += 1
    return dict(counts), audit


def parse_gdp(data, codes):
    if len(data) != 1 or data[0].get('id') != 47001:
        raise ValueError('Unexpected GDP indicator')
    output = {}
    for row in data[0]['res']:
        code = str(row['localidade'])[:6]
        if code not in codes:
            raise ValueError('GDP locality outside requested catalog')
        raw = row['res'].get('2022')
        value = float(raw) if raw not in {None, '', '-', '..'} else None
        if value is not None and (not math.isfinite(value) or value < 0):
            raise ValueError('Invalid GDP value')
        if codes[code] in output:
            raise ValueError('Duplicate GDP locality')
        output[codes[code]] = value
    return output


def sim_schema():
    url=SIM_URL.replace('2022','2021')
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with opener.open(urllib.request.Request(url,headers={'Range':'bytes=0-65535'}),timeout=30) as response:
        body=response.read(65536)
    name_length,extra_length=struct.unpack_from('<HH',body,26)
    prefix=zlib.decompressobj(-15).decompress(body[30+name_length+extra_length:],30000).decode('utf-8-sig')
    names=next(csv.reader([prefix.splitlines()[0]],delimiter=';'))
    if len(names)!=87 or names[0]!='ORIGEM' or names[1]!='TIPOBITO' or names[15]!='CODMUNRES' or names[45]!='CAUSABAS' or names[86]!='CONTADOR':
        raise ValueError('Official SIM schema changed; do not infer columns')
    return names


def sim_rows(stream, names):
    indices={name:names.index(name) for name in ['TIPOBITO','CODMUNRES','CAUSABAS','DTOBITO']}
    for row in csv.reader(stream,delimiter=';'):
        if len(row)!=len(names):
            raise ValueError('SIM row width incompatible with official schema')
        result={key:row[index] for key,index in indices.items()}
        if not result['DTOBITO'].endswith('2022') or result['TIPOBITO'] not in {'1','2'}:
            raise ValueError('SIM year or type outside validated schema')
        cause=result['CAUSABAS']
        if cause and not (len(cause) in {3,4} and cause[0].isalpha() and cause[1:].isdigit()):
            raise ValueError('SIM basic cause is not a valid ICD code')
        yield result


def prepare(output):
    catalog = json.loads((output / 'catalog.json').read_text(encoding='utf-8'))
    old_release = output / 'releases' / catalog['snapshotId']
    context = json.loads((old_release / 'context.json').read_text(encoding='utf-8'))
    municipal = [t for t in catalog['territories'] if t['level'] == 'municipality' and t['ibgeCode']]
    codes = {str(t['ibgeCode'])[:6]: t['id'] for t in municipal}
    if len(codes) != len(municipal):
        raise ValueError('Ambiguous municipal six-digit crosswalk')
    ids = [str(t['ibgeCode']) for t in municipal if str(t['ibgeCode']) != '5101837']
    batches = [ids[i:i+100] for i in range(0, len(ids), 100)]
    def batch(item):
        index, group = item
        url = GDP_BASE + '|'.join(group)
        raw = retrieve_json(url, CACHE / f'ibge-gdp-2022-{index:02d}.json')
        return parse_gdp(raw, codes)
    print('Preparando PIB per capita oficial IBGE 2022...', flush=True)
    gdp = {}
    with ThreadPoolExecutor(max_workers=4) as executor:
        for group in executor.map(batch, enumerate(batches)):
            gdp.update(group)
    population = parse_sidra(retrieve_json(POP_URL, CACHE / 'ibge-population-2022.json'))
    print(f'PIB: {sum(v is not None for v in gdp.values())} municípios. Obtendo SIM nacional...', flush=True)
    sim_path = CACHE / 'sim-mortalidade-2022.zip'
    retrieve(SIM_URL, sim_path)
    with zipfile.ZipFile(sim_path) as archive:
        names = [name for name in archive.namelist() if name.lower().endswith('.csv')]
        if len(names) != 1:
            raise ValueError('SIM archive must contain one national CSV')
        with archive.open(names[0]) as raw:
            stream = io.TextIOWrapper(raw, encoding='utf-8-sig', newline='')
            header = stream.readline()
            delimiter = ';' if header.count(';') > header.count(',') else ','
            names = next(csv.reader([header], delimiter=delimiter))
            required = {'CAUSABAS','CODMUNRES','TIPOBITO'}
            if not required.issubset({name.upper() for name in names}):
                names=sim_schema()
                counts,audit=aggregate_aggressions(sim_rows(itertools.chain([header],stream),names),codes)
            else:
                counts, audit = aggregate_aggressions(csv.DictReader(stream, fieldnames=names, delimiter=delimiter), codes)
    if audit['records'] < 1000000 or audit['aggressions'] < 10000:
        raise ValueError('Incomplete national SIM preparation')
    by_id = {t['id']: t for t in municipal}
    for row in context['values']:
        t = by_id.get(row['territoryId'])
        pop = population.get(t['ibgeCode']) if t else None
        row['gdp'] = gdp.get(row['territoryId'])
        row['homicide'] = mortality_rate(counts.get(row['territoryId'], 0), pop)
    gdp_method = 'PIB per capita oficial, série revisada IBGE pesquisa 38, indicador 47001, 2022. R$/habitante/ano a preços correntes; não é renda domiciliar. Código seis dígitos conciliado com IBGE sete dígitos por prefixo unívoco.'
    sim_method = 'SIM nacional 2022: óbitos não fetais, causa básica CID-10 X85–Y09 (agressões), por município de residência. Taxa bruta = óbitos/população residente Censo2022 ×100.000, sem ajuste por idade. Não inclui Y35 ou homicídios ocultos estimados. CSV2022 sem cabeçalho: esquema oficial CSV2021 com 87 colunas; primeira linha preservada, largura, ano, tipo e CID validados em todos os registros. Municípios pequenos têm taxas instáveis; ausência de população não é zero.'
    available_gdp = sum(row['gdp'] is not None for row in context['values'])
    available_sim = sum(row['homicide'] is not None for row in context['values'])
    context['indicators'] = [i for i in context['indicators'] if i['id'] not in {'gdp','homicide'}] + [
        dict(id='gdp', label='PIB per capita', unit='R$/hab./ano', period='2022', sourceId='ibge-gdp', status='partial' if available_gdp < len(context['values']) else 'available'),
        dict(id='homicide', label='Mortalidade por agressões', unit='óbitos/100 mil hab.', period='2022', sourceId='sim-aggressions', status='partial' if available_sim < len(context['values']) else 'available'),
    ]
    new_sources = [source('ibge-gdp','IBGE · PIB municipal per capita · série revisada',GDP_BASE+'3106200','2022',gdp_method,'partial'),
                   source('sim-aggressions','Ministério da Saúde · SIM · agressões por residência','https://dadosabertos.saude.gov.br/dataset/sim','2022',sim_method,'partial'),
                   source('ibge-population','IBGE · Censo · população residente',POP_URL,'2022','SIDRA4714 variável93, denominador municipal das taxas.','partial')]
    context['sources'] = [s for s in context['sources'] if s['id'] not in {s['id'] for s in new_sources}] + new_sources
    # Copy immutable published aggregates, then change only context and metadata.
    for relative in json.loads((old_release/'manifest.json').read_text(encoding='utf-8'))['files']:
        if relative != 'catalog.json':
            shutil.copyfile(old_release/relative, output/relative)
    (output/'context.json').write_text(json.dumps(context,ensure_ascii=False,separators=(',',':'),allow_nan=False),encoding='utf-8')
    digest = hashlib.sha256()
    for relative in sorted(json.loads((old_release/'manifest.json').read_text(encoding='utf-8'))['files']):
        if relative != 'catalog.json':
            digest.update(relative.encode())
            digest.update((output/relative).read_bytes())
    catalog['snapshotId'] = 'atlas-v1-'+digest.hexdigest()[:16]
    catalog['generatedAt'] = datetime.now(timezone.utc).isoformat()
    catalog['sources'] = [s for s in catalog['sources'] if s['id'] not in {s['id'] for s in new_sources}] + new_sources
    (output/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    freeze_existing(output)
    report = dict(snapshotId=catalog['snapshotId'],gdpCoverage=available_gdp,simCoverage=available_sim,municipalities=len(context['values']),**audit)
    print(json.dumps(report,ensure_ascii=False),flush=True)
    return report


if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('output',type=Path)
    prepare(parser.parse_args().output)
