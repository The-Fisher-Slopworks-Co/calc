// SPDX-FileCopyrightText: 2026 The Fisher Slopworks Co
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useTranslation } from "../i18n/LanguageProvider.tsx";
import { SUPPORTED_LANGS, type Lang } from "../i18n/translations.ts";

const LABEL: Record<Lang, string> = { en: "EN", ru: "RU" };
const ARIA_KEY = {
  en: "aria.switchEn",
  ru: "aria.switchRu",
} as const;

export const LanguageSwitcher = () => {
  const { lang, setLang, t } = useTranslation();

  return (
    <nav
      aria-label="Language"
      className="absolute top-5 right-5 sm:top-6 sm:right-6 z-10
                 flex items-center gap-1 font-mono text-[10px]
                 uppercase tracking-[0.12em]"
    >
      {SUPPORTED_LANGS.map((code, idx) => (
        <span key={code} className="flex items-center gap-1">
          {idx > 0 && (
            <span aria-hidden="true" className="text-zinc-700">
              /
            </span>
          )}
          <button
            type="button"
            onClick={() => setLang(code)}
            aria-label={t(ARIA_KEY[code])}
            aria-pressed={lang === code}
            className={`lang-btn ${lang === code ? "is-active" : ""}`}
          >
            {LABEL[code]}
          </button>
        </span>
      ))}
    </nav>
  );
};
