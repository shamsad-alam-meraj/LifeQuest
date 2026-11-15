'use client';

import { emptyState, mergeStates, type GameState } from '@lifequest/core';
import type { ProviderConfig } from '@lifequest/ai';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Cloud } from './lib/cloud';

const AI_KEY = 'lifequest.ai.v1';
export type SyncStatus = 'off' | 'syncing' | 'synced' | 'error';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Game state: always saved locally first (offline-first), and when a cloud is provided it is
 * pulled + merged on start and pushed (debounced) after every change.
 * Saves are namespaced per account so people never see each other's progress on a shared device.
 */
export function useGame(ownerId: string, cloud: Cloud | null) {
  const stateKey = `lifequest.state.v1:${ownerId}`;
  const [state, setState] = useState<GameState>(() => read(stateKey, emptyState()));
  const [ai, setAiState] = useState<ProviderConfig | null>(() => read<ProviderConfig | null>(AI_KEY, null));
  const [sync, setSync] = useState<SyncStatus>(cloud ? 'syncing' : 'off');
  const pulled = useRef(false);
  const lastPushed = useRef('');
  const latest = useRef(state);
  latest.current = state;

  useEffect(() => {
    try { localStorage.setItem(stateKey, JSON.stringify(state)); } catch { /* storage unavailable */ }
  }, [state, stateKey]);

  const push = useCallback(async () => {
    if (!cloud || !pulled.current) return;
    const s = latest.current;
    const snapshot = JSON.stringify(s);
    if (snapshot === lastPushed.current) return setSync('synced');
    setSync('syncing');
    try {
      await cloud.saveGame(s); // the server validates the save and derives level/XP/streak itself
      lastPushed.current = snapshot;
      setSync('synced');
    } catch { setSync('error'); }
  }, [cloud]);

  /** Pull remote, merge into local, then push the merged result. Safe to call repeatedly. */
  const syncNow = useCallback(async () => {
    if (!cloud) return;
    setSync('syncing');
    try {
      const remote = await cloud.loadSave();
      if (remote) setState((local) => { const m = mergeStates(local, remote); latest.current = m; return m; });
      pulled.current = true;
      await push();
    } catch { setSync('error'); }
  }, [cloud, push]);

  useEffect(() => { void syncNow(); }, [syncNow]);

  useEffect(() => {
    if (!cloud || !pulled.current) return;
    const t = setTimeout(() => void push(), 2500);
    return () => clearTimeout(t);
  }, [state, cloud, push]);

  const setAi = useCallback((cfg: ProviderConfig | null) => {
    setAiState(cfg);
    try { cfg ? localStorage.setItem(AI_KEY, JSON.stringify(cfg)) : localStorage.removeItem(AI_KEY); } catch { /* ignore */ }
  }, []);

  return { state, setState, ai, setAi, sync, syncNow };
}
