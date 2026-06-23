// SPDX-FileCopyrightText: 2026 The Fisher Slopworks Co
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastContextValue = {
  toast: (text: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

type ToastEntry = { id: number; text: string; visible: boolean };

const SHOW_MS = 2600;
const ANIM_MS = 250;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ToastEntry[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((text: string) => {
    const id = ++idRef.current;
    setItems((cur) => [...cur, { id, text, visible: false }]);

    requestAnimationFrame(() => {
      setItems((cur) =>
        cur.map((i) => (i.id === id ? { ...i, visible: true } : i)),
      );
    });

    window.setTimeout(() => {
      setItems((cur) =>
        cur.map((i) => (i.id === id ? { ...i, visible: false } : i)),
      );
      window.setTimeout(() => {
        setItems((cur) => cur.filter((i) => i.id !== id));
      }, ANIM_MS);
    }, SHOW_MS);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastHost items={items} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
};

const ToastHost = ({ items }: { items: ToastEntry[] }) => {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-[60] flex flex-col items-center gap-2">
      {items.map((i) => (
        <div
          key={i.id}
          className={
            "px-4 py-2.5 rounded-full bg-ink-800 border border-zinc-800 " +
            "text-sm text-zinc-100 shadow-monolith transition-all duration-200 " +
            (i.visible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-3")
          }
        >
          {i.text}
        </div>
      ))}
    </div>
  );
};
