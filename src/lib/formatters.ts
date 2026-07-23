/**
 * Bengali-aware formatters. Falls back to intl defaults if bn-BD unsupported.
 */

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export const toBnDigits = (input: string | number): string =>
  String(input).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

export const bnNumber = (value: number, opts: Intl.NumberFormatOptions = {}): string => {
  try {
    return new Intl.NumberFormat("bn-BD", opts).format(value);
  } catch {
    return toBnDigits(value);
  }
};

export const bnCurrency = (value: number, currency = "BDT"): string => {
  try {
    return new Intl.NumberFormat("bn-BD", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `৳${toBnDigits(value)}`;
  }
};

export const bnDate = (value: string | number | Date, opts?: Intl.DateTimeFormatOptions): string => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("bn-BD", opts ?? { dateStyle: "medium" }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
};

export const bnDateTime = (value: string | number | Date): string =>
  bnDate(value, { dateStyle: "medium", timeStyle: "short" });

export const bnRelative = (value: string | number | Date): string => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = d.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const min = 60_000, hr = 60 * min, day = 24 * hr;
  const rtf = (() => {
    try {
      return new Intl.RelativeTimeFormat("bn-BD", { numeric: "auto" });
    } catch {
      return null;
    }
  })();
  const fmt = (n: number, unit: Intl.RelativeTimeFormatUnit) =>
    rtf ? rtf.format(Math.round(n), unit) : `${toBnDigits(Math.round(n))} ${unit}`;
  if (abs < hr) return fmt(diffMs / min, "minute");
  if (abs < day) return fmt(diffMs / hr, "hour");
  if (abs < 30 * day) return fmt(diffMs / day, "day");
  return bnDate(d);
};
