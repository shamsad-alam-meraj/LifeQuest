import type { GameState } from '@lifequest/core';
import type { ProviderConfig } from '@lifequest/ai';
import type { Dispatch, SetStateAction } from 'react';
import type { Cloud } from '../lib/cloud';
import type { SyncStatus } from '../store';

export interface Ctx {
  state: GameState;
  setState: Dispatch<SetStateAction<GameState>>;
  ai: ProviderConfig | null;
  setAi: (c: ProviderConfig | null) => void;
  toast: (msg: string) => void;
  ownerId: string;
  cloud: Cloud | null;
  sync: SyncStatus;
  syncNow: () => void;
  email?: string;
  signOut?: () => void;
  requestLogin?: () => void;
}

export const SKIN = ['bg-grad-violet', 'bg-grad-blue', 'bg-grad-teal'] as const;
export const skinFor = (index: number) => SKIN[Math.abs(index) % SKIN.length]!;
