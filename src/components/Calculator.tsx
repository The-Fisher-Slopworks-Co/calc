// SPDX-FileCopyrightText: 2026 The Fisher Slopworks Co
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useTranslation } from "../i18n/LanguageProvider.tsx";
import type { CalculatorApi, Operator } from "../hooks/useCalculator.ts";
import type { MemoryApi } from "../hooks/useMemory.ts";
import { MemoryBar } from "./MemoryBar.tsx";

type Props = {
  calc: CalculatorApi;
  memory: MemoryApi;
  onToast?: (msg: string) => void;
};

const OPS: { op: Operator; label: string }[] = [
  { op: "/", label: "÷" },
  { op: "*", label: "×" },
  { op: "-", label: "−" },
  { op: "+", label: "+" },
];

export const Calculator = ({ calc, memory, onToast }: Props) => {
  const { t } = useTranslation();

  const opBtn = (op: Operator, label: string) => (
    <button
      type="button"
      onClick={() => calc.setOperator(op)}
      className={`key key--op ${calc.armedOperator === op ? "is-armed" : ""}`}
    >
      {label}
    </button>
  );

  const numBtn = (n: string, className = "key") => (
    <button type="button" className={className} onClick={() => calc.inputDigit(n)}>
      {n}
    </button>
  );

  return (
    <section
      aria-label={t("aria.calculator")}
      className="w-full max-w-sm rounded-2xl bg-ink-800 border border-zinc-800/80
                 p-6 shadow-monolith relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px
                   bg-gradient-to-r from-transparent via-zinc-700 to-transparent"
      />

      <div
        className="min-h-[120px] flex flex-col justify-end text-right pb-5"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center justify-between h-4">
          <span
            aria-hidden="true"
            className={
              "text-[10px] font-mono uppercase tracking-[0.14em] " +
              (memory.isEmpty ? "text-transparent" : "text-accent")
            }
          >
            M
          </span>
          <div className="font-mono text-xs text-zinc-600 truncate tabular-nums">
            {calc.history || " "}
          </div>
        </div>
        <div className="font-mono text-5xl font-light text-zinc-100 mt-2
                        tracking-tight break-all tabular-nums">
          {calc.display}
        </div>
      </div>

      <MemoryBar
        memory={memory}
        currentNumber={calc.currentNumber}
        isLocked={calc.isLocked}
        onRecall={calc.loadValue}
        onAfterAction={(msg) => msg && onToast?.(msg)}
      />

      <div
        role="group"
        aria-label={t("aria.keypad")}
        className="grid grid-cols-4 gap-2 mt-4"
      >
        <button type="button" className="key key--ghost" onClick={calc.clearAll}>
          AC
        </button>
        <button type="button" className="key key--ghost" onClick={calc.toggleSign}>
          +/−
        </button>
        <button type="button" className="key key--ghost" onClick={calc.percent}>
          %
        </button>
        {opBtn(OPS[0].op, OPS[0].label)}

        {numBtn("7")}
        {numBtn("8")}
        {numBtn("9")}
        {opBtn(OPS[1].op, OPS[1].label)}

        {numBtn("4")}
        {numBtn("5")}
        {numBtn("6")}
        {opBtn(OPS[2].op, OPS[2].label)}

        {numBtn("1")}
        {numBtn("2")}
        {numBtn("3")}
        {opBtn(OPS[3].op, OPS[3].label)}

        {numBtn("0", "key col-span-2")}
        <button type="button" className="key" onClick={calc.inputDot}>
          .
        </button>
        <button
          type="button"
          aria-label={t("aria.equals")}
          onClick={calc.equals}
          className="key key--eq"
        >
          =
        </button>
      </div>
    </section>
  );
};
