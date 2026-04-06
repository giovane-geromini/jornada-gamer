export type UserGameProgress = {
  game_id: string;
  title: string;
  slug: string | null;
  cover_url: string | null;
  platform_name: string | null;
  status: string | null;
  total_trophies: number;
  earned_trophies: number;
  progress_percent: number;
};