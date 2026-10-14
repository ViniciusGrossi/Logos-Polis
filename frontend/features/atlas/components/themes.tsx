"use client";
import { useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ExternalLink, Search, BarChart3, Landmark } from "lucide-react";
import type { ThemesDataset } from "../types";
import { pct } from "../format";
export function Themes({ data }: { data: ThemesDataset }) {
  const [topic, setTopic] = useState(data.topics[0]?.id ?? "");
  const current = data.topics.find((t) => t.id === topic);
  const series = data.series.filter(
    (s) =>
      s.id === topic ||
      s.id.startsWith(`${topic}-`) ||
      s.name === current?.name,
  );
  return (
    <div className="atlas-themes">
      <div className="atlas-theme-topics">
        {data.topics.map((t) => (
          <button
            key={t.id}
            className={topic === t.id ? "active" : ""}
            aria-pressed={topic === t.id}
            onClick={() => setTopic(t.id)}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div className="atlas-theme-intro">
        <div>
          <h2>{current?.name ?? "Pautas em perspectiva"}</h2>
          <p>
            {current?.description ??
              "Interesse, preocupação declarada e condições observadas, com referências próprias."}
          </p>
        </div>
        <p className="atlas-theme-principle">
          Três evidências.
          <br />
          Três formas de interpretar.
        </p>
      </div>
      <div className="atlas-theme-columns">
        <section>
          <header>
            <Search size={19} />
            <h3>Interesse de busca</h3>
          </header>
          <p className="atlas-helper">
            O que é procurado no Google. Índice relativo de 0 a 100; não mede
            intenção de voto.
          </p>
          {series.length ? (
            series.map((s) => (
              <article key={`${s.id}-${s.geography}`}>
                <h4>
                  {s.name} · {s.geography}
                </h4>
                <div className="atlas-theme-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={s.values}>
                      <XAxis dataKey="date" hide />
                      <YAxis
                        domain={[0, 100]}
                        width={25}
                        tick={{ fontSize: 11 }}
                        stroke="var(--atlas-muted)"
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--atlas-panel)",
                          borderColor: "var(--atlas-border)",
                        }}
                      />
                      <Area
                        dataKey="value"
                        name="Interesse relativo"
                        type="monotone"
                        stroke="var(--atlas-cyan)"
                        fill="var(--atlas-cyan)"
                        fillOpacity={0.14}
                        connectNulls={false}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="atlas-helper">
                  {s.period} · {s.normalization}
                </p>
                <a href={s.sourceUrl} target="_blank" rel="noreferrer">
                  Ver origem <ExternalLink size={12} />
                </a>
              </article>
            ))
          ) : (
            <div className="atlas-theme-empty">
              <Search size={30} />
              <h4>Série ainda não importada</h4>
              <p>
                Esta pauta aguarda uma exportação documentada do Google Trends.
                O atlas não substitui buscas reais por números ilustrativos.
              </p>
              <a
                href="https://trends.google.com/trends/explore?geo=BR"
                target="_blank"
                rel="noreferrer"
              >
                Consultar Google Trends <ExternalLink size={12} />
              </a>
            </div>
          )}
        </section>
        <section>
          <header>
            <BarChart3 size={19} />
            <h3>Preocupação declarada</h3>
          </header>
          <p className="atlas-helper">
            O que pessoas responderam a uma pesquisa. Cada levantamento conserva
            sua pergunta e universo.
          </p>
          {data.surveys.map((survey) => (
            <article className="atlas-survey" key={survey.id}>
              <div className="atlas-source-chip">
                {survey.institution} · {survey.geography}
              </div>
              <h4>{survey.question}</h4>
              {survey.results.map((result) => (
                <div className="atlas-survey-row" key={result.topic}>
                  <span>{result.topic}</span>
                  <b>{pct(result.percentage)}</b>
                  <div>
                    <i
                      style={{ width: `${Math.min(100, result.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
              <p className="atlas-helper">
                {survey.collectedAt} · {survey.universe}
              </p>
              <details>
                <summary>Metodologia</summary>
                <p>{survey.methodology}</p>
              </details>
              <a href={survey.sourceUrl} target="_blank" rel="noreferrer">
                Consultar pesquisa <ExternalLink size={12} />
              </a>
            </article>
          ))}
          {!data.surveys.length && (
            <p className="atlas-notice">
              Não há pesquisa documentada nesta preparação.
            </p>
          )}
        </section>
        <section>
          <header>
            <Landmark size={19} />
            <h3>Condição observada</h3>
          </header>
          <p className="atlas-helper">
            Indicadores públicos descrevem o território; não são uma pesquisa de
            opinião.
          </p>
          <div className="atlas-theme-observed">
            <h4>Comece pelo contexto municipal</h4>
            <p>
              Explore renda, educação e densidade na aba Contexto, com
              cobertura, período e associação eleitoral explícitos.
            </p>
            <p>
              Saúde, emprego, segurança e ambiente serão incorporados com séries
              públicas reconciliadas.
            </p>
            <span className="atlas-source-chip">
              IBGE · indicadores territoriais
            </span>
          </div>
          <div className="atlas-theme-method">
            <h4>Como ler este painel</h4>
            <p>
              Uma pesquisa nacional não representa um município. Buscas não
              equivalem a apoio político. Séries normalizadas separadamente não
              podem ser comparadas pelo nível do índice.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
