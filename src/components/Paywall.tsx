// SPDX-FileCopyrightText: 2026 The Fisher Slopworks Co
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "../i18n/LanguageProvider.tsx";
import type { TranslationKey } from "../i18n/translations.ts";
import { useMediaQuery } from "../hooks/useMediaQuery.ts";

type Plan = "go" | "ultra";

type Phase = "plans" | "processing" | "done" | "error";

const GO_FEATURES: TranslationKey[] = [
  "plan.go.f1",
  "plan.go.f2",
  "plan.go.f3",
  "plan.go.f4",
  "plan.go.f5",
];

const ULTRA_FEATURES: TranslationKey[] = [
  "plan.ultra.f1",
  "plan.ultra.f2",
  "plan.ultra.f3",
  "plan.ultra.f4",
  "plan.ultra.f5",
  "plan.ultra.f6",
];

// Pacing of the simulated checkout: spinner, then a beat on the result icon
// before the service unlocks (success only).
const PROCESSING_MS = 1600;
const DONE_MS = 900;

type Props = { onPaid: () => void };

export const Paywall = ({ onPaid }: Props) => {
  const { t } = useTranslation();
  const firstCtaRef = useRef<HTMLButtonElement | null>(null);

  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [selected, setSelected] = useState<Plan>("ultra");
  const [phase, setPhase] = useState<Phase>("plans");
  const [payingPlan, setPayingPlan] = useState<Plan>("ultra");

  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Focus the highlighted plan's CTA on mount and whenever the viewport
  // crosses the sm breakpoint (which swaps which card the ref attaches to).
  useEffect(() => {
    if (phase === "plans") firstCtaRef.current?.focus({ preventScroll: true });
  }, [isDesktop, phase]);

  // Drive the fake payment timeline. Ultra always "fails" with insufficient
  // funds; Go succeeds and unlocks the service.
  useEffect(() => {
    if (phase === "processing") {
      const id = window.setTimeout(() => {
        setPhase(payingPlan === "ultra" ? "error" : "done");
      }, PROCESSING_MS);
      return () => window.clearTimeout(id);
    }
    if (phase === "done") {
      const id = window.setTimeout(() => onPaidRef.current(), DONE_MS);
      return () => window.clearTimeout(id);
    }
  }, [phase, payingPlan]);

  const startPayment = (plan: Plan) => {
    setPayingPlan(plan);
    setPhase("processing");
  };
  const backToPlans = () => setPhase("plans");

  const showGo = isDesktop || selected === "go";
  const showUltra = isDesktop || selected === "ultra";
  const planLabel = payingPlan === "ultra" ? "Ultra · $200" : "Go · $20";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <article
        className={
          "relative w-full max-h-[calc(100vh-2rem)] overflow-y-auto " +
          "rounded-2xl bg-ink-800 border border-zinc-800 " +
          "p-6 sm:p-10 shadow-monolith animate-card-in " +
          (phase === "plans" ? "max-w-3xl" : "max-w-md")
        }
      >
        {phase === "plans" ? (
          <>
            <header className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
              <span
                className="inline-block px-2.5 py-1 mb-4 rounded-full
                           bg-accent/10 border border-accent/30
                           text-[10px] uppercase tracking-[0.14em] text-accent-strong font-mono"
              >
                {t("paywall.eyebrow")}
              </span>
              <h2
                id="paywall-title"
                className="text-2xl sm:text-4xl font-semibold tracking-tight text-zinc-100 mb-3"
              >
                {t("paywall.title")}
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                {t("paywall.lede")}
              </p>
            </header>

            <PlanToggle
              selected={selected}
              onSelect={setSelected}
              ariaLabel={t("paywall.toggleAria")}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 sm:mt-0">
              {showGo && (
                <PlanCard
                  name="Go"
                  price="$20"
                  tagKey="plan.go.tag"
                  features={GO_FEATURES}
                  ctaKey="plan.go.cta"
                  onChoose={() => startPayment("go")}
                  firstCtaRef={!isDesktop && selected === "go" ? firstCtaRef : undefined}
                />
              )}
              {showUltra && (
                <PlanCard
                  name="Ultra"
                  price="$200"
                  tagKey="plan.ultra.tag"
                  features={ULTRA_FEATURES}
                  ctaKey="plan.ultra.cta"
                  ribbonKey="plan.ultra.ribbon"
                  highlight
                  onChoose={() => startPayment("ultra")}
                  firstCtaRef={
                    isDesktop || selected === "ultra" ? firstCtaRef : undefined
                  }
                />
              )}
            </div>
          </>
        ) : (
          <PaymentStatus
            phase={phase}
            planLabel={planLabel}
            onBack={backToPlans}
            t={t}
          />
        )}
      </article>
    </div>
  );
};

