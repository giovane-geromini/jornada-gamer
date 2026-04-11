"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { UserGameProgress } from "@/types/game";
import AppShell from "@/components/AppShell";

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

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) return "JG";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
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
        console.error("Erro ao carregar home:", error);
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

  const loggedLabel = userDisplayName || userEmail || "Jogador";

  const totalEarned = useMemo(
    () => games.reduce((acc, game) => acc + game.earned_trophies, 0),
    [games],
  );

  const totalTrophies = useMemo(
    () => games.reduce((acc, game) => acc + game.total_trophies, 0),
    [games],
  );

  const playingCount = useMemo(
    () =>
      games.filter((game) => normalizeStatus(game.status) === "Jogando").length,
    [games],
  );

  const highlightGame = useMemo(
    () => games.find((g) => normalizeStatus(g.status) === "Jogando") || games[0],
    [games],
  );

  const recentGames = useMemo(() => games.slice(0, 4), [games]);

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-3 py-16 text-center">
          <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-white/10" />
          <p className="text-sm text-zinc-400">Carregando sua jornada...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg font-bold text-white shadow-lg shadow-black/30 backdrop-blur">
            {getInitials(loggedLabel)}
          </div>

          <div>
            <p className="text-sm text-zinc-500">Bem-vindo de volta</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {loggedLabel}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Continue sua jornada gamer
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10 hover:text-white"
        >
          Sair
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_0.9fr]">
        {highlightGame ? (
          <Link
            href={`/jogos/${highlightGame.game_id}`}
            className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-5 shadow-2xl shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:shadow-black/50 sm:p-6"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_35%)] opacity-80" />

            <div className="relative flex flex-col gap-5 sm:flex-row">
              <div className="relative h-[180px] w-[120px] overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-lg shadow-black/40">
                {highlightGame.cover_url ? (
                  <Image
                    src={highlightGame.cover_url}
                    alt={highlightGame.title}
                    fill
                    priority
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                    Sem capa
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                    Continue jogando
                  </p>

                  <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                    {highlightGame.title}
                  </h2>

                  <p className="mt-2 text-sm text-zinc-400">
                    {highlightGame.platform_name}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-100">
                      {getStatusLabel(highlightGame.status)}
                    </span>

                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-100">
                      {highlightGame.progress_percent}%
                    </span>

                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-100">
                      {highlightGame.earned_trophies}/{highlightGame.total_trophies} troféus
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Progresso atual</span>
                    <span>{highlightGame.progress_percent}%</span>
                  </div>

                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-500"
                      style={{
                        width: `${highlightGame.progress_percent}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ) : (
          <div className="rounded-[32px] border border-white/10 bg-zinc-900 p-6">
            <p className="text-sm text-zinc-400">Nenhum jogo encontrado ainda.</p>
          </div>
        )}

        <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-5 shadow-2xl shadow-black/20">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
            Seu perfil
          </p>

          <div className="mt-5 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-xl font-bold text-white">
              {getInitials(loggedLabel)}
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold">{loggedLabel}</h3>
              <p className="truncate text-sm text-zinc-400">{userEmail}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-zinc-500">Jogando</p>
              <p className="mt-1 text-2xl font-bold">{playingCount}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-zinc-500">Biblioteca</p>
              <p className="mt-1 text-2xl font-bold">{games.length}</p>
            </div>
          </div>

          <Link
            href="/perfil"
            className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-white/10"
          >
            Ver perfil
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[28px] border border-white/10 bg-zinc-900/70 p-5 shadow-xl shadow-black/20 backdrop-blur">
          <p className="text-sm text-zinc-500">Jogos</p>
          <p className="mt-2 text-3xl font-bold">{games.length}</p>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-zinc-900/70 p-5 shadow-xl shadow-black/20 backdrop-blur">
          <p className="text-sm text-zinc-500">Troféus conquistados</p>
          <p className="mt-2 text-3xl font-bold">{totalEarned}</p>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-zinc-900/70 p-5 shadow-xl shadow-black/20 backdrop-blur">
          <p className="text-sm text-zinc-500">Troféus totais</p>
          <p className="mt-2 text-3xl font-bold">{totalTrophies}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
            Sua biblioteca
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Jogos em destaque
          </h2>
        </div>

        <Link
          href="/biblioteca"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/10 hover:text-white"
        >
          Ver todos
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {recentGames.map((game) => (
          <Link
            key={game.game_id}
            href={`/jogos/${game.game_id}`}
            className="group overflow-hidden rounded-[28px] border border-white/10 bg-zinc-900/80 shadow-xl shadow-black/25 transition-all duration-300 hover:-translate-y-1.5 hover:border-white/15 hover:shadow-black/40"
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-black">
              {game.cover_url ? (
                <Image
                  src={game.cover_url}
                  alt={game.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                  Sem capa
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
            </div>

            <div className="space-y-3 p-4">
              <div>
                <h3 className="line-clamp-1 text-lg font-semibold">{game.title}</h3>
                <p className="mt-1 text-sm text-zinc-400">{game.platform_name}</p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-zinc-200">
                  {getStatusLabel(game.status)}
                </span>
                <span className="text-zinc-300">{game.progress_percent}%</span>
              </div>

              <div className="space-y-2">
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500"
                    style={{
                      width: `${game.progress_percent}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>
                    {game.earned_trophies} / {game.total_trophies} troféus
                  </span>
                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}