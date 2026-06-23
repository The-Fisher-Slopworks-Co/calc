// SPDX-FileCopyrightText: 2026 The Fisher Slopworks Co
// SPDX-License-Identifier: AGPL-3.0-or-later

const MAX_LEN = 14;

export const formatNumber = (value: number | string | null): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (!Number.isFinite(value)) return "Error";

  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-6)) {
    return value.toExponential(6).replace(/\.?0+e/, "e");
  }

  const rounded = Math.round(value * 1e10) / 1e10;
  const s = String(rounded);
  if (s.length <= MAX_LEN) return s;
  return rounded.toPrecision(10).replace(/\.?0+$/, "");
};

export const DISPLAY_MAX_LEN = MAX_LEN;
