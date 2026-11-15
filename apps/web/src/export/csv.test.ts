import { describe, expect, it } from 'vitest';
import { addAdventure, completeQuest, createProfile, emptyState, fallbackAdventure } from '@lifequest/core';
import { QUEST_HEADER, questRows, toCsv } from './csv';

describe('csv export', () => {
  it('quotes cells, escapes quotes, uses CRLF and a UTF-8 BOM', () => {
    const out = toCsv([['a', 'b "c"'], ['x,y', 'line\nbreak']]);
    expect(out.startsWith('﻿')).toBe(true);
    expect(out).toBe('﻿"a","b ""c"""\r\n"x,y","line\nbreak"\r\n');
  });
  it('neutralises spreadsheet formula injection', () => {
    for (const bad of ['=SUM(A1)', '+1', '-2', '@cmd', '\tx']) expect(toCsv([[bad]])).toContain(`"'${bad}"`);
    expect(toCsv([['safe=ok']])).toContain('"safe=ok"');
  });
  it('exports quests with a header, newest completions first', () => {
    let s = addAdventure(createProfile(emptyState(), { name: 'T', interests: [], goals: [], dailyQuestLimit: 9 }), 'g', fallbackAdventure('g'));
    for (const [i, day] of ['2026-03-01', '2026-03-02'].entries()) { const r = completeQuest(s, s.quests[i]!.id, i ? '=HYPERLINK("x")' : 'ok', new Date(`${day}T10:00:00Z`)); if (!r.ok) throw new Error(r.reason); s = r.state; }
    const rows = questRows(s);
    expect(rows[0]).toEqual(QUEST_HEADER);
    expect(rows).toHaveLength(6);
    expect(rows[1]![0]).toBe('2026-03-02');
    expect(toCsv(rows)).toContain(`"'=HYPERLINK(""x"")"`);
  });
});