type PaymentStatusProps = {
  phase: "processing" | "done" | "error";
  planLabel: string;
  onBack: () => void;
  t: (k: TranslationKey) => string;
};

const PaymentStatus = ({ phase, planLabel, onBack, t }: PaymentStatusProps) => (
  <div
    role="status"
    aria-live="polite"
    className="flex flex-col items-center justify-center text-center
               gap-5 py-10 min-h-[200px]"
  >
    <span
      className="inline-block px-2.5 py-1 rounded-full
                 bg-accent/10 border border-accent/30
                 text-[10px] uppercase tracking-[0.14em] text-accent-strong font-mono"
    >
      {planLabel}
    </span>

    {phase === "processing" && <Spinner />}
    {phase === "done" && <SuccessCheck />}
    {phase === "error" && <ErrorCross />}

    <h2
      id="paywall-title"
      className={
        "text-lg sm:text-xl font-semibold font-mono " +
        (phase === "error" ? "text-rose-300" : "text-zinc-100")
      }
    >
      {phase === "processing"
        ? t("payment.processing")
        : phase === "done"
          ? t("payment.done")
          : t("payment.error.insufficient")}
    </h2>

    {phase === "error" && (
      <button
        type="button"
        onClick={onBack}
        className="mt-1 rounded-lg border border-zinc-700 bg-transparent
                   text-zinc-100 text-sm font-medium px-4 py-2.5
                   hover:bg-ink-600 hover:border-zinc-600 transition-colors
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-accent
                   focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800"
      >
        {t("payment.error.back")}
      </button>
    )}
  </div>
);

