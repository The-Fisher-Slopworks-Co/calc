// SPDX-FileCopyrightText: 2026 The Fisher Slopworks Co
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "calc.usage";
const MONTHLY_LIMIT = 1000;

type UsageState = { period: string; count: number };

// Calendar-month bucket key. A new month resets the meter.
const currentPeriod = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}`;
};

const loadInitial = (): UsageState => {
  const fresh: UsageState = { period: currentPeriod(), count: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.period === "string" &&
      typeof parsed.count === "number"
    ) {
      return parsed.period === fresh.period
        ? { period: parsed.period, count: parsed.count }
        : fresh;
    }
  } catch {
    /* ignore */
  }
  return fresh;
};

export type UsageApi = {
  count: number;
  limit: number;
  fraction: number;
  record: () => void;
};

export const useUsage = (limit = MONTHLY_LIMIT): UsageApi => {
  const [state, setState] = useState<UsageState>(() => loadInitial());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const record = useCallback(() => {
    setState((s) => {
      const period = currentPeriod();
      return period === s.period
        ? { period, count: s.count + 1 }
        : { period, count: 1 };
    });
  }, []);

  const fraction = limit > 0 ? Math.min(1, state.count / limit) : 0;

  return { count: state.count, limit, fraction, record };
};
