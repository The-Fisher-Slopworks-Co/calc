// SPDX-FileCopyrightText: 2026 The Fisher Slopworks Co
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "calc.subscription";

// Stored value is the expiry timestamp in ms. A pass that has already lapsed is
// treated as no pass at all.
const loadInitial = (): number | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const expiry = Number(raw);
    if (!Number.isFinite(expiry) || expiry <= Date.now()) return null;
    return expiry;
  } catch {
    return null;
  }
};

export type SubscriptionApi = {
  isActive: boolean;
  expiresAt: number | null;
  activate: (durationMs: number) => void;
};

export const useSubscription = (): SubscriptionApi => {
  const [expiresAt, setExpiresAt] = useState<number | null>(() => loadInitial());

  useEffect(() => {
    try {
      if (expiresAt === null) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, String(expiresAt));
    } catch {
      /* ignore */
    }
  }, [expiresAt]);

  // Flip back to locked the instant the pass lapses while the tab is open, so
  // the next evaluation raises the paywall again without a reload.
  useEffect(() => {
    if (expiresAt === null) return;
    const ms = expiresAt - Date.now();
    if (ms <= 0) {
      setExpiresAt(null);
      return;
    }
    const id = window.setTimeout(() => setExpiresAt(null), ms);
    return () => window.clearTimeout(id);
  }, [expiresAt]);

  const activate = useCallback((durationMs: number) => {
    setExpiresAt(Date.now() + durationMs);
  }, []);

  return { isActive: expiresAt !== null, expiresAt, activate };
};
