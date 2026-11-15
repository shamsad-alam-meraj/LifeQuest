import { DIFFICULTY_XP } from './xp';
import { ensureSkill, newId } from './skills';
import { dayKey, streakDays } from './stats';
import type { Adventure, GameState, Quest, QuestDraft, QuestKind } from './types';

export const DAILY_ADVENTURE_ID = 'adv_daily';
export const BOSS_ADVENTURE_ID = 'adv_boss';
export const MAX_REROLLS_PER_DAY = 2;
const MULT: Record<QuestKind, number> = { normal: 1, daily: 1.5, boss: 3, custom: 0.5 };

/** ISO-8601 week key in UTC, e.g. 2026-W07. */
export function weekKey(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const y = t.getUTCFullYear();
  const w = Math.ceil(((t.getTime() - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7);
  return `${y}-W${String(w).padStart(2, '0')}`;
}

export const canClaimDaily = (s: GameState, now = new Date()) => s.lastDailyOn !== dayKey(now.toISOString());
export const canSpawnBoss = (s: GameState, now = new Date()) => s.lastBossWeek !== weekKey(now);
export const rerollsLeft = (s: GameState, now = new Date()) =>
  Math.max(0, MAX_REROLLS_PER_DAY - (s.rerolls?.day === dayKey(now.toISOString()) ? s.rerolls.n : 0));

/** Normal quests unlock in order within their adventure. Daily and boss quests are always open. */
export function isUnlocked(state: GameState, quest: Quest): boolean {
  if ((quest.kind ?? 'normal') !== 'normal' || quest.status !== 'active') return true;
  for (const q of state.quests) {
    if (q.id === quest.id) return true;
    if (q.adventureId === quest.adventureId && (q.kind ?? 'normal') === 'normal' && q.status === 'active') return false;
  }
  return true;
}

function withAdventure(state: GameState, id: string, title: string, premise: string, now: Date): GameState {
  if (state.adventures.some((a) => a.id === id)) return state;
  const adv: Adventure = { id, title, premise, goal: title, createdAt: now.toISOString() };
  return { ...state, adventures: [...state.adventures, adv] };
}

/** Claim today's daily quest (once per day) or this week's boss (once per week). No-op if already claimed. */
export function addSpecialQuest(state: GameState, kind: 'daily' | 'boss', draft: QuestDraft, now = new Date()): GameState {
  if (kind === 'daily' ? !canClaimDaily(state, now) : !canSpawnBoss(state, now)) return state;
  const adv = kind === 'daily' ? [DAILY_ADVENTURE_ID, 'Daily Quests', 'A fresh challenge every day.'] : [BOSS_ADVENTURE_ID, 'Weekly Bosses', 'Once a week, something worth bragging about.'];
  let next = withAdventure(state, adv[0]!, adv[1]!, adv[2]!, now);
  const r = ensureSkill(next.skills, draft.skill);
  const difficulty = kind === 'boss' && (draft.difficulty === 'easy' || draft.difficulty === 'medium') ? 'hard' : draft.difficulty;
  const quest: Quest = {
    id: newId('q'), adventureId: adv[0]!, title: draft.title, story: draft.story, action: draft.action,
    skillId: r.skill.id, difficulty, xp: Math.round(DIFFICULTY_XP[difficulty] * MULT[kind]),
    status: 'active', kind, createdAt: now.toISOString(),
  };
  next = { ...next, skills: r.skills, quests: [...next.quests, quest] };
  return kind === 'daily' ? { ...next, lastDailyOn: dayKey(now.toISOString()) } : { ...next, lastBossWeek: weekKey(now) };
}

export type RerollResult = { ok: true; state: GameState } | { ok: false; reason: 'not-found' | 'not-active' | 'limit' };

/** Swap an active quest for a fresh one (same slot, same unlock position). Limited per day. */
export function rerollQuest(state: GameState, questId: string, draft: QuestDraft, now = new Date()): RerollResult {
  const q = state.quests.find((x) => x.id === questId);
  if (!q) return { ok: false, reason: 'not-found' };
  if (q.status !== 'active') return { ok: false, reason: 'not-active' };
  if (rerollsLeft(state, now) <= 0) return { ok: false, reason: 'limit' };
  const day = dayKey(now.toISOString());
  const r = ensureSkill(state.skills, draft.skill);
  const used = state.rerolls?.day === day ? state.rerolls.n : 0;
  return {
    ok: true,
    state: {
      ...state,
      skills: r.skills,
      rerolls: { day, n: used + 1 },
      quests: state.quests.map((x) => x.id === questId ? { ...x, title: draft.title, story: draft.story, action: draft.action, skillId: r.skill.id, difficulty: draft.difficulty, xp: Math.round(DIFFICULTY_XP[draft.difficulty] * MULT[x.kind ?? 'normal']) } : x),
    },
  };
}

/** Skill XP is derived from completed quests, which makes merging two saves deterministic. */
export function recomputeSkills(state: GameState): GameState {
  const xp = new Map<string, number>();
  for (const q of state.quests) if (q.status === 'completed') xp.set(q.skillId, (xp.get(q.skillId) ?? 0) + q.xp);
  return { ...state, skills: state.skills.map((k) => ({ ...k, xp: xp.get(k.id) ?? 0 })) };
}

const RANK = { active: 0, abandoned: 1, completed: 2 } as const;

/** Merge two saves of the same player (e.g. local + cloud) without losing progress. `a` wins ties. */
export function mergeStates(a: GameState, b: GameState): GameState {
  const quests = new Map<string, Quest>(a.quests.map((q) => [q.id, q]));
  for (const q of b.quests) {
    const mine = quests.get(q.id);
    if (!mine || RANK[q.status] > RANK[mine.status]) quests.set(q.id, q);
  }
  const byId = <T extends { id: string }>(x: T[], y: T[]) => [...new Map([...y, ...x].map((i) => [i.id, i])).values()];
  const ach = new Map(a.achievements.map((x) => [x.id, x]));
  for (const x of b.achievements) { const m = ach.get(x.id); if (!m || x.unlockedAt < m.unlockedAt) ach.set(x.id, x); }
  const order = new Map([...a.quests, ...b.quests].map((q, i) => [q.id, i]));
  const merged: GameState = {
    version: 1,
    profile: a.profile ?? b.profile,
    adventures: byId(a.adventures, b.adventures).sort((x, y) => y.createdAt.localeCompare(x.createdAt)),
    quests: [...quests.values()].sort((x, y) => order.get(x.id)! - order.get(y.id)!),
    skills: byId(a.skills, b.skills),
    achievements: [...ach.values()],
    lastDailyOn: [a.lastDailyOn, b.lastDailyOn].filter(Boolean).sort().pop(),
    lastBossWeek: [a.lastBossWeek, b.lastBossWeek].filter(Boolean).sort().pop(),
    rerolls: (a.rerolls?.day ?? '') >= (b.rerolls?.day ?? '') ? a.rerolls ?? b.rerolls : b.rerolls,
    shields: Math.max(a.shields ?? 0, b.shields ?? 0),
    frozenDays: [...new Set([...(a.frozenDays ?? []), ...(b.frozenDays ?? [])])],
    shieldAwardedOn: [a.shieldAwardedOn, b.shieldAwardedOn].filter(Boolean).sort().pop(),
    shieldsUsed: Math.max(a.shieldsUsed ?? 0, b.shieldsUsed ?? 0),
    focusMinutes: Math.max(a.focusMinutes ?? 0, b.focusMinutes ?? 0),
    equipped: { ...(b.equipped ?? {}), ...(a.equipped ?? {}) },
  };
  return recomputeSkills(merged);
}

/** Completed-quest counts per day, for the activity heatmap. */
export function activityByDay(state: GameState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const q of state.quests) if (q.status === 'completed' && q.completedAt) { const d = dayKey(q.completedAt); out[d] = (out[d] ?? 0) + 1; }
  return out;
}

export const CUSTOM_ADVENTURE_ID = 'adv_custom';

/** A player-written quest. Worth half XP so the AI-crafted path stays the main road. */
export function addCustomQuest(state: GameState, draft: Pick<QuestDraft, 'title' | 'action' | 'skill' | 'difficulty'>, now = new Date()): GameState {
  const title = draft.title.trim().slice(0, 100);
  const action = draft.action.trim().slice(0, 400);
  if (!title || !action) return state;
  let next = withAdventure(state, CUSTOM_ADVENTURE_ID, 'My Quests', 'Quests you wrote yourself.', now);
  const r = ensureSkill(next.skills, draft.skill || 'General');
  const quest: Quest = {
    id: newId('q'), adventureId: CUSTOM_ADVENTURE_ID, title, story: 'A quest of your own making.', action,
    skillId: r.skill.id, difficulty: draft.difficulty, xp: Math.round(DIFFICULTY_XP[draft.difficulty] * MULT.custom),
    status: 'active', kind: 'custom', createdAt: now.toISOString(),
  };
  return { ...next, skills: r.skills, quests: [...next.quests, quest] };
}

export const addFocusMinutes = (s: GameState, minutes: number): GameState =>
  minutes > 0 ? { ...s, focusMinutes: (s.focusMinutes ?? 0) + Math.min(Math.round(minutes), 180) } : s;

export const MAX_SHIELDS = 2;

/** If yesterday was missed but the streak was alive the day before, spend a shield to bridge it. */
export function applyShields(state: GameState, now = new Date()): GameState {
  if ((state.shields ?? 0) <= 0) return state;
  const day = (offset: number) => { const d = new Date(now); d.setUTCDate(d.getUTCDate() + offset); return dayKey(d.toISOString()); };
  const covered = new Set([...state.quests.filter((q) => q.completedAt).map((q) => dayKey(q.completedAt!)), ...(state.frozenDays ?? [])]);
  const [y, yy] = [day(-1), day(-2)];
  if (covered.has(y) || !covered.has(yy)) return state;
  return { ...state, shields: state.shields! - 1, frozenDays: [...(state.frozenDays ?? []), y], shieldsUsed: (state.shieldsUsed ?? 0) + 1 };
}

/** Earn a shield each time a streak reaches a multiple of 7 days (once per day, capped). */
export function awardShield(state: GameState, now = new Date()): { state: GameState; earned: boolean } {
  const streak = streakDays(state, now);
  const today = dayKey(now.toISOString());
  if (streak === 0 || streak % 7 !== 0 || state.shieldAwardedOn === today || (state.shields ?? 0) >= MAX_SHIELDS) return { state, earned: false };
  return { state: { ...state, shields: (state.shields ?? 0) + 1, shieldAwardedOn: today }, earned: true };
}

export type GearSlot = 'head' | 'face' | 'neck' | 'aura';
export interface Gear { id: string; name: string; icon: string; slot: GearSlot; level: number }
export const GEAR: Gear[] = [
  { id: 'scarf', name: 'Adventurer’s Scarf', icon: '🧣', slot: 'neck', level: 2 },
  { id: 'glasses', name: 'Scholar’s Spectacles', icon: '👓', slot: 'face', level: 3 },
  { id: 'lantern', name: 'Wayfinder’s Glow', icon: '🏮', slot: 'aura', level: 4 },
  { id: 'wizard', name: 'Wizard Hat', icon: '🧙', slot: 'head', level: 6 },
  { id: 'crown', name: 'Golden Crown', icon: '👑', slot: 'head', level: 9 },
  { id: 'starlight', name: 'Starlight Aura', icon: '✨', slot: 'aura', level: 12 },
];
export const unlockedGear = (level: number) => GEAR.filter((g) => g.level <= level);

/** Equip an unlocked item (replacing its slot) or unequip it if already worn. */
export function equipGear(state: GameState, id: string, level: number): GameState {
  const g = GEAR.find((x) => x.id === id);
  if (!g || g.level > level) return state;
  const equipped = { ...(state.equipped ?? {}) };
  if (equipped[g.slot] === id) delete equipped[g.slot]; else equipped[g.slot] = id;
  return { ...state, equipped };
}

/** The XP a quest is worth, derived only from its difficulty and kind. */
export const expectedQuestXp = (q: Pick<Quest, 'difficulty' | 'kind'>): number => Math.round(DIFFICULTY_XP[q.difficulty] * MULT[q.kind ?? 'normal']);

/** Server-side normalisation of a client save: quest XP is forced to its legitimate value and skill XP is recomputed from it. */
export function sanitizeState(state: GameState): GameState {
  return recomputeSkills({ ...state, quests: state.quests.map((q) => ({ ...q, xp: expectedQuestXp(q) })) });
}

/** Quests completed during the ISO week containing `now`. Used for guild missions. */
export function completedInWeek(state: GameState, now = new Date()): number {
  const wk = weekKey(now);
  return state.quests.filter((q) => q.status === 'completed' && q.completedAt && weekKey(new Date(q.completedAt)) === wk).length;
}
