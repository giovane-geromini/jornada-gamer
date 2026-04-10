"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { UserGameProgress } from "@/types/game";

type TrophyListRow = {
  id: string;
};

type TrophyRow = {
  id: string;
  trophy_list_id?: string | null;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  trophy_type?: string | null;
  type?: string | null;
  sort_order?: number | null;
  order_index?: number | null;
};

type UserTrophyRow = {
  trophy_id: string;
  earned_at: string | null;
};

type TrophyWithUserState = {
  id: string;
  title: string;
  description: string | null;
  trophy_type: string | null;
  sort_order: number | null;
  earned: boolean;
  earned_at: string | null;
};

type TimelineItem = {
  id: string;
  type: "status" | "trophy";
  title: string;
  description: string;
  date: string | null;
  sortValue: number;
};

function getStatusLabel(status: string | null) {
  if (!status) return "Sem status";

  const map: Record<string, string> = {
    playing: "Jogando",
    backlog: "Backlog",
    finished: "Finalizado",
    dropped: "Abandonado",
    paused: "Pausado",
    completed: "100%",
    zerado: "Zerado",
    jogando: "Jogando",
  };

  return map[status.toLowerCase()] ?? status;
}

function getTrophyTypeLabel(type: string | null) {
  if (!type) return "Troféu";

  const map: Record<string, string> = {
    bronze: "Bronze",
    silver: "Prata",
    gold: "Ouro",
    platinum: "Platina",
  };

  return map[type.toLowerCase()] ?? type;
}

function getTrophyTypeEmoji(type: string | null) {
  if (!type) return "🏆";

  const map: Record<string, string> = {
    bronze: "🥉",
    silver: "🥈",
    gold: "🥇",
    platinum: "🏆",
  };

  return map[type.toLowerCase()] ?? "🏆";
}

function formatDateTime(value: string | null) {
  if (!value) return "Data não informada";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data inválida";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function normalizeTrophy(row: TrophyRow): TrophyWithUserState {
  return {
    id: row.id,
    title: row.title ?? row.name ?? "Troféu sem nome",
    description: row.description ?? null,
    trophy_type: row.trophy_type ?? row.type ?? null,
    sort_order: row.sort_order ?? row.order_index ?? null,
    earned: false,
    earned_at: null,
  };
}

function buildTimeline(
  game: UserGameProgress,
  trophies: TrophyWithUserState[],
): TimelineItem[] {
  const items: TimelineItem[] = [];

  if (game.status) {
    items.push({
      id: `status-${game.game_id}`,
      type: "status",
      title: "Status atual do jogo",
      description: `Status definido como ${getStatusLabel(game.status)}.`,
      date: null,
      sortValue: -1,
    });
  }

  const earnedTrophies = trophies.filter((trophy) => trophy.earned);

  for (const trophy of earnedTrophies) {
    const parsedDate = trophy.earned_at ? new Date(trophy.earned_at).getTime() : 0;

    items.push({
      id: `trophy-${trophy.id}`,
      type: "trophy",
      title: `Troféu conquistado: ${trophy.title}`,
      description: `${getTrophyTypeEmoji(trophy.trophy_type)} ${getTrophyTypeLabel(
        trophy.trophy_type,
      )}`,
      date: trophy.earned_at,
      sortValue: Number.isNaN(parsedDate) ? 0 : parsedDate,
    });
  }

  return items.sort((a, b) => b.sortValue - a.sortValue);
}

