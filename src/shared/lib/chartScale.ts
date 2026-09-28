/**
 * Diverging bar grafik uchun "chiroyli" o'q chegarasi va qisqa yorliqlar.
 * Sof funksiyalar — tests/chartScale.test.cjs bilan tekshiriladi.
 */

/** max'dan katta yoki teng eng yaqin "yumaloq" son: 1, 2, 2.5, 4, 5, 8, 10 × 10^n. */
export function niceCeil(max: number): number {
  if (!Number.isFinite(max) || max <= 0) return 1;
  const exponent = Math.floor(Math.log10(max));
  const base = 10 ** exponent;
  for (const step of [1, 2, 2.5, 4, 5, 8, 10]) {
    if (max <= step * base + 1e-9) return step * base;
  }
  return 10 * base;
}

/** 8_000_000 → "8 mln", 2_500 → "2,5 ming", 0 → "0". Ishora saqlanadi (o'q uchun "−4 mln"). */
export function compactAmount(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ","));
  if (abs >= 1_000_000_000) return `${sign}${fmt(abs / 1_000_000_000)} mlrd`;
  if (abs >= 1_000_000) return `${sign}${fmt(abs / 1_000_000)} mln`;
  if (abs >= 1_000) return `${sign}${fmt(abs / 1_000)} ming`;
  return `${sign}${fmt(abs)}`;
}
