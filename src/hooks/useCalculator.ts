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
const ERROR = "Error";

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

const errorState = (): State => ({
  current: ERROR,
  previous: null,
  operator: null,
  overwrite: false,
  justEvaluated: true,
});

const buildExpression = (s: State): string | null => {
  if (s.previous === null || s.operator === null) return null;
  return `${formatNumber(s.previous)} ${OP_SYMBOL[s.operator]} ${s.current}`;
};

const compute = (a: number, op: Operator, b: number): number => {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return a / b;
  }
};

export type CalculatorOptions = {
  onEvaluate?: (expression: string) => void;
  isInputBlocked?: () => boolean;
  // When this returns true the calculator evaluates for real instead of
  // routing the operation through the paywall.
  isUnlocked?: () => boolean;
  // When this returns true the monthly quota is spent: evaluations fail with
  // an error instead of computing.
  isOverLimit?: () => boolean;
  onLimitReached?: () => void;
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
  reveal: () => void;
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
  // The operation that hit the paywall, stashed as a thunk so a later unlock
  // can reveal its result. It is never invoked while locked.
  const pendingRef = useRef<(() => number) | null>(null);

  // Locked path: redact the display, remember the attempted operation, and
  // raise the paywall. No arithmetic runs until the user unlocks.
  const triggerLock = useCallback(
    (expression: string | null, resultFn: () => number) => {
      if (expression) optionsRef.current.onEvaluate?.(expression);
      pendingRef.current = resultFn;
      setState(lockedState());
      setIsLocked(true);
    },
    [],
  );

  // Unlocked path: evaluate for real, log the expression, and show the result.
  const settle = useCallback((expression: string | null, result: number) => {
    if (expression) optionsRef.current.onEvaluate?.(expression);
    setState({
      ...initialState(),
      current: formatNumber(result),
      justEvaluated: true,
    });
  }, []);

  // Quota exhausted: surface an error instead of computing, and don't log the
  // attempt so nothing else is consumed.
  const failLimit = useCallback(() => {
    optionsRef.current.onLimitReached?.();
    setState(errorState());
  }, []);

  // Payment succeeded: drop the lock and reveal the stashed result, if any.
  const reveal = useCallback(() => {
    const resultFn = pendingRef.current;
    pendingRef.current = null;
    setIsLocked(false);
    setState(
      resultFn
        ? {
            ...initialState(),
            current: formatNumber(resultFn()),
            justEvaluated: true,
          }
        : initialState(),
    );
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
      const { previous, operator } = s;
      if (previous !== null && operator && !s.overwrite) {
        // Chaining (e.g. 2 + 3 +) folds previous ⊕ current before queueing the
        // new operator. Unlocked we fold it; locked it is the gated operation,
        // so stash it and raise the paywall instead of computing.
        const b = parseFloat(s.current);
        const expr = buildExpression(s);
        if (optionsRef.current.isUnlocked?.()) {
          if (optionsRef.current.isOverLimit?.()) {
            failLimit();
            return;
          }
          if (expr) optionsRef.current.onEvaluate?.(expr);
          const result = compute(previous, operator, b);
          setState({
            ...initialState(),
            current: formatNumber(result),
            previous: result,
            operator: op,
            overwrite: true,
          });
        } else {
          triggerLock(expr, () => compute(previous, operator, b));
        }
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
    [triggerLock, failLimit],
  );

  const equals = useCallback(() => {
    const s = stateRef.current;
    const { previous, operator } = s;
    if (previous === null || operator === null) return;
    const b = parseFloat(s.current);
    const expr = buildExpression(s);
    if (optionsRef.current.isUnlocked?.()) {
      if (optionsRef.current.isOverLimit?.()) {
        failLimit();
        return;
      }
      settle(expr, compute(previous, operator, b));
    } else {
      triggerLock(expr, () => compute(previous, operator, b));
    }
  }, [settle, triggerLock, failLimit]);

  // current / 100 is arithmetic on a user-supplied operand: unlocked we compute
  // it, locked we gate it like any other evaluation.
  const percent = useCallback(() => {
    const b = parseFloat(stateRef.current.current);
    if (optionsRef.current.isUnlocked?.()) {
      if (optionsRef.current.isOverLimit?.()) {
        failLimit();
        return;
      }
      settle(null, b / 100);
    } else {
      triggerLock(null, () => b / 100);
    }
  }, [settle, triggerLock, failLimit]);

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
    reveal,
    loadValue,
  };
};
