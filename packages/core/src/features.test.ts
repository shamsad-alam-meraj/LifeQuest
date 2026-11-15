import { describe, expect, it } from 'vitest';
import { activityByDay, addAdventure, addSpecialQuest, canClaimDaily, canSpawnBoss, completeQuest, createProfile, emptyState, fallbackAdventure, fallbackQuest, isUnlocked, mergeStates, rerollQuest, rerollsLeft, weekKey } from './index';

const base = () => addAdventure(createProfile(emptyState(), { name: 'T', interests: [], goals: [], dailyQuestLimit: 10 }), 'g', fallbackAdventure('g', ['Guitar']));
const D1 = new Date('2026-03-02T10:00:00Z'); // Monday W10
const done = (s: ReturnType<typeof base>, i: number, at: Date) => { const r = completeQuest(s, s.quests[i]!.id, '', at); if (!r.ok) throw new Error(r.reason); return r.state; };

describe('weekKey', () => {
  it('uses ISO weeks', () => {
    expect(weekKey(new Date('2026-03-02T00:00:00Z'))).toBe('2026-W10');
    expect(weekKey(new Date('2026-03-08T23:59:00Z'))).toBe('2026-W10');
    expect(weekKey(new Date('2026-03-09T00:00:00Z'))).toBe('2026-W11');
    expect(weekKey(new Date('2021-01-03T00:00:00Z'))).toBe('2020-W53');
  });
});

describe('unlock order', () => {
  it('locks later quests until earlier ones are done', () => {
    let s = base();
    expect(isUnlocked(s, s.quests[0]!)).toBe(true);
    expect(isUnlocked(s, s.quests[1]!)).toBe(false);
    expect(completeQuest(s, s.quests[1]!.id)).toEqual({ ok: false, reason: 'locked' });
    s = done(s, 0, D1);
    expect(isUnlocked(s, s.quests[1]!)).toBe(true);
  });
});

describe('daily and boss', () => {
  it('daily is once per day with 1.5x xp, always unlocked', () => {
    const s0 = base();
    const s1 = addSpecialQuest(s0, 'daily', { title: 'd', story: 's', action: 'a', skill: 'Focus', difficulty: 'medium' }, D1);
    const q = s1.quests.at(-1)!;
    expect(q.kind).toBe('daily'); expect(q.xp).toBe(75); expect(isUnlocked(s1, q)).toBe(true);
    expect(canClaimDaily(s1, D1)).toBe(false);
    expect(addSpecialQuest(s1, 'daily', fallbackQuest('daily'), D1)).toBe(s1);
    expect(canClaimDaily(s1, new Date('2026-03-03T10:00:00Z'))).toBe(true);
  });
  it('boss is once per week, at least hard, 3x xp', () => {
    const s1 = addSpecialQuest(base(), 'boss', { title: 'b', story: 's', action: 'a', skill: 'Fitness', difficulty: 'easy' }, D1);
    const q = s1.quests.at(-1)!;
    expect(q.difficulty).toBe('hard'); expect(q.xp).toBe(300);
    expect(canSpawnBoss(s1, new Date('2026-03-08T10:00:00Z'))).toBe(false);
    expect(canSpawnBoss(s1, new Date('2026-03-09T10:00:00Z'))).toBe(true);
  });
});

describe('reroll', () => {
  it('replaces the quest in place, limited per day', () => {
    let s = base();
    const id = s.quests[0]!.id;
    const d = { title: 'New', story: 's', action: 'a', skill: 'Cooking', difficulty: 'hard' as const };
    for (let i = 0; i < 2; i++) { const r = rerollQuest(s, id, d, D1); if (!r.ok) throw new Error(); s = r.state; }
    expect(s.quests[0]!.id).toBe(id); expect(s.quests[0]!.title).toBe('New'); expect(s.quests[0]!.xp).toBe(100);
    expect(rerollsLeft(s, D1)).toBe(0);
    expect(rerollQuest(s, id, d, D1)).toEqual({ ok: false, reason: 'limit' });
    expect(rerollQuest(s, id, d, new Date('2026-03-03T00:00:00Z')).ok).toBe(true);
  });
});

describe('mergeStates', () => {
  it('unions progress from two devices and recomputes xp', () => {
    const start = base();
    const a = done(start, 0, D1);                       // device A finished quest 0
    const b = done(done(start, 0, D1), 1, D1);          // device B finished 0 and 1
    const m = mergeStates(a, b);
    expect(m.quests.filter((q) => q.status === 'completed')).toHaveLength(2);
    expect(m.skills.reduce((n, k) => n + k.xp, 0)).toBe(m.quests[0]!.xp + m.quests[1]!.xp);
    expect(m.achievements.map((x) => x.id)).toContain('first-step');
    expect(mergeStates(m, a).quests.filter((q) => q.status === 'completed')).toHaveLength(2); // idempotent
  });
  it('keeps adventures from both sides and the local profile', () => {
    const a = base(); const b = addAdventure(emptyState(), 'other', fallbackAdventure('other'));
    const m = mergeStates(a, b);
    expect(m.adventures).toHaveLength(2); expect(m.profile?.name).toBe('T');
  });
});

describe('activity', () => {
  it('counts completions per day', () => {
    let s = done(base(), 0, D1); s = done(s, 1, D1);
    expect(activityByDay(s)['2026-03-02']).toBe(2);
  });
});
