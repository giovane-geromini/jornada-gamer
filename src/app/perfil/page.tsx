"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { UserGameProgress } from "@/types/game";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";

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

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) return "JG";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function normalizeStatus(status: string | null) {
  if (!status) return "Outro";

  const s = status.toLowerCase();

  if (["playing", "jogando"].includes(s)) return "Jogando";
  if (["completed", "zerado"].includes(s)) return "Zerado";
  if (["backlog"].includes(s)) return "Backlog";

  return "Outro";
}

export default function PerfilPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userDisplayName, setUserDisplayName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [games, setGames] = useState<UserGameProgress[]>([]);

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
        setGames(gamesData);
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

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

  const completedCount = useMemo(
    () =>
      games.filter((game) => normalizeStatus(game.status) === "Zerado").length,
    [games],
  );

  if (loading) {
    return (
      <AppShell>
        <p className="py-16 text-center text-zinc-400">Carregando perfil...</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopBar
        eyebrow="Perfil"
        title={loggedLabel}
        subtitle="Sua identidade gamer, progresso e base para futuras preferências."
      />

      <div className="overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-6 shadow-2xl shadow-black/30">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/10 bg-white/5 text-3xl font-bold text-white">
            {getInitials(loggedLabel)}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
              Conta principal
            </p>
            <h2 className="mt-2 truncate text-3xl font-bold tracking-tight">
              {loggedLabel}
            </h2>
            <p className="mt-2 truncate text-sm text-zinc-400">{userEmail}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[28px] border border-white/10 bg-zinc-900/80 p-5">
          <p className="text-sm text-zinc-500">Jogos na biblioteca</p>
          <p className="mt-2 text-3xl font-bold">{games.length}</p>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-zinc-900/80 p-5">
          <p className="text-sm text-zinc-500">Jogos em andamento</p>
          <p className="mt-2 text-3xl font-bold">{playingCount}</p>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-zinc-900/80 p-5">
          <p className="text-sm text-zinc-500">Jogos zerados</p>
          <p className="mt-2 text-3xl font-bold">{completedCount}</p>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-zinc-900/80 p-5">
          <p className="text-sm text-zinc-500">Troféus conquistados</p>
          <p className="mt-2 text-3xl font-bold">
            {totalEarned} / {totalTrophies}
          </p>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-zinc-900/80 p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
          Próxima camada
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Perfil editável
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
          Esta tela já está pronta como base para a próxima evolução: editar nome,
          nick/ID, avatar e preferências da conta, substituindo de vez a exibição
          do e-mail como principal referência visual.
        </p>
      </div>
    </AppShell>
  );
}