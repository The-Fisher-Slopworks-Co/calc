// SPDX-FileCopyrightText: 2026 The Fisher Slopworks Co
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "calc.memory";

const loadInitial = (): number | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
};

export type MemoryApi = {
  value: number | null;
  isEmpty: boolean;
  store: (n: number) => void;
  recall: () => number | null;
  clear: () => void;
};

export const useMemory = (): MemoryApi => {
  const [value, setValue] = useState<number | null>(() => loadInitial());

  useEffect(() => {
    try {
      if (value === null) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      /* ignore */
    }
  }, [value]);

  // Store replaces the slot — never accumulates. The old M+/M- variants were
  // removed because (prev + n) is arithmetic on user-supplied operands, which
  // is what the paywall is supposed to gate.
  const store = useCallback((n: number) => {
    if (!Number.isFinite(n)) return;
    setValue(n);
  }, []);

  const recall = useCallback(() => value, [value]);

  const clear = useCallback(() => setValue(null), []);

  return { value, isEmpty: value === null, store, recall, clear };
};
