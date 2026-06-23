// SPDX-FileCopyrightText: 2026 The Fisher Slopworks Co
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useTranslation } from "../i18n/LanguageProvider.tsx";
import type { MemoryApi } from "../hooks/useMemory.ts";
import { formatNumber } from "../lib/format.ts";

type Props = {
  memory: MemoryApi;
  currentNumber: number;
  isLocked: boolean;
  onRecall: (n: number) => void;
  onAfterAction?: (msg?: string) => void;
};

export const MemoryBar = ({
  memory,
  currentNumber,
  isLocked,
  onRecall,
  onAfterAction,
}: Props) => {
  const { t } = useTranslation();

  const handleRecall = () => {
    const v = memory.recall();
    if (v === null) {
      onAfterAction?.(t("memory.toast.empty"));
      return;
    }
    onRecall(v);
  };

  const handleStore = () => {
    memory.store(currentNumber);
    onAfterAction?.(t("memory.toast.stored"));
  };

  const handleClear = () => {
    memory.clear();
    onAfterAction?.(t("memory.toast.cleared"));
  };

  return (
    <div
      className="flex items-center justify-between gap-3 py-2.5
                 border-b border-zinc-800/80 text-[11px] font-mono"
      role="group"
      aria-label={t("memory.indicator")}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={
            "uppercase tracking-[0.12em] " +
            (memory.isEmpty ? "text-zinc-700" : "text-accent")
          }
        >
          {t("memory.indicator")}
        </span>
        <span
          className={
            "tabular-nums truncate " +
            (memory.isEmpty ? "text-zinc-700 italic" : "text-zinc-300")
          }
        >
          {memory.isEmpty ? t("memory.empty") : formatNumber(memory.value)}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <MemBtn
          onClick={handleClear}
          aria-label={t("memory.aria.clear")}
          disabled={memory.isEmpty || isLocked}
        >
          MC
        </MemBtn>
        <MemBtn
          onClick={handleStore}
          aria-label={t("memory.aria.store")}
          disabled={isLocked}
        >
          MS
        </MemBtn>
        <MemBtn
          onClick={handleRecall}
          aria-label={t("memory.aria.recall")}
          disabled={isLocked}
        >
          MR
        </MemBtn>
      </div>
    </div>
  );
};

const MemBtn = ({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className="px-2 py-1 rounded border border-zinc-800/80
               text-zinc-400 bg-transparent
               hover:bg-ink-700 hover:border-zinc-700 hover:text-zinc-100
               disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent
               transition-colors
               focus:outline-none focus-visible:ring-2
               focus-visible:ring-accent focus-visible:ring-offset-2
               focus-visible:ring-offset-ink-900"
    {...rest}
  >
    {children}
  </button>
);
