// SPDX-FileCopyrightText: 2026 The Fisher Slopworks Co
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useTranslation } from "../i18n/LanguageProvider.tsx";
import type { UsageApi } from "../hooks/useUsage.ts";

type Props = { usage: UsageApi };

export const UsageMeter = ({ usage }: Props) => {
  const { t } = useTranslation();
  const atLimit = usage.fraction >= 1;
  const pct = Math.round(usage.fraction * 100);

  return (
    <div
      aria-label={t("usage.label")}
      className="absolute top-5 left-5 sm:top-6 sm:left-6 z-10
                 w-32 sm:w-36 flex flex-col gap-1.5 font-mono"
    >
      <div className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.12em]">
        <span className="text-zinc-500">{t("usage.label")}</span>
        <span
          className={
            "tabular-nums " + (atLimit ? "text-rose-400" : "text-zinc-400")
          }
        >
          {usage.count} / {usage.limit}
        </span>
      </div>
      <div
        className="h-1.5 rounded-full bg-ink-700 overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={usage.limit}
        aria-valuenow={usage.count}
      >
        <div
          className={
            "h-full rounded-full transition-[width] duration-300 " +
            (atLimit ? "bg-rose-500" : "bg-accent")
          }
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
