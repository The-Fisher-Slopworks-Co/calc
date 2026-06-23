// SPDX-FileCopyrightText: 2026 The Fisher Slopworks Co
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useEffect, useState } from "react";
import { useTranslation } from "../i18n/LanguageProvider.tsx";
import type { HistoryApi, HistoryEntry } from "../hooks/useHistory.ts";
import type { TranslationKey } from "../i18n/translations.ts";

type Props = { history: HistoryApi };
type Translator = (k: TranslationKey) => string;

const LOCKED = "•••";

const useNow = (intervalMs = 60_000): number => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
};

const formatRelative = (at: number, now: number, t: Translator): string => {
  const diff = Math.max(0, now - at);
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return t("history.justNow");
  if (hours < 1) return t("history.minutesAgo").replace("{n}", String(minutes));
  if (days < 1) return t("history.hoursAgo").replace("{n}", String(hours));
  return t("history.daysAgo").replace("{n}", String(days));
};

export const HistoryPanel = ({ history }: Props) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const now = useNow();

  const count = history.entries.length;
  const countLabel =
    count === 1 ? t("history.entry") : t("history.entries");

  return (
    <section
      className="w-full max-w-sm rounded-2xl bg-ink-800 border border-zinc-800/80
                 shadow-monolith overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="history-body"
        aria-label={t("history.toggle")}
        className="w-full flex items-center justify-between gap-3 px-5 py-3.5
                   text-left transition-colors hover:bg-ink-700/50
                   focus:outline-none focus-visible:ring-2
                   focus-visible:ring-accent focus-visible:ring-inset"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className={
              "inline-block w-1.5 h-1.5 rounded-full " +
              (count > 0 ? "bg-accent" : "bg-zinc-700")
            }
          />
          <span className="text-sm font-medium text-zinc-100">
            {t("history.title")}
          </span>
          <span className="text-xs font-mono tabular-nums text-zinc-500">
            {count} {countLabel}
          </span>
        </div>
        <Chevron open={open} />
      </button>

      {open && (
        <div
          id="history-body"
          className="border-t border-zinc-800/80"
        >
          {count === 0 ? (
            <p className="px-5 py-6 text-xs text-zinc-500 text-center">
              {t("history.empty")}
            </p>
          ) : (
            <>
              <ol className="max-h-72 overflow-y-auto divide-y divide-zinc-900">
                {history.entries.map((e) => (
                  <HistoryRow key={e.id} entry={e} now={now} />
                ))}
              </ol>
              <div className="flex items-center justify-end gap-2 px-5 py-2.5 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={history.clear}
                  className="text-[11px] font-mono uppercase tracking-[0.12em]
                             text-zinc-500 hover:text-zinc-200 transition-colors
                             focus:outline-none focus-visible:text-accent-strong"
                >
                  {t("history.clear")}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
};

const HistoryRow = ({ entry, now }: { entry: HistoryEntry; now: number }) => {
  const { t } = useTranslation();
  return (
    <li className="flex items-center gap-3 px-5 py-2.5 text-xs font-mono">
      <span className="flex-1 truncate text-zinc-300 tabular-nums">
        {entry.expression} <span className="text-zinc-600">=</span>{" "}
        <span className="text-accent-strong tracking-wider">{LOCKED}</span>
      </span>
      <time
        dateTime={new Date(entry.at).toISOString()}
        className="shrink-0 text-[10px] text-zinc-600 tabular-nums"
      >
        {formatRelative(entry.at, now, t)}
      </time>
    </li>
  );
};

const Chevron = ({ open }: { open: boolean }) => (
  <svg
    aria-hidden="true"
    width="12"
    height="12"
    viewBox="0 0 12 12"
    className={
      "text-zinc-500 transition-transform duration-150 " +
      (open ? "rotate-180" : "")
    }
  >
    <path
      d="M3 4.5l3 3 3-3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);
