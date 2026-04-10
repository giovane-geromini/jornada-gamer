"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { UserGameProgress } from "@/types/game";

type StatusFilter = "Todos" | "Jogando" | "Zerado" | "Backlog" | "Outros";

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

function normalizeStatus(status: string | null) {
  if (!status) return "Outro";

  const s = status.toLowerCase();

  if (["playing", "jogando"].includes(s)) return "Jogando";
  if (["completed", "zerado"].includes(s)) return "Zerado";
  if (["backlog"].includes(s)) return "Backlog";

  return "Outro";
}

function sortGames(games: UserGameProgress[]) {
  return [...games].sort((a, b) => {
    const statusPriority = (status: string | null) => {
      const normalized = normalizeStatus(status);
      if (normalized === "Jogando") return 0;
      if (normalized === "Backlog") return 1;
      if (normalized === "Zerado") return 2;
      return 3;
    };

    const statusDiff = statusPriority(a.status) - statusPriority(b.status);

    if (statusDiff !== 0) return statusDiff;

    return b.progress_percent - a.progress_percent;
  });
}

export default function HomePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [gamesRaw, setGamesRaw] = useState<UserGameProgress[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Todos");
  const [platformFilter, setPlatformFilter] = useState("Todas");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
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

      if (mounted) {
        setUserEmail(session.user.email ?? "");
      }

      const { data, error } = await supabase
        .from("v_user_game_progress")
        .select("*")
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Erro ao buscar jogos:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        if (mounted) {
          setErrorMessage("Não foi possível carregar os jogos do usuário.");
          setGamesRaw([]);
          setLoading(false);
        }
        return;
      }

      if (mounted) {
        setGamesRaw((data ?? []) as UserGameProgress[]);
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
  }, [router]);

  const statusFilters: StatusFilter[] = [
    "Todos",
    "Jogando",
    "Zerado",
    "Backlog",
    "Outros",
  ];

  const platformOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        gamesRaw
          .map((game) => game.platform_name?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));

    return ["Todas", ...values];
  }, [gamesRaw]);

  const gamesFiltered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return sortGames(
      gamesRaw.filter((game) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          game.title.toLowerCase().includes(normalizedSearch);

        const normalizedGameStatus = normalizeStatus(game.status);

        const matchesStatus =
          statusFilter === "Todos"
            ? true
            : statusFilter === "Outros"
              ? !["Jogando", "Zerado", "Backlog"].includes(normalizedGameStatus)
              : normalizedGameStatus === statusFilter;

        const matchesPlatform =
          platformFilter === "Todas"
            ? true
            : (game.platform_name ?? "") === platformFilter;

        return matchesSearch && matchesStatus && matchesPlatform;
      }),
    );
  }, [gamesRaw, platformFilter, search, statusFilter]);

  const totalEarned = gamesFiltered.reduce(
    (acc, game) => acc + game.earned_trophies,
    0,
  );

  const totalTrophies = gamesFiltered.reduce(
    (acc, game) => acc + game.total_trophies,
    0,
  );

  const highlightGame =
    gamesFiltered.find((g) => normalizeStatus(g.status) === "Jogando") ??
    gamesFiltered[0];

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <section className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-6 py-10">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 px-6 py-5 text-sm text-zinc-300 shadow-lg shadow-black/20">
            Carregando sua jornada gamer...
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              Jornada Gamer
            </p>

            <h1 className="text-4xl font-bold tracking-tight">
              Dashboard de Progresso
            </h1>

            <p className="max-w-2xl text-sm text-zinc-400 sm:text-base">
              Sua jornada gamer organizada em um só lugar.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-lg shadow-black/20 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Conta ativa
              </p>
              <p className="mt-1 text-sm text-zinc-200">
                {userEmail || "Usuário autenticado"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? "Saindo..." : "Sair"}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-2xl border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        {highlightGame && (
          <Link
            href={`/jogos/${highlightGame.game_id}`}
            className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-6 transition hover:border-zinc-700"
          >
            <div className="flex flex-col gap-6 sm:flex-row">
              <div className="relative h-[160px] w-[110px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                {highlightGame.cover_url ? (
                  <Image
                    src={highlightGame.cover_url}
                    alt={highlightGame.title}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-500">
                    Sem capa
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Continue jogando
                </p>

                <h2 className="text-2xl font-semibold">
                  {highlightGame.title}
                </h2>

                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="rounded-full border border-zinc-700 px-3 py-1">
                    {getStatusLabel(highlightGame.status)}
                  </span>

                  <span className="rounded-full border border-zinc-700 px-3 py-1">
                    {highlightGame.progress_percent}%
                  </span>

                  <span className="rounded-full border border-zinc-700 px-3 py-1">
                    {highlightGame.earned_trophies} / {highlightGame.total_trophies} troféus
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full bg-zinc-200"
                    style={{
                      width: `${highlightGame.progress_percent}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Link>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Jogos visíveis</p>
            <p className="mt-2 text-3xl font-bold">{gamesFiltered.length}</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Troféus conquistados</p>
            <p className="mt-2 text-3xl font-bold">{totalEarned}</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Troféus totais</p>
            <p className="mt-2 text-3xl font-bold">{totalTrophies}</p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_220px]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <label
              htmlFor="search-games"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Buscar jogo
            </label>
            <input
              id="search-games"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Digite o nome do jogo..."
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-zinc-500"
            />
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <label
              htmlFor="status-filter"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
            >
              {statusFilters.map((filter) => (
                <option key={filter} value={filter}>
                  {filter}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <label
              htmlFor="platform-filter"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Plataforma
            </label>
            <select
              id="platform-filter"
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
            >
              {platformOptions.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>
        </div>

        {gamesFiltered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-700 bg-zinc-950/60 p-8 text-center text-sm text-zinc-400">
            Nenhum jogo encontrado com os filtros atuais.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {gamesFiltered.map((game) => (
              <Link
                key={game.game_id}
                href={`/jogos/${game.game_id}`}
                className="group overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:border-zinc-700"
              >
                <div className="bg-zinc-950 p-4 pb-0">
                  <div className="relative mx-auto aspect-[2/3] w-full max-w-[260px] overflow-hidden rounded-2xl border border-zinc-800">
                    {game.cover_url ? (
                      <Image
                        src={game.cover_url}
                        alt={game.title}
                        fill
                        className="object-contain transition group-hover:scale-105"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-500">
                        Sem capa
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div>
                    <h2 className="text-lg font-semibold">{game.title}</h2>
                    <p className="text-sm text-zinc-400">
                      {game.platform_name ?? "Plataforma não informada"}
                    </p>
                  </div>

                  <div className="flex justify-between gap-3 text-sm">
                    <span className="rounded-full border border-zinc-700 px-3 py-1">
                      {getStatusLabel(game.status)}
                    </span>
                    <span>{game.progress_percent}%</span>
                  </div>

                  <div className="space-y-2">
                    <div className="h-2 w-full rounded-full bg-zinc-800">
                      <div
                        className="h-full bg-zinc-200"
                        style={{
                          width: `${game.progress_percent}%`,
                        }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>
                        {game.earned_trophies} de {game.total_trophies}
                      </span>
                      <span>→</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}