export default function GameDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const gameId = params?.id;

  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [game, setGame] = useState<UserGameProgress | null>(null);
  const [trophies, setTrophies] = useState<TrophyWithUserState[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      if (!gameId) {
        if (mounted) {
          setLoading(false);
          setNotFoundState(true);
        }
        return;
      }

      setLoading(true);
      setErrorMessage("");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        if (mounted) {
          setErrorMessage("Não foi possível validar sua sessão.");
          setLoading(false);
        }
        return;
      }

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      const currentUserId = session.user.id;

      const { data: gameData, error: gameError } = await supabase
        .from("v_user_game_progress")
        .select("*")
        .eq("user_id", currentUserId)
        .eq("game_id", gameId)
        .single();

      if (gameError || !gameData) {
        console.error("Erro ao buscar detalhe do jogo:", {
          message: gameError?.message,
          details: gameError?.details,
          hint: gameError?.hint,
          code: gameError?.code,
        });

        if (mounted) {
          setGame(null);
          setTrophies([]);
          setLoading(false);
          setNotFoundState(true);
        }
        return;
      }

      const resolvedGame = gameData as UserGameProgress;

      const { data: trophyListData, error: trophyListError } = await supabase
        .from("trophy_lists")
        .select("id")
        .eq("game_id", gameId);

      if (trophyListError) {
        console.error("Erro ao buscar trophy_lists:", {
          message: trophyListError.message,
          details: trophyListError.details,
          hint: trophyListError.hint,
          code: trophyListError.code,
        });

        if (mounted) {
          setGame(resolvedGame);
          setTrophies([]);
          setLoading(false);
          setErrorMessage("Não foi possível carregar a lista de troféus.");
        }
        return;
      }

      const trophyListIds = ((trophyListData ?? []) as TrophyListRow[])
        .map((item) => item.id)
        .filter(Boolean);

      let resolvedTrophies: TrophyWithUserState[] = [];

      if (trophyListIds.length > 0) {
        const { data: trophiesData, error: trophiesError } = await supabase
          .from("trophies")
          .select("*")
          .in("trophy_list_id", trophyListIds);

        if (trophiesError) {
          console.error("Erro ao buscar troféus:", {
            message: trophiesError.message,
            details: trophiesError.details,
            hint: trophiesError.hint,
            code: trophiesError.code,
          });

          if (mounted) {
            setGame(resolvedGame);
            setTrophies([]);
            setLoading(false);
            setErrorMessage("Não foi possível carregar os troféus.");
          }
          return;
        }

        const rawTrophies = ((trophiesData ?? []) as TrophyRow[])
          .map(normalizeTrophy)
          .sort((a, b) => {
            const aOrder = a.sort_order ?? 999999;
            const bOrder = b.sort_order ?? 999999;
            return aOrder - bOrder;
          });

        if (rawTrophies.length > 0) {
          const trophyIds = rawTrophies.map((trophy) => trophy.id);

          const { data: userTrophiesData, error: userTrophiesError } = await supabase
            .from("user_trophies")
            .select("trophy_id, earned_at")
            .eq("user_id", currentUserId)
            .in("trophy_id", trophyIds);

          if (userTrophiesError) {
            console.error("Erro ao buscar troféus do usuário:", {
              message: userTrophiesError.message,
              details: userTrophiesError.details,
              hint: userTrophiesError.hint,
              code: userTrophiesError.code,
            });

            resolvedTrophies = rawTrophies;
          } else {
            const userTrophies = (userTrophiesData ?? []) as UserTrophyRow[];
            const earnedMap = new Map<string, string | null>();

            for (const item of userTrophies) {
              earnedMap.set(item.trophy_id, item.earned_at);
            }

            resolvedTrophies = rawTrophies.map((trophy) => ({
              ...trophy,
              earned: earnedMap.has(trophy.id),
              earned_at: earnedMap.get(trophy.id) ?? null,
            }));
          }
        }
      }

      if (mounted) {
        setGame(resolvedGame);
        setTrophies(resolvedTrophies);
        setLoading(false);
      }
    }

    loadPage();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace("/login");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [gameId, router]);

  const timeline = useMemo(() => {
    if (!game) return [];
    return buildTimeline(game, trophies);
  }, [game, trophies]);

  if (notFoundState) {
    notFound();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <section className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-6 py-10">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 px-6 py-5 text-sm text-zinc-300 shadow-lg shadow-black/20">
            Carregando detalhes do jogo...
          </div>
        </section>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <section className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-10">
          <div className="rounded-3xl border border-red-900/40 bg-red-950/30 px-6 py-5 text-sm text-red-200">
            Não foi possível carregar este jogo.
          </div>
        </section>
      </main>
    );
  }

  const earnedCount = trophies.filter((trophy) => trophy.earned).length;
  const pendingCount = trophies.length - earnedCount;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
          >
            ← Voltar ao início
          </Link>
        </div>

        {errorMessage && (
          <div className="rounded-2xl border border-amber-900/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-lg shadow-black/20">
            <div className="relative mx-auto aspect-[2/3] w-full max-w-[300px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
              {game.cover_url ? (
                <Image
                  src={game.cover_url}
                  alt={game.title}
                  fill
                  className="object-contain"
                  unoptimized
                  loading="eager"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-500">
                  Sem capa
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                Jornada Gamer
              </p>

              <h1 className="text-4xl font-bold tracking-tight">{game.title}</h1>

              <p className="text-zinc-400">
                {game.platform_name ?? "Plataforma não informada"}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200">
                {getStatusLabel(game.status)}
              </span>

              <span className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200">
                {game.progress_percent}% concluído
              </span>

              <span className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200">
                {game.earned_trophies} / {game.total_trophies} troféus
              </span>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg shadow-black/20">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Progresso de troféus</span>
                  <span className="font-medium text-zinc-100">
                    {game.earned_trophies} / {game.total_trophies}
                  </span>
                </div>

                <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-zinc-200 transition-all"
                    style={{ width: `${game.progress_percent}%` }}
                  />
                </div>

                <p className="text-sm text-zinc-400">
                  Você já conquistou {game.earned_trophies} de {game.total_trophies} troféus neste jogo.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Status</p>
                <p className="mt-2 text-xl font-semibold text-zinc-100">
                  {getStatusLabel(game.status)}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Conquistados</p>
                <p className="mt-2 text-xl font-semibold text-zinc-100">
                  {earnedCount}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Pendentes</p>
                <p className="mt-2 text-xl font-semibold text-zinc-100">
                  {pendingCount}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Totais</p>
                <p className="mt-2 text-xl font-semibold text-zinc-100">
                  {trophies.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg shadow-black/20">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Troféus</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Lista base de troféus do jogo com o estado atual do usuário.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Resumo
                </p>
                <p className="mt-1 text-sm text-zinc-300">
                  {earnedCount} conquistados • {pendingCount} pendentes
                </p>
              </div>
            </div>

            {trophies.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/60 p-6 text-sm text-zinc-400">
                Nenhum troféu encontrado para este jogo.
              </div>
            ) : (
              <div className="space-y-3">
                {trophies.map((trophy) => (
                  <article
                    key={trophy.id}
                    className={`rounded-2xl border p-4 transition ${
                      trophy.earned
                        ? "border-emerald-700/40 bg-emerald-950/20"
                        : "border-zinc-800 bg-zinc-950/60"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg">
                            {getTrophyTypeEmoji(trophy.trophy_type)}
                          </span>

                          <h3 className="text-base font-semibold text-zinc-100">
                            {trophy.title}
                          </h3>

                          <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300">
                            {getTrophyTypeLabel(trophy.trophy_type)}
                          </span>

                          {typeof trophy.sort_order === "number" && (
                            <span className="rounded-full border border-zinc-800 px-2.5 py-1 text-xs text-zinc-500">
                              #{trophy.sort_order}
                            </span>
                          )}
                        </div>

                        <p className="text-sm leading-relaxed text-zinc-400">
                          {trophy.description || "Sem descrição cadastrada."}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {trophy.earned ? (
                          <div className="rounded-2xl border border-emerald-700/40 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">
                            <p className="font-medium">Conquistado</p>
                            <p className="mt-1 text-emerald-300/80">
                              {formatDateTime(trophy.earned_at)}
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
                            <p className="font-medium text-zinc-200">Pendente</p>
                            <p className="mt-1">Ainda não conquistado</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg shadow-black/20">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight">Timeline base</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Visão inicial dos eventos do jogo. Nesta etapa, a timeline mostra status atual e troféus já conquistados.
              </p>
            </div>

            {timeline.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/60 p-6 text-sm text-zinc-400">
                Ainda não há eventos suficientes para montar a timeline deste jogo.
              </div>
            ) : (
              <div className="space-y-4">
                {timeline.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 text-lg">
                        {item.type === "trophy" ? "🏆" : "🎮"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1">
                          <p className="font-medium text-zinc-100">{item.title}</p>
                          <p className="text-sm text-zinc-400">{item.description}</p>
                          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                            {item.date ? formatDateTime(item.date) : "Sem data registrada"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}