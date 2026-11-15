import type { GameState } from './types';
import { streakDays } from './stats';
import { levelFromXp } from './xp';

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  check: (s: GameState) => boolean;
}

const done = (s: GameState) => s.quests.filter((q) => q.status === 'completed');

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-step', title: 'First Step', description: 'Complete your first quest.', icon: '👣', check: (s) => done(s).length >= 1 },
  { id: 'ten-deeds', title: 'Ten Deeds', description: 'Complete 10 quests.', icon: '📜', check: (s) => done(s).length >= 10 },
  { id: 'fifty-deeds', title: 'Hero of the Realm', description: 'Complete 50 quests.', icon: '🏆', check: (s) => done(s).length >= 50 },
  { id: 'three-day', title: 'Momentum', description: 'Play 3 days in a row.', icon: '🔥', check: (s) => streakDays(s) >= 3 },
  { id: 'week', title: 'Steadfast', description: 'Play 7 days in a row.', icon: '⚔️', check: (s) => streakDays(s) >= 7 },
  { id: 'reflective', title: 'Chronicler', description: 'Write 5 reflections on what you did.', icon: '🖋️', check: (s) => done(s).filter((q) => q.reflection?.trim()).length >= 5 },
  { id: 'hard-won', title: 'Hard Won', description: 'Complete a hard or epic quest.', icon: '💎', check: (s) => done(s).some((q) => q.difficulty === 'hard' || q.difficulty === 'epic') },
  { id: 'polymath', title: 'Polymath', description: 'Earn XP in 3 different skills.', icon: '🌳', check: (s) => s.skills.filter((k) => k.xp > 0).length >= 3 },
  { id: 'skill-5', title: 'Specialist', description: 'Reach level 5 in any skill.', icon: '🎯', check: (s) => s.skills.some((k) => levelFromXp(k.xp) >= 5) },
  { id: 'deep-focus', title: 'Deep Focus', description: 'Spend 120 minutes in the focus timer.', icon: '⏱️', check: (s) => (s.focusMinutes ?? 0) >= 120 },
  { id: 'creator', title: 'Quest Maker', description: 'Complete a quest you wrote yourself.', icon: '🛠️', check: (s) => done(s).some((q) => q.kind === 'custom') },
  { id: 'shielded', title: 'Saved by the Shield', description: 'Let a streak shield rescue a missed day.', icon: '🛡️', check: (s) => (s.shieldsUsed ?? 0) >= 1 },
];
