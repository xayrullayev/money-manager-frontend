/**
 * Kategoriya icon/rang tokenlari — backend allowlist bilan bir xil
 * (`backend/.../categories/CategoryTokens.java`, Bakend-08: raw hex/HTML emas,
 * faqat nomlangan tokenlar). Backend `POST /categories`da `iconKey` va
 * `colorToken`ni majburiy talab qiladi.
 *
 * Design-07: foydalanuvchi icon va rangni o'zi tanlaydi (CategoryAppearancePicker).
 * `suggestCategoryTokens` faqat boshlang'ich taklif — foydalanuvchi tanlovga
 * tegmaguncha nomga qarab yangilanadi.
 */

export const CATEGORY_ICON_KEYS = [
  "salary",
  "freelance",
  "gift",
  "food",
  "transport",
  "housing",
  "health",
  "entertainment",
  "education",
  "shopping",
  "subscriptions",
  "travel",
  "other",
] as const;

export const CATEGORY_COLOR_TOKENS = [
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
  "orange",
  "yellow",
  "red",
  "gray",
  "brown",
] as const;

export type CategoryIconKey = (typeof CATEGORY_ICON_KEYS)[number];
export type CategoryColorToken = (typeof CATEGORY_COLOR_TOKENS)[number];

export interface CategoryTokens {
  iconKey: CategoryIconKey;
  colorToken: CategoryColorToken;
}

/** Kalit so'z (kichik harf, apostrofsiz) → token. Birinchi mos kelgani olinadi. */
const RULES: { match: RegExp; tokens: CategoryTokens }[] = [
  { match: /ish ?haq|oylik|maosh|salary/, tokens: { iconKey: "salary", colorToken: "green" } },
  { match: /frilans|freelance|loyiha|buyurtma/, tokens: { iconKey: "freelance", colorToken: "teal" } },
  { match: /sovga|hadya|gift/, tokens: { iconKey: "gift", colorToken: "pink" } },
  { match: /oziq|ovqat|restoran|kafe|non|bozor|food/, tokens: { iconKey: "food", colorToken: "orange" } },
  { match: /transport|taksi|benzin|yoqilgi|avto|metro/, tokens: { iconKey: "transport", colorToken: "blue" } },
  { match: /uy|ijara|kommunal|elektr|gaz|suv|housing/, tokens: { iconKey: "housing", colorToken: "brown" } },
  { match: /sogliq|dori|shifo|klinika|health/, tokens: { iconKey: "health", colorToken: "red" } },
  { match: /kongil|kino|oyin|dam olish|entertain/, tokens: { iconKey: "entertainment", colorToken: "purple" } },
  { match: /talim|kurs|kitob|oqish|education/, tokens: { iconKey: "education", colorToken: "yellow" } },
  { match: /kiyim|xarid|shopping|dokon/, tokens: { iconKey: "shopping", colorToken: "pink" } },
  { match: /obuna|internet|aloqa|telefon|subscription/, tokens: { iconKey: "subscriptions", colorToken: "teal" } },
  { match: /sayohat|sayr|travel|mehmonxona/, tokens: { iconKey: "travel", colorToken: "blue" } },
];

function normalize(name: string): string {
  // O‘/G‘ va turli apostroflarni olib tashlaymiz: "Sog‘liq" → "sogliq".
  return name.toLowerCase().replace(/[’‘'`ʻʼ]/g, "").trim();
}

export function suggestCategoryTokens(name: string, type: "INCOME" | "EXPENSE"): CategoryTokens {
  const key = normalize(name);
  const rule = RULES.find((r) => r.match.test(key));
  if (rule) return rule.tokens;
  return type === "INCOME" ? { iconKey: "other", colorToken: "green" } : { iconKey: "other", colorToken: "gray" };
}

/** Icon → ko'rsatiladigan belgi va o'zbekcha nom (ekran o'quvchi uchun ham). */
export const CATEGORY_ICONS: Record<CategoryIconKey, { glyph: string; label: string }> = {
  salary: { glyph: "💰", label: "Ish haqi" },
  freelance: { glyph: "💻", label: "Frilans" },
  gift: { glyph: "🎁", label: "Sovg‘a" },
  food: { glyph: "🍽️", label: "Oziq-ovqat" },
  transport: { glyph: "🚌", label: "Transport" },
  housing: { glyph: "🏠", label: "Uy-joy" },
  health: { glyph: "💊", label: "Sog‘liq" },
  entertainment: { glyph: "🎬", label: "Ko‘ngilochar" },
  education: { glyph: "📚", label: "Ta’lim" },
  shopping: { glyph: "🛍️", label: "Xaridlar" },
  subscriptions: { glyph: "📱", label: "Obunalar" },
  travel: { glyph: "✈️", label: "Sayohat" },
  other: { glyph: "🏷️", label: "Boshqa" },
};

/** Rang tokeni → o'zbekcha nom. CSS qiymati `--category-<token>` (styles/tokens.css). */
export const CATEGORY_COLORS: Record<CategoryColorToken, string> = {
  green: "Yashil",
  teal: "Firuza",
  blue: "Ko‘k",
  purple: "Binafsha",
  pink: "Pushti",
  orange: "To‘q sariq",
  yellow: "Sariq",
  red: "Qizil",
  gray: "Kulrang",
  brown: "Jigarrang",
};

export function isCategoryIconKey(value: string): value is CategoryIconKey {
  return (CATEGORY_ICON_KEYS as readonly string[]).includes(value);
}

export function isCategoryColorToken(value: string): value is CategoryColorToken {
  return (CATEGORY_COLOR_TOKENS as readonly string[]).includes(value);
}

/** API'dan kelgan (string) qiymatni allowlist'ga keltiradi; noma'lum qiymat → "other"/"gray". */
export function toCategoryTokens(iconKey: string, colorToken: string): CategoryTokens {
  return {
    iconKey: isCategoryIconKey(iconKey) ? iconKey : "other",
    colorToken: isCategoryColorToken(colorToken) ? colorToken : "gray",
  };
}
