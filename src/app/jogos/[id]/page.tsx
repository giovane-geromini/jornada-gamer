"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/AppShell";
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
  notes?: string | null;
};

type TrophyWithUserState = {
  id: string;
  title: string;
  description: string | null;
  trophy_type: string | null;
  sort_order: number | null;
  earned: boolean;
  earned_at: string | null;
  notes?: string | null;
};

type TimelineItem = {
  id: string;
  type: "status" | "trophy";
  title: string;
  description: string;
  date: string | null;
  sortValue: number;
};

type ModalMode = "create" | "edit";

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
    notes: null,
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

function getDefaultManualDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultManualTime() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function localDateTimeToIso(date: string, time: string) {
  const raw = `${date}T${time}:00`;
  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function isoToLocalDateAndTime(value: string | null) {
  if (!value) {
    return {
      date: getDefaultManualDate(),
      time: getDefaultManualTime(),
    };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      date: getDefaultManualDate(),
      time: getDefaultManualTime(),
    };
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}

async function getGameById(currentUserId: string, currentGameId: string) {
  const { data, error } = await supabase
    .from("v_user_game_progress")
    .select("*")
    .eq("user_id", currentUserId)
    .eq("game_id", currentGameId)
    .single();

  if (error) {
    console.error("Erro ao buscar detalhe do jogo:", error);
    return null;
  }

  return data as UserGameProgress;
}

async function getGameTrophies(currentUserId: string, currentGameId: string) {
  const { data: trophyListData, error: trophyListError } = await supabase
    .from("trophy_lists")
    .select("id")
    .eq("game_id", currentGameId);

  if (trophyListError) {
    console.error("Erro ao buscar trophy_lists:", trophyListError);
    return [];
  }

  const trophyListIds = ((trophyListData ?? []) as TrophyListRow[])
    .map((item) => item.id)
    .filter(Boolean);

  if (trophyListIds.length === 0) {
    return [];
  }

  const { data: trophiesData, error: trophiesError } = await supabase
    .from("trophies")
    .select("*")
    .in("trophy_list_id", trophyListIds);

  if (trophiesError) {
    console.error("Erro ao buscar troféus:", trophiesError);
    return [];
  }

  const rawTrophies = ((trophiesData ?? []) as TrophyRow[]).map(normalizeTrophy);

  const orderedTrophies = rawTrophies.sort((a, b) => {
    const aOrder = a.sort_order ?? 999999;
    const bOrder = b.sort_order ?? 999999;
    return aOrder - bOrder;
  });

  if (orderedTrophies.length === 0) {
    return [];
  }

  const trophyIds = orderedTrophies.map((trophy) => trophy.id);

  const { data: userTrophiesData, error: userTrophiesError } = await supabase
    .from("user_trophies")
    .select("trophy_id, earned_at, notes")
    .eq("user_id", currentUserId)
    .in("trophy_id", trophyIds);

  if (userTrophiesError) {
    console.error("Erro ao buscar troféus do usuário:", userTrophiesError);
    return orderedTrophies;
  }

  const userTrophies = (userTrophiesData ?? []) as UserTrophyRow[];
  const earnedMap = new Map<string, UserTrophyRow>();

  for (const item of userTrophies) {
    earnedMap.set(item.trophy_id, item);
  }

  return orderedTrophies.map((trophy) => {
    const earnedData = earnedMap.get(trophy.id);

    return {
      ...trophy,
      earned: Boolean(earnedData),
      earned_at: earnedData?.earned_at ?? null,
      notes: earnedData?.notes ?? null,
    };
  });
}

export default function GameDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [game, setGame] = useState<UserGameProgress | null>(null);
  const [trophies, setTrophies] = useState<TrophyWithUserState[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [selectedTrophy, setSelectedTrophy] = useState<TrophyWithUserState | null>(null);
  const [trophyPendingDelete, setTrophyPendingDelete] =
    useState<TrophyWithUserState | null>(null);

  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [useCurrentDateTime, setUseCurrentDateTime] = useState(true);
  const [manualDate, setManualDate] = useState(getDefaultManualDate());
  const [manualTime, setManualTime] = useState(getDefaultManualTime());
  const [saveError, setSaveError] = useState("");

  const gameId = typeof params?.id === "string" ? params.id : "";

  const loadData = useCallback(
    async (currentUserId: string, currentGameId: string) => {
      const [gameData, trophiesData] = await Promise.all([
        getGameById(currentUserId, currentGameId),
        getGameTrophies(currentUserId, currentGameId),
      ]);

      setGame(gameData);
      setTrophies(trophiesData);
    },
    [],
  );

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

        if (!gameId) {
          router.replace("/");
          return;
        }

        const currentUserId = session.user.id;
        setUserId(currentUserId);

        await loadData(currentUserId, gameId);
      } catch (error) {
        console.error("Erro ao carregar página do jogo:", error);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [gameId, loadData, router]);

  const earnedCount = useMemo(
    () => trophies.filter((trophy) => trophy.earned).length,
    [trophies],
  );

  const pendingCount = useMemo(
    () => trophies.length - earnedCount,
    [trophies, earnedCount],
  );

  const progressPercent = useMemo(() => {
    if (!trophies.length) return game?.progress_percent ?? 0;
    return Math.round((earnedCount / trophies.length) * 100);
  }, [earnedCount, game?.progress_percent, trophies.length]);

  const timeline = useMemo(() => {
    if (!game) return [];
    return buildTimeline(game, trophies);
  }, [game, trophies]);

  function openCreateModal(trophy: TrophyWithUserState) {
    setModalMode("create");
    setSelectedTrophy(trophy);
    setUseCurrentDateTime(true);
    setManualDate(getDefaultManualDate());
    setManualTime(getDefaultManualTime());
    setSaveError("");
  }

  function openEditModal(trophy: TrophyWithUserState) {
    setModalMode("edit");
    setSelectedTrophy(trophy);
    setUseCurrentDateTime(false);

    const localValue = isoToLocalDateAndTime(trophy.earned_at);
    setManualDate(localValue.date);
    setManualTime(localValue.time);

    setSaveError("");
  }

  function closeRegisterModal() {
    setSelectedTrophy(null);
    setSaveError("");
    setUseCurrentDateTime(true);
    setModalMode("create");
  }

  function openDeleteModal(trophy: TrophyWithUserState) {
    setTrophyPendingDelete(trophy);
  }

  function closeDeleteModal() {
    setTrophyPendingDelete(null);
  }

  async function handleRegisterTrophy() {
    if (!selectedTrophy || !userId || !gameId) return;

    setSaving(true);
    setSaveError("");

    try {
      const earnedAtIso = useCurrentDateTime
        ? new Date().toISOString()
        : localDateTimeToIso(manualDate, manualTime);

      if (!earnedAtIso) {
        setSaveError("Data ou hora inválida.");
        setSaving(false);
        return;
      }

      const notes = useCurrentDateTime
        ? "Registrado no app com data/hora atuais."
        : "Registrado no app com data/hora manual.";

      const { error } = await supabase.from("user_trophies").insert({
        user_id: userId,
        trophy_id: selectedTrophy.id,
        earned_at: earnedAtIso,
        notes,
      });

      if (error) {
        console.error("Erro ao registrar troféu:", error);
        setSaveError(error.message || "Não foi possível registrar o troféu.");
        setSaving(false);
        return;
      }

      await loadData(userId, gameId);
      closeRegisterModal();
    } catch (error) {
      console.error("Erro inesperado ao registrar troféu:", error);
      setSaveError("Ocorreu um erro inesperado ao registrar o troféu.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateTrophy() {
    if (!selectedTrophy || !userId || !gameId) return;

    setSaving(true);
    setSaveError("");

    try {
      const earnedAtIso = useCurrentDateTime
        ? new Date().toISOString()
        : localDateTimeToIso(manualDate, manualTime);

      if (!earnedAtIso) {
        setSaveError("Data ou hora inválida.");
        setSaving(false);
        return;
      }

      const notes = useCurrentDateTime
        ? "Atualizado no app com data/hora atuais."
        : "Atualizado no app com data/hora manual.";

      const { error } = await supabase
        .from("user_trophies")
        .update({
          earned_at: earnedAtIso,
          notes,
        })
        .eq("user_id", userId)
        .eq("trophy_id", selectedTrophy.id);

      if (error) {
        console.error("Erro ao atualizar troféu:", error);
        setSaveError(error.message || "Não foi possível atualizar o troféu.");
        setSaving(false);
        return;
      }

      await loadData(userId, gameId);
      closeRegisterModal();
    } catch (error) {
      console.error("Erro inesperado ao atualizar troféu:", error);
      setSaveError("Ocorreu um erro inesperado ao atualizar o troféu.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTrophy() {
    if (!userId || !gameId || !trophyPendingDelete) return;

    setDeleting(true);

    try {
      const { error } = await supabase
        .from("user_trophies")
        .delete()
        .eq("user_id", userId)
        .eq("trophy_id", trophyPendingDelete.id);

      if (error) {
        console.error("Erro ao remover conquista:", error);
        return;
      }

      await loadData(userId, gameId);
      closeDeleteModal();
    } catch (error) {
      console.error("Erro inesperado ao remover conquista:", error);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="py-16 text-center text-zinc-400">Carregando jogo...</div>
      </AppShell>
    );
  }

  if (!game) {
    return (
      <AppShell>
        <div className="space-y-4 py-12 text-center">
          <p className="text-lg font-semibold text-zinc-100">
            Não foi possível abrir este jogo.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            ← Voltar para a Home
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
        >
          ← Voltar ao início
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-[32px] border border-white/10 bg-zinc-900/80 p-5 shadow-2xl shadow-black/20">
          <div className="relative mx-auto aspect-[2/3] w-full max-w-[300px] overflow-hidden rounded-2xl border border-white/10 bg-black">
            {game.cover_url ? (
              <Image
                src={game.cover_url}
                alt={game.title}
                fill
                className="object-contain"
                unoptimized
                priority
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
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200">
              {getStatusLabel(game.status)}
            </span>

            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200">
              {progressPercent}% concluído
            </span>

            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200">
              {earnedCount} / {trophies.length} troféus
            </span>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-zinc-900/80 p-6 shadow-xl shadow-black/20">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Progresso de troféus</span>
                <span className="font-medium text-zinc-100">
                  {earnedCount} / {trophies.length}
                </span>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-white transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="text-sm text-zinc-400">
                Você já conquistou {earnedCount} de {trophies.length} troféus neste jogo.
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-dashed border-white/10 bg-zinc-900/60 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-100">
                  Registro rápido de conquista
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  Clique em qualquer troféu pendente abaixo para registrar a conquista.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
                {pendingCount} pendentes
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-[24px] border border-white/10 bg-zinc-900/80 p-5">
              <p className="text-sm text-zinc-400">Status</p>
              <p className="mt-2 text-xl font-semibold text-zinc-100">
                {getStatusLabel(game.status)}
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-zinc-900/80 p-5">
              <p className="text-sm text-zinc-400">Conquistados</p>
              <p className="mt-2 text-xl font-semibold text-zinc-100">{earnedCount}</p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-zinc-900/80 p-5">
              <p className="text-sm text-zinc-400">Pendentes</p>
              <p className="mt-2 text-xl font-semibold text-zinc-100">{pendingCount}</p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-zinc-900/80 p-5">
              <p className="text-sm text-zinc-400">Totais</p>
              <p className="mt-2 text-xl font-semibold text-zinc-100">{trophies.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <section className="rounded-[32px] border border-white/10 bg-zinc-900/80 p-6 shadow-xl shadow-black/20">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Troféus</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Toque em um troféu pendente para registrar a conquista.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Resumo
              </p>
              <p className="mt-1 text-sm text-zinc-300">
                {earnedCount} conquistados • {pendingCount} pendentes
              </p>
            </div>
          </div>

          {trophies.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-zinc-400">
              Nenhum troféu encontrado para este jogo.
            </div>
          ) : (
            <div className="space-y-3">
              {trophies.map((trophy) => (
                <article
                  key={trophy.id}
                  className={`rounded-[24px] border p-4 transition ${
                    trophy.earned
                      ? "border-emerald-700/40 bg-emerald-950/20"
                      : "border-white/10 bg-zinc-950/60 hover:border-white/20 hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_250px] lg:items-center">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg">
                          {getTrophyTypeEmoji(trophy.trophy_type)}
                        </span>

                        <h3 className="text-lg font-semibold leading-tight text-zinc-100">
                          {trophy.title}
                        </h3>

                        <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-300">
                          {getTrophyTypeLabel(trophy.trophy_type)}
                        </span>

                        {typeof trophy.sort_order === "number" && (
                          <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-500">
                            #{trophy.sort_order}
                          </span>
                        )}
                      </div>

                      <p className="text-sm leading-6 text-zinc-400">
                        {trophy.description || "Sem descrição cadastrada."}
                      </p>
                    </div>

                    <div className="w-full lg:max-w-[250px]">
                      {trophy.earned ? (
                        <div className="space-y-2">
                          <div className="rounded-[18px] border border-emerald-700/40 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">
                            <p className="font-medium">Conquistado</p>
                            <p className="mt-1 text-base text-emerald-300/90">
                              {formatDateTime(trophy.earned_at)}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(trophy)}
                              className="rounded-[16px] border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                            >
                              Editar conquista
                            </button>

                            <button
                              type="button"
                              onClick={() => openDeleteModal(trophy)}
                              disabled={deleting}
                              className="rounded-[16px] border border-red-500/30 bg-red-950/40 px-4 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deleting && trophyPendingDelete?.id === trophy.id
                                ? "Removendo..."
                                : "Remover conquista"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="rounded-[18px] border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
                            <p className="font-medium text-zinc-200">Pendente</p>
                            <p className="mt-1">Ainda não conquistado</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => openCreateModal(trophy)}
                            className="w-full rounded-[16px] border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                          >
                            Registrar conquista
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-[32px] border border-white/10 bg-zinc-900/80 p-6 shadow-xl shadow-black/20">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Timeline</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Eventos do jogo e troféus já registrados.
            </p>
          </div>

          {timeline.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-zinc-400">
              Ainda não há eventos suficientes para montar a timeline deste jogo.
            </div>
          ) : (
            <div className="space-y-4">
              {timeline.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4"
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

      {selectedTrophy ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {modalMode === "create" ? "Registrar conquista" : "Editar conquista"}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-zinc-100">
                  {selectedTrophy.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  {game.title} • {getTrophyTypeLabel(selectedTrophy.trophy_type)}
                </p>
              </div>

              <button
                type="button"
                onClick={closeRegisterModal}
                className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
              >
                Fechar
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-zinc-100">
                  Como deseja registrar?
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setUseCurrentDateTime(true)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      useCurrentDateTime
                        ? "border-white bg-white text-black"
                        : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                    }`}
                  >
                    Usar data e hora atuais
                  </button>

                  <button
                    type="button"
                    onClick={() => setUseCurrentDateTime(false)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      !useCurrentDateTime
                        ? "border-white bg-white text-black"
                        : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                    }`}
                  >
                    Informar manualmente
                  </button>
                </div>
              </div>

              {!useCurrentDateTime ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm text-zinc-300">Data</span>
                    <input
                      type="date"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none transition focus:border-white/20"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm text-zinc-300">Hora</span>
                    <input
                      type="time"
                      value={manualTime}
                      onChange={(e) => setManualTime(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none transition focus:border-white/20"
                    />
                  </label>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-4 text-sm text-zinc-300">
                  O registro será salvo com a data e hora atuais do momento do clique.
                </div>
              )}

              {saveError ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-200">
                  {saveError}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeRegisterModal}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    modalMode === "create" ? handleRegisterTrophy : handleUpdateTrophy
                  }
                  disabled={saving}
                  className="rounded-2xl border border-white bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Salvando..."
                    : modalMode === "create"
                      ? "Confirmar conquista"
                      : "Salvar alterações"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {trophyPendingDelete ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/50">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Remover conquista
              </p>

              <h3 className="text-2xl font-semibold text-zinc-100">
                {trophyPendingDelete.title}
              </h3>

              <p className="text-sm leading-6 text-zinc-400">
                Esta ação vai remover o registro de conquista deste troféu e ele voltará para o estado pendente.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-950/20 p-4 text-sm text-red-200">
              Confirma a remoção da conquista?
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleDeleteTrophy}
                disabled={deleting}
                className="rounded-2xl border border-red-500/40 bg-red-950/50 px-5 py-3 text-sm font-medium text-red-100 transition hover:bg-red-900/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Removendo..." : "Confirmar remoção"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}