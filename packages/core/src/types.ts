export type Difficulty = 'easy' | 'medium' | 'hard' | 'epic';
export type QuestKind = 'normal' | 'daily' | 'boss' | 'custom';
export type QuestStatus = 'active' | 'completed' | 'abandoned';

export interface Skill {
  id: string;
  name: string;
  icon: string;
  xp: number;
}

export interface Quest {
  id: string;
  adventureId: string;
  title: string;
  story: string;
  /** Concrete real-world action. */
  action: string;
  skillId: string;
  difficulty: Difficulty;
  xp: number;
  status: QuestStatus;
  /** Absent means 'normal' (older saves). */
  kind?: QuestKind;
  createdAt: string;
  completedAt?: string;
  /** What the player actually did / learned (the "proof" of real progress). */
  reflection?: string;
}

export interface Adventure {
  id: string;
  title: string;
  premise: string;
  goal: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

export interface Profile {
  name: string;
  interests: string[];
  goals: string[];
  /** Max quests that can be completed for XP per day. Keeps life > game. */
  dailyQuestLimit: number;
  /** Local reminder time, 'HH:MM'. */
  reminderTime?: string;
}

export interface GameState {
  version: 1;
  profile: Profile | null;
  skills: Skill[];
  adventures: Adventure[];
  quests: Quest[];
  achievements: Achievement[];
  /** Day (YYYY-MM-DD) the daily quest was last claimed. */
  lastDailyOn?: string;
  /** ISO week the weekly boss was last spawned. */
  lastBossWeek?: string;
  rerolls?: { day: string; n: number };
  /** Streak shields: auto-save a single missed day. */
  shields?: number;
  frozenDays?: string[];
  shieldAwardedOn?: string;
  shieldsUsed?: number;
  /** Total minutes spent in the focus timer. */
  focusMinutes?: number;
  /** Equipped hero gear by slot. */
  equipped?: Record<string, string>;
}

/** What an AI (or the offline fallback) returns before it becomes game state. */
export interface AdventureDraft {
  title: string;
  premise: string;
  quests: QuestDraft[];
}

export interface QuestDraft {
  title: string;
  story: string;
  action: string;
  skill: string;
  difficulty: Difficulty;
}
