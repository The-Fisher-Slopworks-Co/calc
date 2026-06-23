// SPDX-FileCopyrightText: 2026 The Fisher Slopworks Co
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useCallback, useEffect, useRef, useState } from "react";
import { Calculator } from "./components/Calculator.tsx";
import { HistoryPanel } from "./components/HistoryPanel.tsx";
import { LanguageSwitcher } from "./components/LanguageSwitcher.tsx";
import { Paywall } from "./components/Paywall.tsx";
import { ShortcutsOverlay } from "./components/ShortcutsOverlay.tsx";
import { useToast } from "./components/ToastHost.tsx";
import { UsageMeter } from "./components/UsageMeter.tsx";
import { useCalculator } from "./hooks/useCalculator.ts";
import { useHistory } from "./hooks/useHistory.ts";
import { useMemory } from "./hooks/useMemory.ts";
import { useSubscription } from "./hooks/useSubscription.ts";
import { useUsage } from "./hooks/useUsage.ts";
import { useTranslation } from "./i18n/LanguageProvider.tsx";

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

const App = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const history = useHistory();
  const memory = useMemory();
  const subscription = useSubscription();
  const usage = useUsage();

  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const shortcutsRef = useRef(shortcutsOpen);
  shortcutsRef.current = shortcutsOpen;

  const onEvaluate = useCallback(
    (expression: string) => {
      history.add(expression);
      usage.record();
    },
    [history, usage],
  );

  const isInputBlocked = useCallback(() => shortcutsRef.current, []);

  const calc = useCalculator({
    onEvaluate,
    isInputBlocked,
    isUnlocked: () => subscription.isActive,
    isOverLimit: () => usage.count >= usage.limit,
    onLimitReached: () => toast(t("usage.limitReached")),
  });

  const onPaid = useCallback(() => {
    subscription.activate(MONTH_MS);
    calc.reveal();
  }, [subscription.activate, calc.reveal]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?" && !calc.isLocked && !shortcutsRef.current) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [calc.isLocked]);

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10
                   bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgb(6_182_212_/_0.08),transparent_60%)]"
      />

      <LanguageSwitcher />
      {subscription.isActive && <UsageMeter usage={usage} />}

      <main className="min-h-screen flex flex-col items-center px-6 py-12 gap-6 sm:gap-8">
        <header className="flex items-center gap-3 text-sm">
          <span className="font-mono text-accent">[</span>
          <span className="font-mono tracking-tight text-zinc-100">calc</span>
          <span className="font-mono text-accent">]</span>
          <span
            className="ml-2 px-2 py-0.5 rounded-full border border-zinc-800
                       text-[10px] uppercase tracking-[0.12em] text-zinc-500 font-mono"
          >
            v1.0.0
          </span>
          <button
            type="button"
            onClick={() => setShortcutsOpen(true)}
            aria-label={t("shortcuts.toggle")}
            className="ml-1 w-6 h-6 rounded-full border border-zinc-800
                       text-zinc-500 text-[11px] font-mono leading-none
                       hover:text-zinc-100 hover:border-zinc-700
                       transition-colors
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            ?
          </button>
        </header>

        <div className="w-full flex flex-col items-center gap-4">
          <Calculator calc={calc} memory={memory} onToast={toast} />
          <HistoryPanel history={history} />
        </div>
      </main>

      {calc.isLocked && <Paywall onPaid={onPaid} />}
      {shortcutsOpen && (
        <ShortcutsOverlay onClose={() => setShortcutsOpen(false)} />
      )}
    </>
  );
};

export default App;
