"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { UserGameProgress } from "@/types/game";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";

type FilterType = "Todos" | "Jogando" | "Zerado" | "Backlog";

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
  if (!status) return "Outro";

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

function sortGames(games: UserGameProgress[]) {
  return [...games].sort((a, b) => b.progress_percent - a.progress_percent);
}

export default function BibliotecaPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<UserGameProgress[]>([]);
  const [filter, setFilter] = useState<FilterType>("Todos");

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

        const gamesData = await getUserGames(session.user.id);
        setGames(sortGames(gamesData));
      } catch (error) {
        console.error("Erro ao carregar biblioteca:", error);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  const filteredGames = useMemo(() => {
    if (filter === "Todos") return games;
    return games.filter((game) => normalizeStatus(game.status) === filter);
  }, [games, filter]);

  if (loading) {
    return (
      <AppShell>
        <p className="py-16 text-center text-zinc-400">Carregando biblioteca...</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopBar
        eyebrow="Biblioteca"
        title="Sua coleção"
        subtitle="Explore seus jogos e acompanhe o progresso de cada jornada."
      />

      <div className="flex flex-wrap gap-2">
        {(["Todos", "Jogando", "Zerado", "Backlog"] as FilterType[]).map(
          (item) => {
            const active = filter === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full border px-4 py-2 text-sm transition-all duration-200 ${
                  active
                    ? "border-white bg-white text-black"
                    : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item}
              </button>
            );
          },
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {filteredGames.map((game) => (
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
                <h2 className="line-clamp-1 text-lg font-semibold">{game.title}</h2>
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
                    style={{ width: `${game.progress_percent}%` }}
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