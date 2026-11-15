import { describe, expect, it } from 'vitest';
import { type GameState, completedInWeek, expectedQuestXp, sanitizeState, ACHIEVEMENTS, addAdventure, addCustomQuest, addFocusMinutes, applyShields, awardShield, completeQuest, createProfile, emptyState, equipGear, fallbackAdventure, mergeStates, streakDays, unlockedGear, weeklyXp } from './index';

const base = () => addAdventure(addAdventure(createProfile(emptyState(), { name: 'T', interests: [], goals: [], dailyQuestLimit: 20 }), 'g', fallbackAdventure('g')), 'h', fallbackAdventure('h'));
const day = (n: number) => new Date(Date.UTC(2026, 2, n, 10)); // March n 2026
function play(s: ReturnType<typeof base>, days: number[]) {
  let st = s;
  days.forEach((d, i) => { const q = st.quests.filter((x) => x.status === 'active')[0]!; const r = completeQuest(st, q.id, '', day(d)); if (!r.ok) throw new Error(`${i}:${r.reason}`); st = r.state; });
  return st;
}

describe('shields', () => {
  it('earns one at a 7-day streak, once per day', () => {
    const s = play(base(), [1, 2, 3, 4, 5, 6]);
    expect(s.shields ?? 0).toBe(0);
    const q = s.quests.find((x) => x.status === 'active')!;
    const r = completeQuest(s, q.id, '', day(7));
    if (!r.ok) throw new Error();
    expect(r.shieldEarned).toBe(true); expect(r.state.shields).toBe(1);
    expect(awardShield(r.state, day(7)).earned).toBe(false);
  });
  it('bridges exactly one missed day and keeps the streak', () => {
    let s: GameState = { ...play(base(), [1, 2]), shields: 1 };
    s = applyShields(s, day(4)); // missed Mar 3
    expect(s.shields).toBe(0); expect(s.frozenDays).toEqual(['2026-03-03']); expect(s.shieldsUsed).toBe(1);
    expect(streakDays(s, day(4))).toBe(3);
  });
  it('does nothing without shields or when the streak is already broken', () => {
    const s = play(base(), [1, 2]);
    expect(applyShields(s, day(4))).toBe(s);
    expect(applyShields({ ...s, shields: 1 }, day(8)).shields).toBe(1); // two+ days missed: nothing to save
  });
});

describe('gear', () => {
  it('is locked by level and toggles per slot', () => {
    expect(unlockedGear(1)).toHaveLength(0);
    expect(equipGear(emptyState(), 'crown', 5)).toEqual(emptyState());
    let s = equipGear(emptyState(), 'wizard', 6);
    expect(s.equipped).toEqual({ head: 'wizard' });
    s = equipGear(s, 'crown', 9); expect(s.equipped).toEqual({ head: 'crown' });
    s = equipGear(s, 'crown', 9); expect(s.equipped).toEqual({});
  });
});

describe('custom quests, focus, insights', () => {
  it('custom quests give half xp, are never locked and can unlock an achievement', () => {
    let s = addCustomQuest(base(), { title: 'Write a poem', action: 'Write 10 lines', skill: 'Writing', difficulty: 'medium' }, day(1));
    const q = s.quests.at(-1)!;
    expect(q.xp).toBe(25); expect(q.kind).toBe('custom');
    const r = completeQuest(s, q.id, '', day(1)); if (!r.ok) throw new Error(r.reason);
    expect(r.newAchievements).toContain('Quest Maker');
    expect(addCustomQuest(s, { title: ' ', action: 'x', skill: 'a', difficulty: 'easy' })).toBe(s);
  });
  it('focus minutes accumulate (capped per session) and unlock Deep Focus', () => {
    let s = base();
    s = addFocusMinutes(s, 60); s = addFocusMinutes(s, 999); s = addFocusMinutes(s, -5);
    expect(s.focusMinutes).toBe(240);
    expect(ACHIEVEMENTS.find((a) => a.id === 'deep-focus')!.check(s)).toBe(true);
  });
  it('buckets XP by week', () => {
    const s = play(base(), [2, 3]); // Mon+Tue of the week of Mar 2
    const w = weeklyXp(s, 3, day(5));
    expect(w).toHaveLength(3);
    expect(w[2]!.label).toBe('03-02'); expect(w[2]!.xp).toBeGreaterThan(0); expect(w[0]!.xp).toBe(0);
  });
  it('merge keeps shields, frozen days and gear from both devices', () => {
    const a = { ...base(), shields: 1, frozenDays: ['2026-03-01'], equipped: { head: 'wizard' } };
    const b = { ...base(), shields: 2, frozenDays: ['2026-03-02'], focusMinutes: 30 };
    const m = mergeStates(a, b);
    expect(m.shields).toBe(2); expect(m.frozenDays).toHaveLength(2); expect(m.focusMinutes).toBe(30); expect(m.equipped).toEqual({ head: 'wizard' });
  });
});

describe('server-side verification helpers', () => {
  it('forces quest xp to its legitimate value and recomputes skills', () => {
    const s = play(base(), [2, 3]);
    const cheated: GameState = { ...s, quests: s.quests.map((q) => ({ ...q, xp: 99999 })) };
    const clean = sanitizeState(cheated);
    expect(clean.quests.every((q) => q.xp === expectedQuestXp(q))).toBe(true);
    expect(clean.skills.reduce((n, k) => n + k.xp, 0)).toBe(clean.quests.filter((q) => q.status === 'completed').reduce((n, q) => n + q.xp, 0));
  });
  it('counts quests completed in the current ISO week only', () => {
    const s = play(base(), [2, 3, 10]); // Mar 2,3 are W10; Mar 10 is W11
    expect(completedInWeek(s, day(4))).toBe(2);
    expect(completedInWeek(s, day(11))).toBe(1);
  });
});
