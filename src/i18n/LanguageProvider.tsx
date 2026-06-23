// SPDX-FileCopyrightText: 2026 The Fisher Slopworks Co
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  SUPPORTED_LANGS,
  translations,
  type Lang,
  type TranslationKey,
} from "./translations.ts";

const STORAGE_KEY = "calc.lang";

const isLang = (v: unknown): v is Lang =>
  typeof v === "string" && (SUPPORTED_LANGS as readonly string[]).includes(v);

const detectLang = (): Lang => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    /* localStorage unavailable */
  }
  const navAny = typeof navigator !== "undefined" ? navigator : undefined;
  const candidates =
    navAny?.languages && navAny.languages.length
      ? navAny.languages
      : [navAny?.language ?? "en"];
  for (const c of candidates) {
    const base = String(c).toLowerCase().split("-")[0];
    if (isLang(base)) return base;
  }
  return "en";
};

type LanguageContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => detectLang());

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = translations[lang]["meta.title"];
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", translations[lang]["meta.description"]);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      t: (k) => translations[lang][k] ?? translations.en[k] ?? k,
    }),
    [lang, setLang],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within <LanguageProvider>");
  }
  return ctx;
};
