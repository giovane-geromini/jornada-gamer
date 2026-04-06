import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { UserGameProgress } from "@/types/game";

type GamePageProps = {
  params: Promise<{
    id: string;
  }>;
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

  return map[status] ?? status;
}

async function getGameById(gameId: string): Promise<UserGameProgress | null> {
  const userId = "ae3477bf-41d0-4a02-8ef8-7e8bea096d28";

  const { data, error } = await supabase
    .from("v_user_game_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("game_id", gameId)
    .single();

  if (error) {
    console.error("Erro ao buscar detalhe do jogo:", error);
    return null;
  }

  return data as UserGameProgress;
}

export default async function GameDetailPage({ params }: GamePageProps) {
  const resolvedParams = await params;
  const game = await getGameById(resolvedParams.id);

  if (!game) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
          >
            ← Voltar ao dashboard
          </Link>
        </div>

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

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Status</p>
                <p className="mt-2 text-xl font-semibold text-zinc-100">
                  {getStatusLabel(game.status)}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Troféus conquistados</p>
                <p className="mt-2 text-xl font-semibold text-zinc-100">
                  {game.earned_trophies}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Troféus totais</p>
                <p className="mt-2 text-xl font-semibold text-zinc-100">
                  {game.total_trophies}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
