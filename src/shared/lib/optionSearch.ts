/**
 * Design-02: Combobox qidiruvi. Katta-kichik harf va o‘zbekcha apostrof
 * variantlari (‘ ’ ' ` ʻ ʼ) farqlanmaydi: "sogliq", "Sog'liq", "Sog‘liq" bir xil.
 */

/** Shu sondan ko‘p variantli ro‘yxatda native select o‘rniga qidiriladigan Combobox. */
export const COMBOBOX_THRESHOLD = 10;

export function normalizeSearch(text: string): string {
  return text.toLowerCase().replace(/[’‘'`ʻʼ]/g, "").replace(/\s+/g, " ").trim();
}

/** So‘rovning har bir so‘zi label ichida bo‘lsa mos keladi; label boshidan mos kelganlar oldinda. */
export function filterOptions<T extends { label: string }>(options: readonly T[], query: string): T[] {
  const q = normalizeSearch(query);
  if (!q) return [...options];
  const words = q.split(" ");
  const matches = options.filter((option) => {
    const label = normalizeSearch(option.label);
    return words.every((word) => label.includes(word));
  });
  return matches
    .map((option, index) => ({ option, index, prefix: normalizeSearch(option.label).startsWith(q) ? 0 : 1 }))
    .sort((a, b) => a.prefix - b.prefix || a.index - b.index)
    .map((entry) => entry.option);
}

export function shouldUseCombobox(optionCount: number, searchable?: boolean): boolean {
  return searchable ?? optionCount >= COMBOBOX_THRESHOLD;
}

/** Klaviatura navigatsiyasi: disabled variantlarni o‘tkazib, `step` (+1/-1) yo‘nalishda keyingi indeks. */
export function nextEnabledIndex(options: readonly { disabled?: boolean }[], from: number, step: 1 | -1): number {
  if (options.length === 0) return -1;
  let index = from;
  for (let i = 0; i < options.length; i++) {
    index = (index + step + options.length) % options.length;
    if (!options[index].disabled) return index;
  }
  return -1;
}
