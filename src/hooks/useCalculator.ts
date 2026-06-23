// SPDX-FileCopyrightText: 2026 The Fisher Slopworks Co
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useCallback, useEffect, useRef, useState } from "react";
import { DISPLAY_MAX_LEN, formatNumber } from "../lib/format.ts";

export type Operator = "+" | "-" | "*" | "/";

export const OP_SYMBOL: Record<Operator, string> = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
};

const LOCKED = "•••";

type State = {
  current: string;
  previous: number | null;
  operator: Operator | null;
  overwrite: boolean;
  justEvaluated: boolean;
};

const initialState = (): State => ({
  current: "0",
  previous: null,
  operator: null,
  overwrite: false,
  justEvaluated: false,
});

const lockedState = (): State => ({
  current: LOCKED,
  previous: null,
  operator: null,
  overwrite: false,
  justEvaluated: true,
});

const buildExpression = (s: State): string | null => {
  if (s.previous === null || s.operator === null) return null;
  return `${formatNumber(s.previous)} ${OP_SYMBOL[s.operator]} ${s.current}`;
};

export type CalculatorOptions = {
  onEvaluate?: (expression: string) => void;
  isInputBlocked?: () => boolean;
};

export type CalculatorApi = {
  display: string;
  history: string;
  armedOperator: Operator | null;
  isLocked: boolean;
  currentNumber: number;
  inputDigit: (d: string) => void;
  inputDot: () => void;
  setOperator: (op: Operator) => void;
  equals: () => void;
  clearAll: () => void;
  toggleSign: () => void;
  percent: () => void;
  backspace: () => void;
  loadValue: (n: number) => void;
};

export const useCalculator = (options: CalculatorOptions = {}): CalculatorApi => {
  const [state, setState] = useState<State>(initialState);
  const [isLocked, setIsLocked] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const lockedRef = useRef(isLocked);
  lockedRef.current = isLocked;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // The only path that "evaluates": redacts the display and locks the
  // calculator. Intentionally never computes the result client-side — even
  // with the paywall blocked, there is no arithmetic to inspect.
  const triggerLock = useCallback((expression: string | null) => {
    if (expression) optionsRef.current.onEvaluate?.(expression);
    setState(lockedState());
    setIsLocked(true);
  }, []);

  const inputDigit = useCallback((d: string) => {
    setState((s) => {
      if (s.overwrite || s.justEvaluated) {
        return { ...s, current: d, overwrite: false, justEvaluated: false };
      }
      if (s.current === "0") return { ...s, current: d };
      if (s.current.replace(/[-.]/g, "").length < DISPLAY_MAX_LEN) {
        return { ...s, current: s.current + d };
      }
      return s;
    });
  }, []);

  const inputDot = useCallback(() => {
    setState((s) => {
      if (s.overwrite || s.justEvaluated) {
        return { ...s, current: "0.", overwrite: false, justEvaluated: false };
      }
      if (s.current.includes(".")) return s;
      return { ...s, current: s.current + "." };
    });
  }, []);

  const clearAll = useCallback(() => setState(initialState()), []);

  const toggleSign = useCallback(() => {
    setState((s) => {
      if (s.current === "0") return s;
      return {
        ...s,
        current: s.current.startsWith("-") ? s.current.slice(1) : "-" + s.current,
      };
    });
  }, []);

  const setOperator = useCallback(
    (op: Operator) => {
      const s = stateRef.current;
      if (s.previous !== null && s.operator && !s.overwrite) {
        // Chaining (e.g. 2 + 3 +) would need previous ⊕ current evaluated
        // before queueing the new operator. That is the locked operation,
        // so route it through triggerLock instead of computing.
        triggerLock(buildExpression(s));
        return;
      }
      setState((curr) => ({
        ...curr,
        previous: parseFloat(curr.current),
        operator: op,
        overwrite: true,
        justEvaluated: false,
      }));
    },
    [triggerLock],
  );

  const equals = useCallback(() => {
    const s = stateRef.current;
    if (s.previous === null || s.operator === null) return;
    triggerLock(buildExpression(s));
  }, [triggerLock]);

  // current / 100 is still arithmetic on a user-supplied operand; route it
  // through the same lock so the result is never produced client-side.
  const percent = useCallback(() => {
    triggerLock(null);
  }, [triggerLock]);

  const backspace = useCallback(() => {
    setState((s) => {
      if (s.overwrite || s.justEvaluated) return initialState();
      if (s.current.length > 1) {
        const next = s.current.slice(0, -1);
        return { ...s, current: next === "-" ? "0" : next };
      }
      return { ...s, current: "0" };
    });
  }, []);

  const loadValue = useCallback((n: number) => {
    if (!Number.isFinite(n)) return;
    setState((s) => ({
      ...s,
      current: formatNumber(n),
      overwrite: true,
      justEvaluated: false,
    }));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lockedRef.current) return;
      if (optionsRef.current.isInputBlocked?.()) return;

      if (/^[0-9]$/.test(e.key)) {
        inputDigit(e.key);
      } else if (e.key === ".") {
        inputDot();
      } else if (e.key === "+" || e.key === "-" || e.key === "*" || e.key === "/") {
        setOperator(e.key);
      } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        equals();
      } else if (e.key === "Backspace") {
        backspace();
      } else if (e.key.toLowerCase() === "c" || e.key === "Escape") {
        clearAll();
      } else if (e.key === "%") {
        percent();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [inputDigit, inputDot, setOperator, equals, backspace, clearAll, percent]);

  const history =
    state.previous !== null && state.operator
      ? `${formatNumber(state.previous)} ${OP_SYMBOL[state.operator]}`
      : "";

  const armedOperator =
    state.operator && state.overwrite ? state.operator : null;

  const currentNumber = parseFloat(state.current);

  return {
    display: state.current,
    history,
    armedOperator,
    isLocked,
    currentNumber: Number.isFinite(currentNumber) ? currentNumber : 0,
    inputDigit,
    inputDot,
    setOperator,
    equals,
    clearAll,
    toggleSign,
    percent,
    backspace,
    loadValue,
  };
};