const Spinner = () => (
  <svg
    className="w-12 h-12 text-accent animate-spin"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeOpacity="0.2"
      strokeWidth="2"
    />
    <path
      d="M21 12a9 9 0 0 0-9-9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const SuccessCheck = () => (
  <svg
    className="w-12 h-12 text-accent-strong animate-pop-in"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path
      d="M8 12.5l2.5 2.5L16 9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ErrorCross = () => (
  <svg
    className="w-12 h-12 text-rose-400 animate-pop-in"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path
      d="M9 9l6 6M15 9l-6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

type ToggleProps = {
  selected: Plan;
  onSelect: (p: Plan) => void;
  ariaLabel: string;
};

const PlanToggle = ({ selected, onSelect, ariaLabel }: ToggleProps) => (
  <div
    role="tablist"
    aria-label={ariaLabel}
    className="sm:hidden grid grid-cols-2 gap-1 p-1
               rounded-lg bg-ink-700 border border-zinc-800
               max-w-[240px] mx-auto"
  >
    <ToggleButton
      label="Go"
      isActive={selected === "go"}
      onClick={() => onSelect("go")}
      activeClass="bg-zinc-100 text-black"
    />
    <ToggleButton
      label="Ultra"
      isActive={selected === "ultra"}
      onClick={() => onSelect("ultra")}
      activeClass="bg-accent text-black"
    />
  </div>
);

type ToggleButtonProps = {
  label: string;
  isActive: boolean;
  onClick: () => void;
  activeClass: string;
};

const ToggleButton = ({
  label,
  isActive,
  onClick,
  activeClass,
}: ToggleButtonProps) => (
  <button
    type="button"
    role="tab"
    aria-selected={isActive}
    onClick={onClick}
    className={
      "px-3 py-3 rounded-md text-xs font-mono uppercase " +
      "tracking-[0.12em] transition-colors " +
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent " +
      "focus-visible:ring-offset-2 focus-visible:ring-offset-ink-700 " +
      (isActive
        ? `${activeClass} font-semibold`
        : "text-zinc-500 hover:text-zinc-200")
    }
  >
    {label}
  </button>
);

type PlanCardProps = {
  name: string;
  price: string;
  tagKey: TranslationKey;
  features: TranslationKey[];
  ctaKey: TranslationKey;
  ribbonKey?: TranslationKey;
  highlight?: boolean;
  onChoose: () => void;
  firstCtaRef?: React.RefObject<HTMLButtonElement | null>;
};

const PlanCard = ({
  name,
  price,
  tagKey,
  features,
  ctaKey,
  ribbonKey,
  highlight,
  onChoose,
  firstCtaRef,
}: PlanCardProps) => {
  const { t } = useTranslation();

  const containerClass = highlight
    ? "relative flex flex-col gap-5 rounded-xl " +
      "bg-gradient-to-b from-accent/[0.06] to-transparent " +
      "border border-accent/40 p-6 sm:p-7 shadow-accent-glow " +
      "transition-colors hover:border-accent/70"
    : "relative flex flex-col gap-5 rounded-xl " +
      "bg-ink-700 border border-zinc-800 p-6 sm:p-7 " +
      "transition-colors hover:border-zinc-700";

  const priceTextClass = highlight
    ? "text-4xl font-semibold text-accent-strong tracking-tight tabular-nums"
    : "text-4xl font-semibold text-zinc-100 tracking-tight tabular-nums";

  const nameClass = highlight
    ? "text-xl font-semibold text-accent-strong font-mono"
    : "text-xl font-semibold text-zinc-100 font-mono";

  const bulletClass = highlight
    ? "mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0"
    : "mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0";

  const featureTextClass = highlight ? "text-zinc-200" : "text-zinc-300";

  const ctaClass = highlight
    ? "rounded-lg bg-accent text-black text-sm font-semibold " +
      "px-4 py-3 hover:bg-accent-strong transition-colors"
    : "rounded-lg border border-zinc-700 bg-transparent " +
      "text-zinc-100 text-sm font-medium px-4 py-3 " +
      "hover:bg-ink-600 hover:border-zinc-600 transition-colors";

  return (
    <article className={containerClass}>
      {ribbonKey && (
        <span
          className="absolute -top-2.5 left-6 px-2 py-0.5 rounded-full
                     bg-accent text-black text-[10px] font-semibold
                     uppercase tracking-[0.12em] font-mono"
        >
          {t(ribbonKey)}
        </span>
      )}
      <header className="flex flex-col gap-1">
        <h3 className={nameClass}>{name}</h3>
        <p className="text-xs text-zinc-500">{t(tagKey)}</p>
      </header>
      <div className="flex items-baseline gap-1.5 pb-5 border-b border-zinc-800">
        <span className={priceTextClass}>{price}</span>
        <span className="text-sm text-zinc-500">{t("plan.month")}</span>
      </div>
      <ul className={`flex flex-col gap-2.5 text-sm flex-1 ${featureTextClass}`}>
        {features.map((k) => (
          <li key={k} className="flex items-start gap-2.5">
            <span className={bulletClass} />
            <span>{t(k)}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onChoose}
        className={ctaClass}
        ref={firstCtaRef}
      >
        {t(ctaKey)}
      </button>
    </article>
  );
};
