import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { UserGameProgress } from "@/types/game";

async function getUserGames(): Promise<UserGameProgress[]> {
  const userId = "ae3477bf-41d0-4a02-8ef8-7e8bea096d28";

  const { data, error } = await supabase
    .from("v_user_game_progress")
    .select("*")
    .eq("user_id", userId)
    .order("progress_percent", { ascending: false });

  if (error) {
    console.error("Erro ao buscar jogos:", error);
    return [];
  }

  return (data ?? []) as UserGameProgress[];
}

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

export default async function HomePage() {
  const games = await getUserGames();

  const totalEarned = games.reduce((acc, game) => acc + game.earned_trophies, 0);
  const totalTrophies = games.reduce((acc, game) => acc + game.total_trophies, 0);

  const statusFilters = ["Todos", "Jogando", "Zerado", "Backlog"];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
            Jornada Gamer
          </p>
          <h1 className="text-4xl font-bold tracking-tight">
            Dashboard de Progresso
          </h1>
          <p className="max-w-2xl text-sm text-zinc-400 sm:text-base">
            Sua linha do tempo gamer começa aqui. Este painel mostra os jogos
            vinculados ao seu perfil, com progresso de troféus, plataforma e
            status atual.
          </p>
        </div>

        {games.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-zinc-300">
              Nenhum jogo encontrado para este usuário.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                  className="group overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                >
                  <div className="bg-zinc-950 p-4 pb-0">
                    <div className="relative mx-auto aspect-[2/3] w-full max-w-[260px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
                      {game.cover_url ? (
                        <Image
                          src={game.cover_url}
                          alt={game.title}
                          fill
                          className="object-contain transition-transform duration-300 group-hover:scale-105"
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

                  <div className="space-y-4 p-5">
                    <div className="space-y-1">
                      <h2 className="text-lg font-semibold leading-tight">
                        {game.title}
                      </h2>
                      <p className="text-sm text-zinc-400">
                        {game.platform_name ?? "Plataforma não informada"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-300">
                        {getStatusLabel(game.status)}
                      </span>
                      <span className="font-medium text-zinc-200">
                        {game.progress_percent}%
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-zinc-200 transition-all"
                          style={{ width: `${game.progress_percent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>
                          {game.earned_trophies} de {game.total_trophies} troféus
                        </span>
                        <span className="text-zinc-500 transition group-hover:text-zinc-300">
                          Abrir →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
