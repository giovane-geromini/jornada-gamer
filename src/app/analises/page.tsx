"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { supabase } from "@/lib/supabase";
import type { UserGameProgress } from "@/types/game";

type StatusSummary = {
  label: string;
  count: number;
  percentage: number;
};

function normalizeStatus(status: string | null) {
  if (!status) return "Outros";

  const value = status.toLowerCase();

  if (["playing", "jogando"].includes(value)) return "Jogando";
  if (["completed", "zerado", "finished"].includes(value)) return "Zerados";
  if (value === "backlog") return "Backlog";
  if (["paused", "pausado"].includes(value)) return "Pausados";
  if (["dropped", "abandonado"].includes(value)) return "Abandonados";

  return "Outros";
}

export default function AnalisesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<UserGameProgress[]>([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadAnalyses() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/login");
          return;
        }

        const { data, error } = await supabase
          .from("v_user_game_progress")
          .select("*")
          .eq("user_id", session.user.id);

        if (error) {
          console.error("Erro ao carregar análises:", error);
          setLoadError("Não foi possível carregar os indicadores agora.");
          return;
        }

        setGames((data ?? []) as UserGameProgress[]);
      } catch (error) {
        console.error("Erro inesperado ao carregar análises:", error);
        setLoadError("Ocorreu um erro inesperado ao carregar os indicadores.");
      } finally {
        setLoading(false);
      }
    }

    loadAnalyses();
  }, [router]);

  const totalEarned = useMemo(
    () => games.reduce((total, game) => total + game.earned_trophies, 0),
    [games],
  );

  const totalTrophies = useMemo(
    () => games.reduce((total, game) => total + game.total_trophies, 0),
    [games],
  );

  const trophyPercentage = totalTrophies
    ? Math.round((totalEarned / totalTrophies) * 100)
    : 0;

  const averageProgress = games.length
    ? Math.round(
        games.reduce((total, game) => total + game.progress_percent, 0) /
          games.length,
      )
    : 0;

  const statusSummary = useMemo<StatusSummary[]>(() => {
    const counts = new Map<string, number>();

    for (const game of games) {
      const label = normalizeStatus(game.status);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([label, count]) => ({
        label,
        count,
        percentage: games.length ? Math.round((count / games.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [games]);

  const ranking = useMemo(
    () =>
      [...games]
        .sort((a, b) => {
          if (b.progress_percent !== a.progress_percent) {
            return b.progress_percent - a.progress_percent;
          }

          return b.earned_trophies - a.earned_trophies;
        })
        .slice(0, 5),
    [games],
  );

  if (loading) {
    return (
      <AppShell>
        <p className="py-16 text-center text-sm text-zinc-400">
          Calculando seus indicadores...
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopBar
        eyebrow="Análises"
        title="Sua jornada em números"
        subtitle="A primeira visão usa os dados que já existem no app. Filtros históricos e novos gráficos serão adicionados nas próximas etapas."
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        <span className="shrink-0 rounded-full border border-white bg-white px-4 py-2 text-sm font-medium text-black">
          Geral
        </span>
        {["Troféus", "Jogos", "Períodos"].map((item) => (
          <span
            key={item}
            className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-500"
          >
            {item} · em breve
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-zinc-900/75 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            Período analisado
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-200">
            Todo o histórico disponível
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300">
          ◷
        </div>
      </div>

      {loadError ? (
        <div className="rounded-[24px] border border-red-500/20 bg-red-950/25 p-5 text-sm text-red-200">
          {loadError}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Jogos", value: games.length, detail: "na biblioteca" },
          {
            label: "Troféus",
            value: totalEarned,
            detail: `${totalTrophies} disponíveis`,
          },
          {
            label: "Conclusão",
            value: `${trophyPercentage}%`,
            detail: "dos troféus",
          },
          {
            label: "Progresso médio",
            value: `${averageProgress}%`,
            detail: "por jogo",
          },
        ].map((metric) => (
          <article
            key={metric.label}
            className="min-w-0 rounded-[26px] border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 shadow-xl shadow-black/20 sm:p-5"
          >
            <p className="truncate text-xs text-zinc-500 sm:text-sm">
              {metric.label}
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {metric.value}
            </p>
            <p className="mt-1 truncate text-[11px] text-zinc-500 sm:text-xs">
              {metric.detail}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <article className="rounded-[30px] border border-white/10 bg-zinc-900/75 p-5 shadow-xl shadow-black/20 sm:p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Visão geral
            </p>
            <h2 className="mt-2 text-xl font-semibold">Progresso de troféus</h2>
          </div>

          <div className="mt-6 flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
            <div
              className="relative flex h-44 w-44 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(rgb(255 255 255) 0 ${trophyPercentage}%, rgb(39 39 42) ${trophyPercentage}% 100%)`,
              }}
            >
              <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-zinc-950 shadow-inner shadow-black/60">
                <span className="text-3xl font-bold">{trophyPercentage}%</span>
                <span className="mt-1 text-xs text-zinc-500">conquistado</span>
              </div>
            </div>

            <div className="w-full space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-sm text-zinc-500">Conquistados</p>
                <p className="mt-1 text-2xl font-semibold">{totalEarned}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-sm text-zinc-500">Pendentes</p>
                <p className="mt-1 text-2xl font-semibold">
                  {Math.max(totalTrophies - totalEarned, 0)}
                </p>
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-[30px] border border-white/10 bg-zinc-900/75 p-5 shadow-xl shadow-black/20 sm:p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Biblioteca
            </p>
            <h2 className="mt-2 text-xl font-semibold">Distribuição por status</h2>
          </div>

          <div className="mt-6 space-y-4">
            {statusSummary.length ? (
              statusSummary.map((status) => (
                <div key={status.label}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-zinc-300">{status.label}</span>
                    <span className="text-zinc-500">
                      {status.count} · {status.percentage}%
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-500"
                      style={{ width: `${status.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-zinc-500">
                Adicione jogos à biblioteca para visualizar esta distribuição.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="rounded-[30px] border border-white/10 bg-zinc-900/75 p-5 shadow-xl shadow-black/20 sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Ranking atual
            </p>
            <h2 className="mt-2 text-xl font-semibold">Jogos com maior progresso</h2>
          </div>
          <Link
            href="/biblioteca"
            className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            Ver biblioteca
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {ranking.length ? (
            ranking.map((game, index) => (
              <Link
                key={game.game_id}
                href={`/jogos/${game.game_id}`}
                className="group flex items-center gap-4 rounded-[22px] border border-white/10 bg-black/25 p-4 transition hover:border-white/20 hover:bg-white/5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-zinc-400">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-100">
                        {game.title}
                      </p>
                      <p className="mt-1 truncate text-xs text-zinc-500">
                        {game.platform_name ?? "Plataforma não informada"} · {game.earned_trophies}/{game.total_trophies} troféus
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-zinc-200">
                      {game.progress_percent}%
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-white"
                      style={{ width: `${game.progress_percent}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-zinc-500">
              Nenhum jogo disponível para montar o ranking.
            </p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
