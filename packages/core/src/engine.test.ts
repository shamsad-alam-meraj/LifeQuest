import { describe, expect, it } from 'vitest';
import { addAdventure, completeQuest, emptyState, fallbackAdventure, levelFromXp, streakDays, xpForLevel, abandonQuest, createProfile } from './index';

const setup = (limit = 3) => {
  let s = createProfile(emptyState(), { name: 'T', interests: ['Guitar'], goals: ['x'], dailyQuestLimit: limit });
  s = addAdventure(s, 'learn guitar', fallbackAdventure('learn guitar', ['Guitar']));
  return s;
};

describe('xp', () => {
  it('level curve is monotonic and inverse-consistent', () => {
    for (let l = 1; l < 30; l++) {
      expect(levelFromXp(xpForLevel(l))).toBe(l);
      expect(xpForLevel(l + 1)).toBeGreaterThan(xpForLevel(l));
    }
    expect(levelFromXp(xpForLevel(5) - 1)).toBe(4);
  });
});

describe('engine', () => {
  it('creates adventure with quests and skills', () => {
    const s = setup();
    expect(s.adventures).toHaveLength(1);
    expect(s.quests).toHaveLength(5);
    expect(s.skills.map((k) => k.id)).toContain('guitar');
  });

  it('completing a quest awards XP to its skill and unlocks First Step', () => {
    const s = setup();
    const q = s.quests[0]!;
    const r = completeQuest(s, q.id, 'did it');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.skills.find((k) => k.id === q.skillId)!.xp).toBe(q.xp);
    expect(r.newAchievements).toContain('First Step');
    expect(r.state.quests[0]!.reflection).toBe('did it');
  });

  it('cannot complete twice or exceed the daily limit', () => {
    const s = setup(1);
    const now = new Date('2026-01-01T10:00:00Z');
    const r1 = completeQuest(s, s.quests[0]!.id, '', now);
    if (!r1.ok) throw new Error('expected ok');
    expect(completeQuest(r1.state, s.quests[0]!.id, '', now)).toEqual({ ok: false, reason: 'not-active' });
    expect(completeQuest(r1.state, s.quests[1]!.id, '', now)).toEqual({ ok: false, reason: 'daily-limit' });
    const next = completeQuest(r1.state, s.quests[1]!.id, '', new Date('2026-01-02T10:00:00Z'));
    expect(next.ok).toBe(true);
  });

  it('abandon marks active quest only', () => {
    const s = abandonQuest(setup(), setup().quests[0]!.id);
    expect(s.quests.every((q) => q.status === 'active')).toBe(true); // different ids, no-op
    const s2 = setup();
    expect(abandonQuest(s2, s2.quests[0]!.id).quests[0]!.status).toBe('abandoned');
  });

  it('computes streaks', () => {
    let s = setup(5);
    for (let i = 0; i < 3; i++) {
      const r = completeQuest(s, s.quests[i]!.id, '', new Date(`2026-03-0${i + 1}T09:00:00Z`));
      if (!r.ok) throw new Error('fail');
      s = r.state;
    }
    expect(streakDays(s, new Date('2026-03-03T20:00:00Z'))).toBe(3);
    expect(streakDays(s, new Date('2026-03-05T20:00:00Z'))).toBe(0);
  });
});
