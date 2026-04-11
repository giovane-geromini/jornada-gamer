"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { UserGameProgress } from "@/types/game";

type StatusFilter = "Todos" | "Jogando" | "Zerado" | "Backlog";

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

  return map[status] ?? status;
}

function normalizeStatus(status: string | null) {
  if (!status) return "outro";

  const s = status.toLowerCase();

  if (["playing", "jogando"].includes(s)) return "Jogando";
  if (["completed", "zerado"].includes(s)) return "Zerado";
  if (["backlog"].includes(s)) return "Backlog";

  return "Outro";
}

async function getUserGames(userId: string): Promise<UserGameProgress[]> {
  const { data, error } = await supabase
    .from("v_user_game_progress")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("Erro ao buscar jogos:", error);
    return [];
  }

  return (data ?? []) as UserGameProgress[];
}

async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Erro ao buscar perfil:", error);
    return null;
  }

  return data;
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
  const [games, setGames] = useState<UserGameProgress[]>([]);
  const [userDisplayName, setUserDisplayName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/login");
          return;
        }

        const userId = session.user.id;
        const emailFromSession = session.user.email ?? "";

        setUserEmail(emailFromSession);

        const [profile, gamesData] = await Promise.all([
          getUserProfile(userId),
          getUserGames(userId),
        ]);

        setUserDisplayName(profile?.display_name ?? "");
        setGames(sortGames(gamesData));
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        Carregando...
      </main>
    );
  }

  const totalEarned = games.reduce((acc, game) => acc + game.earned_trophies, 0);

  const totalTrophies = games.reduce(
    (acc, game) => acc + game.total_trophies,
    0,
  );

  const highlightGame =
    games.find((g) => normalizeStatus(g.status) === "Jogando") || games[0];

  const statusFilters: StatusFilter[] = [
    "Todos",
    "Jogando",
    "Zerado",
    "Backlog",
  ];

  const loggedLabel = userDisplayName || userEmail || "Usuário";

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm">
            <p className="text-zinc-400">Logado como:</p>
            <p className="mt-1 break-all font-medium text-zinc-100">
              {loggedLabel}
            </p>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 w-full rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800 hover:text-white"
            >
              Sair
            </button>
          </div>
        </div>

        {highlightGame && (
          <Link
            href={`/jogos/${highlightGame.game_id}`}
            className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-6 transition hover:border-zinc-700"
          >
            <div className="flex flex-col gap-6 sm:flex-row">
              <div className="relative h-[160px] w-[110px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                {highlightGame.cover_url && (
                  <Image
                    src={highlightGame.cover_url}
                    alt={highlightGame.title}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                )}
              </div>

              <div className="flex-1 space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Continue jogando
                </p>

                <h2 className="text-2xl font-semibold">{highlightGame.title}</h2>

                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="rounded-full border border-zinc-700 px-3 py-1">
                    {getStatusLabel(highlightGame.status)}
                  </span>

                  <span className="rounded-full border border-zinc-700 px-3 py-1">
                    {highlightGame.progress_percent}%
                  </span>

                  <span className="rounded-full border border-zinc-700 px-3 py-1">
                    {highlightGame.earned_trophies} /{" "}
                    {highlightGame.total_trophies} troféus
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
            <p className="text-sm text-zinc-400">Jogos</p>
            <p className="mt-2 text-3xl font-bold">{games.length}</p>
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

        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {games.map((game) => (
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
                  <p className="text-sm text-zinc-400">{game.platform_name}</p>
                </div>

                <div className="flex justify-between text-sm">
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
      </section>
    </main>
  );
}