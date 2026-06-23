// SPDX-FileCopyrightText: 2026 The Fisher Slopworks Co
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useEffect, useRef } from "react";
import { useTranslation } from "../i18n/LanguageProvider.tsx";
import type { TranslationKey } from "../i18n/translations.ts";

type Props = { onClose: () => void };

type Shortcut = {
  keys: string[];
  labelKey: TranslationKey;
};

const INPUT_SHORTCUTS: Shortcut[] = [
  { keys: ["0", "…", "9"], labelKey: "shortcuts.digits" },
  { keys: ["."], labelKey: "shortcuts.dot" },
  { keys: ["+", "−", "×", "÷"], labelKey: "shortcuts.operators" },
  { keys: ["%"], labelKey: "shortcuts.percent" },
];

const ACTION_SHORTCUTS: Shortcut[] = [
  { keys: ["Enter"], labelKey: "shortcuts.equals" },
  { keys: ["Backspace"], labelKey: "shortcuts.backspace" },
  { keys: ["Esc"], labelKey: "shortcuts.clear" },
  { keys: ["?"], labelKey: "shortcuts.help" },
];

export const ShortcutsOverlay = ({ onClose }: Props) => {
  const { t } = useTranslation();
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "?") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      <article
        className="relative w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto
                   rounded-2xl bg-ink-800 border border-zinc-800
                   p-6 sm:p-8 shadow-monolith animate-card-in"
      >
        <header className="flex items-center justify-between mb-6 gap-3">
          <h2
            id="shortcuts-title"
            className="text-lg font-semibold text-zinc-100 font-mono"
          >
            {t("shortcuts.title")}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t("shortcuts.close")}
            className="w-7 h-7 rounded-full border border-zinc-800
                       text-zinc-500 text-base leading-none
                       hover:text-zinc-100 hover:border-zinc-700 transition-colors
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            ×
          </button>
        </header>

        <section className="mb-6">
          <h3 className="text-[10px] uppercase tracking-[0.14em] text-zinc-500 font-mono mb-3">
            {t("shortcuts.section.input")}
          </h3>
          <dl className="grid grid-cols-1 gap-2">
            {INPUT_SHORTCUTS.map((s) => (
              <ShortcutRow key={s.labelKey} shortcut={s} t={t} />
            ))}
          </dl>
        </section>

        <section>
          <h3 className="text-[10px] uppercase tracking-[0.14em] text-zinc-500 font-mono mb-3">
            {t("shortcuts.section.actions")}
          </h3>
          <dl className="grid grid-cols-1 gap-2">
            {ACTION_SHORTCUTS.map((s) => (
              <ShortcutRow key={s.labelKey} shortcut={s} t={t} />
            ))}
          </dl>
        </section>
      </article>
    </div>
  );
};

const ShortcutRow = ({
  shortcut,
  t,
}: {
  shortcut: Shortcut;
  t: (k: TranslationKey) => string;
}) => (
  <div className="flex items-center justify-between gap-4 py-1">
    <dt className="text-sm text-zinc-300">{t(shortcut.labelKey)}</dt>
    <dd className="flex items-center gap-1.5 shrink-0">
      {shortcut.keys.map((k, i) => (
        <Kbd key={i}>{k}</Kbd>
      ))}
    </dd>
  </div>
);

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd
    className="inline-flex min-w-[28px] h-7 items-center justify-center
               px-2 rounded-md border border-zinc-700 bg-ink-700
               text-xs font-mono text-zinc-200 tabular-nums
               shadow-[0_1px_0_rgb(255_255_255_/_3%)]"
  >
    {children}
  </kbd>
);
