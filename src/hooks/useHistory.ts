// SPDX-FileCopyrightText: 2026 The Fisher Slopworks Co
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "calc.history";
const MAX_ENTRIES = 50;

export type HistoryEntry = {
  id: number;
  expression: string;
  at: number;
};

const loadInitial = (): HistoryEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e): e is HistoryEntry =>
          typeof e === "object" &&
          e !== null &&
          typeof e.id === "number" &&
          typeof e.expression === "string" &&
          typeof e.at === "number",
      )
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
};

export type HistoryApi = {
  entries: HistoryEntry[];
  add: (expression: string) => void;
  clear: () => void;
};

export const useHistory = (): HistoryApi => {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => loadInitial());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      /* ignore */
    }
  }, [entries]);

  const add = useCallback((expression: string) => {
    if (!expression) return;
    setEntries((prev) => {
      const entry: HistoryEntry = {
        id: Date.now() + Math.random(),
        expression,
        at: Date.now(),
      };
      return [entry, ...prev].slice(0, MAX_ENTRIES);
    });
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  return { entries, add, clear };
};
