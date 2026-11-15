import { ACHIEVEMENTS } from './achievements';
import { completedOn, dayKey } from './stats';
import type { Adventure, AdventureDraft, GameState, Profile, Quest } from './types';
import { DIFFICULTY_XP } from './xp';
import { awardShield, isUnlocked } from './features';
import { ensureSkill, newId } from './skills';

export const emptyState = (): GameState => ({
  version: 1,
  profile: null,
  skills: [],
  adventures: [],
  quests: [],
  achievements: [],
});

export function createProfile(state: GameState, profile: Profile): GameState {
  return { ...state, profile };
}

/** Turn an AI/offline draft into persisted state: one adventure, its quests, new skills as needed. */
export function addAdventure(state: GameState, goal: string, draft: AdventureDraft, now = new Date()): GameState {
  const adventure: Adventure = {
    id: newId('adv'),
    title: draft.title,
    premise: draft.premise,
    goal,
    createdAt: now.toISOString(),
  };
  let skills = state.skills;
  const quests: Quest[] = draft.quests.map((d) => {
    const r = ensureSkill(skills, d.skill);
    skills = r.skills;
    return {
      id: newId('q'),
      adventureId: adventure.id,
      title: d.title,
      story: d.story,
      action: d.action,
      skillId: r.skill.id,
      difficulty: d.difficulty,
      xp: DIFFICULTY_XP[d.difficulty],
      status: 'active',
      kind: 'normal',
      createdAt: now.toISOString(),
    };
  });
  return { ...state, skills, adventures: [adventure, ...state.adventures], quests: [...state.quests, ...quests] };
}

export type CompleteResult =
  | { ok: true; state: GameState; xp: number; newAchievements: string[]; shieldEarned: boolean }
  | { ok: false; reason: 'not-found' | 'not-active' | 'daily-limit' | 'locked' };

export function completeQuest(state: GameState, questId: string, reflection?: string, now = new Date()): CompleteResult {
  const quest = state.quests.find((q) => q.id === questId);
  if (!quest) return { ok: false, reason: 'not-found' };
  if (quest.status !== 'active') return { ok: false, reason: 'not-active' };
  if (!isUnlocked(state, quest)) return { ok: false, reason: 'locked' };
  const limit = state.profile?.dailyQuestLimit ?? 3;
  if (completedOn(state, dayKey(now.toISOString())).length >= limit) return { ok: false, reason: 'daily-limit' };

  let next: GameState = {
    ...state,
    quests: state.quests.map((q) =>
      q.id === questId ? { ...q, status: 'completed', completedAt: now.toISOString(), reflection: reflection?.trim() || undefined } : q,
    ),
    skills: state.skills.map((k) => (k.id === quest.skillId ? { ...k, xp: k.xp + quest.xp } : k)),
  };
  const shield = awardShield(next, now);
  next = shield.state;
  const have = new Set(next.achievements.map((a) => a.id));
  const unlocked = ACHIEVEMENTS.filter((a) => !have.has(a.id) && a.check(next));
  next = {
    ...next,
    achievements: [
      ...next.achievements,
      ...unlocked.map((a) => ({ id: a.id, title: a.title, description: a.description, icon: a.icon, unlockedAt: now.toISOString() })),
    ],
  };
  return { ok: true, state: next, xp: quest.xp, newAchievements: unlocked.map((a) => a.title), shieldEarned: shield.earned };
}

export function abandonQuest(state: GameState, questId: string): GameState {
  return { ...state, quests: state.quests.map((q) => (q.id === questId && q.status === 'active' ? { ...q, status: 'abandoned' } : q)) };
}
