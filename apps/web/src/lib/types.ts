export interface GuildMember { name: string; level: number; xp: number; streak: number; is_me: boolean }
export interface GuildOverview {
  guild: { id: string; name: string; invite_code: string };
  members: GuildMember[];
  mission: { title: string; target: number; progress: number; week: string; my_amount: number };
}
export interface LoginEntry { event: string; ip: string | null; userAgent: string | null; at: string }
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };
