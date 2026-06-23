<!--
SPDX-FileCopyrightText: 2026 The Fisher Slopworks Co
SPDX-License-Identifier: AGPL-3.0-or-later
-->

# Calc

A minimal calculator with subscription plans, deployed to
[calc.slopworks.org](https://calc.slopworks.org) via GitHub Pages.

## Tech stack

- React 19 + TypeScript
- Vite for dev server and production builds
- Tailwind CSS v4 via `@tailwindcss/vite`
- GitHub Actions for type-checked builds and Pages deployment
- REUSE-compliant licensing under AGPL-3.0-or-later

## Local development

Requires Node.js 20+ and npm.

```sh
npm ci          # install dependencies (CI-friendly)
npm run dev     # Vite dev server on http://localhost:5173
npm run build   # type check + production build into dist/
npm run preview # serve the built bundle locally
```

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which:

1. Installs dependencies with `npm ci`.
2. Runs `tsc -b` to type-check the project.
3. Builds the production bundle with `vite build`.
4. Uploads `dist/` as a GitHub Pages artifact and publishes it.

The custom domain `calc.slopworks.org` is configured via `public/CNAME`, which
Vite copies into `dist/` during the build.

### One-time setup

1. In **Settings → Pages**, set **Source** to **GitHub Actions**.
2. Add a DNS `CNAME` record pointing `calc.slopworks.org` to `The-Fisher-Slopworks-Co.github.io`.
3. After the certificate is provisioned, enable **Enforce HTTPS** in
   **Settings → Pages**.

## Project layout

```
src/
├── App.tsx                          # composition root
├── main.tsx                         # ReactDOM entry, providers
├── index.css                        # Tailwind v4 theme + components
├── components/
│   ├── Calculator.tsx               # keypad and display
│   ├── Paywall.tsx                  # mandatory subscription modal
│   ├── LanguageSwitcher.tsx         # EN/RU toggle
│   └── ToastHost.tsx                # toast context + renderer
├── hooks/
│   └── useCalculator.ts             # calculator state machine
├── i18n/
│   ├── LanguageProvider.tsx         # context, detection, persistence
│   └── translations.ts              # EN and RU dictionaries
└── lib/
    └── format.ts                    # number formatting helper
```

## License

AGPL-3.0-or-later. See [LICENSE](LICENSE).

The repository is [REUSE](https://reuse.software/) compliant: every file
declares its copyright and license either inline (via `SPDX-FileCopyrightText`
and `SPDX-License-Identifier` headers) or through `REUSE.toml`. Compliance
is verified on every push by `.github/workflows/reuse.yml`.

Code of Conduct, contributing, and security policy are inherited org-wide from
[`The-Fisher-Slopworks-Co/.github`](https://github.com/The-Fisher-Slopworks-Co/.github).
