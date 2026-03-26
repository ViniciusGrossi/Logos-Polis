import requests
import time
import unicodedata
import os

# ==============================
# CONFIG
# ==============================

BAIRROS_POR_CIDADE = {
    "Valparaiso de Goias": [
        "Jardim Ceu Azul", "Valparaiso I", "Valparaiso II", "Parque Esplanada I", 
        "Parque Esplanada II", "Cidade Jardins", "Cruzeiro do Sul", "Parque Rio Branco",
        "Morada Nobre", "Pacaembu", "Chacaras Anhanguera", "Vila Guaira", "Jardim Oriente"
    ],
    "Novo Gama": [
        "Pedregal", "Lago Azul", "Lunabel", "Nucleo Habitacional Novo Gama", 
        "Residencial Brasilia", "Vila Uniao"
    ],
    "Cidade Ocidental": [
        "Jardim ABC", "Mansoes Suleste", "Ocidental Park", "Parque Araguari", 
        "Parque Napolis", "Parque Nova Friburgo", "Dom Bosco", "Centro"
    ],
    "Luziania": [
        "Jardim do Inga", "Parque Industrial Mingone", "Parque Estrela Dalva", 
        "Setor Central", "Parque Alvorada", "Jardim Zuleika", "Cidade Osfaya"
    ]
}

OUTPUT_SQL = "bairros.sql"

# ==============================
# HELPERS
# ==============================

def normalize(text):
    if not text:
        return None
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ASCII', 'ignore').decode('ASCII')
    return text.strip().title()


def get_coords(cidade, bairro):
    try:
        query = f"{bairro}, {cidade}, GO, Brazil"
        url = "https://nominatim.openstreetmap.org/search"

        params = {
            "q": query,
            "format": "json",
            "limit": 1
        }

        headers = {
            "User-Agent": "bairro-mapper-logos"
        }

        response = requests.get(url, params=params, headers=headers)
        data = response.json()

        if data:
            return data[0]["lat"], data[0]["lon"]

    except Exception as e:
        print(f"Erro ao buscar coords para {bairro}: {e}")
        pass

    return None, None

# ==============================
# PIPELINE
# ==============================

bairros_set = []

for cidade, bairros in BAIRROS_POR_CIDADE.items():
    print(f"\nProcessando cidade: {cidade}")

    for b_nome in bairros:
        bairro = normalize(b_nome)
        print(f"Buscando coords para: {bairro}...")
        lat, lon = get_coords(cidade, bairro)

        bairros_set.append({
            "cidade": cidade,
            "bairro": bairro,
            "lat": lat,
            "lon": lon
        })

        time.sleep(1.2)  # Respeitar limite do Nominatim (1 req/sec)

# ==============================
# GERAR SQL
# ==============================

with open(OUTPUT_SQL, "w", encoding="utf-8") as f:
    f.write("-- Tabela de bairros reais\n")
    f.write("CREATE TABLE IF NOT EXISTS logos_polis.bairros (\n")
    f.write("    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n")
    f.write("    cidade TEXT,\n")
    f.write("    bairro TEXT,\n")
    f.write("    latitude DECIMAL(10, 8),\n")
    f.write("    longitude DECIMAL(11, 8),\n")
    f.write("    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())\n")
    f.write(");\n\n")
    
    f.write("INSERT INTO logos_polis.bairros (cidade, bairro, latitude, longitude) VALUES\n")

    values = []
    for b in bairros_set:
        cidade = b["cidade"].replace("'", "''")
        bairro = b["bairro"].replace("'", "''")
        lat = b["lat"] or "NULL"
        lon = b["lon"] or "NULL"

        values.append(f"('{cidade}', '{bairro}', {lat}, {lon})")

    if values:
        f.write(",\n".join(values))
        f.write(" ON CONFLICT DO NOTHING;\n")
    else:
        print("Aviso: Nenhum bairro coletado.")

print(f"\nSQL gerado em: {OUTPUT_SQL}")

print(f"\nSQL gerado em: {OUTPUT_SQL}")
