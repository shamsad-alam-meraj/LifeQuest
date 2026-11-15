import type { GameState } from '@lifequest/core';
import { createGuildAction, guildAction, joinGuildAction, leaveGuildAction, loadSaveAction, recentLoginsAction, saveGameAction } from '../app/actions';
import type { Result } from './types';

export class CloudError extends Error {}

async function unwrap<T>(p: Promise<Result<T>>): Promise<T> {
  let r: Result<T>;
  try { r = await p; } catch { throw new CloudError('Network error'); }
  if (!r.ok) throw new CloudError(r.error);
  return r.data;
}

/** Client-side facade over the server actions, so UI code just awaits values and catches CloudError. */
export const cloud = {
  loadSave: () => unwrap(loadSaveAction()),
  saveGame: (state: GameState) => unwrap(saveGameAction(state)),
  guild: () => unwrap(guildAction()),
  createGuild: (name: string) => unwrap(createGuildAction(name)),
  joinGuild: (code: string) => unwrap(joinGuildAction(code)),
  leaveGuild: () => unwrap(leaveGuildAction()),
  recentLogins: () => unwrap(recentLoginsAction()),
};
export type Cloud = typeof cloud;
