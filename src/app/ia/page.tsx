"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { supabase } from "@/lib/supabase";

const suggestions = [
  "O que eu estava jogando nesta data em outros anos?",
  "Qual foi o dia em que conquistei mais troféus?",
  "Em qual ano platinei mais jogos?",
  "Compare minha atividade de 2025 com 2026.",
];

const capabilities = [
  {
    icon: "◷",
    title: "Memórias por data",
    description:
      "Consultar jogos, troféus e eventos registrados em um dia específico ou nesta mesma data em outros anos.",
  },
  {
    icon: "⌁",
    title: "Comparações inteligentes",
    description:
      "Comparar anos, meses, plataformas, gêneros, franquias e jogos usando os filtros da sua própria base.",
  },
  {
    icon: "▥",
    title: "Resposta com visual",
    description:
      "Combinar texto, indicadores, listas e gráficos para explicar os resultados encontrados.",
  },
];

export default function IaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    async function validateSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      setLoading(false);
    }

    validateSession();
  }, [router]);

  if (loading) {
    return (
      <AppShell>
        <p className="py-16 text-center text-sm text-zinc-400">
          Preparando a Jornada IA...
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopBar
        eyebrow="Jornada IA"
        title="Converse com sua história gamer"
        subtitle="A futura assistente do app transformará perguntas em consultas seguras aos seus próprios dados."
      />

      <section className="relative overflow-hidden rounded-[34px] border border-violet-400/20 bg-gradient-to-br from-violet-950/45 via-zinc-950 to-cyan-950/30 p-5 shadow-2xl shadow-black/30 sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1.5 text-xs font-medium text-violet-100">
            <span className="h-2 w-2 rounded-full bg-violet-300" />
            Fundação da V0.6
          </div>

          <div className="mt-6 max-w-2xl rounded-[26px] border border-white/10 bg-black/25 p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Jornada IA
            </p>
            <p className="mt-3 text-base leading-7 text-zinc-200">
              Olá! Nesta primeira etapa, minha área já está pronta dentro do app.
              A conexão com o histórico, os filtros e o modelo de IA será ativada
              depois que estruturarmos a base histórica com segurança.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setPrompt(suggestion)}
                className="rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-left text-xs text-zinc-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-[26px] border border-white/10 bg-zinc-950/80 p-3 shadow-xl shadow-black/20">
            <label htmlFor="jornada-ia-prompt" className="sr-only">
              Pergunta para a Jornada IA
            </label>
            <div className="flex items-end gap-3">
              <textarea
                id="jornada-ia-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={2}
                placeholder="Pergunte algo sobre sua jornada..."
                className="min-h-[54px] flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-zinc-100 outline-none placeholder:text-zinc-600"
              />
              <button
                type="button"
                disabled
                title="A consulta será ativada em uma próxima etapa"
                className="flex h-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-zinc-500 disabled:cursor-not-allowed"
              >
                Enviar
              </button>
            </div>
            <p className="border-t border-white/5 px-2 pt-3 text-xs leading-5 text-zinc-500">
              Nenhuma pergunta é enviada nesta versão. Este campo é apenas a
              fundação visual do futuro chat.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Visão planejada
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            O que a assistente poderá fazer
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {capabilities.map((capability) => (
            <article
              key={capability.title}
              className="rounded-[28px] border border-white/10 bg-zinc-900/75 p-5 shadow-xl shadow-black/20"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl text-zinc-100">
                {capability.icon}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-zinc-100">
                {capability.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {capability.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
