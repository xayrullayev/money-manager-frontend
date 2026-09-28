import { useId } from "react";
import {
  CATEGORY_COLOR_TOKENS,
  CATEGORY_COLORS,
  CATEGORY_ICON_KEYS,
  CATEGORY_ICONS,
  type CategoryColorToken,
  type CategoryIconKey,
} from "../lib/categoryTokens";
import { CategoryIcon } from "./CategoryIcon";
import styles from "./CategoryAppearancePicker.module.css";

interface Props {
  iconKey: CategoryIconKey;
  colorToken: CategoryColorToken;
  onIconChange: (value: CategoryIconKey) => void;
  onColorChange: (value: CategoryColorToken) => void;
  disabled?: boolean;
}

/**
 * Design-07: kategoriya icon (13) va rang (10) tanlovi. Native radio-guruhlar:
 * Tab guruhga kiradi, strelkalar tanlovni o'zgartiradi, ekran o'quvchi
 * "Oziq-ovqat, 4 dan 13" deb o'qiydi. Qiymatlar faqat backend allowlist'idan.
 */
export function CategoryAppearancePicker({ iconKey, colorToken, onIconChange, onColorChange, disabled }: Props) {
  const name = useId();
  return (
    <div className={styles.picker}>
      <div className={styles.preview} aria-live="polite">
        <CategoryIcon iconKey={iconKey} colorToken={colorToken} />
        <span>{CATEGORY_ICONS[iconKey].label} · {CATEGORY_COLORS[colorToken]}</span>
      </div>
      <fieldset className={styles.group} disabled={disabled}>
        <legend>Belgi</legend>
        <div className={styles.icons}>
          {CATEGORY_ICON_KEYS.map((key) => (
            <label key={key} className={styles.option} title={CATEGORY_ICONS[key].label}>
              <input type="radio" name={`${name}-icon`} value={key} checked={iconKey === key} onChange={() => onIconChange(key)} />
              <span className={styles.iconSwatch} aria-hidden="true">{CATEGORY_ICONS[key].glyph}</span>
              <span className={styles.srOnly}>{CATEGORY_ICONS[key].label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className={styles.group} disabled={disabled}>
        <legend>Rang</legend>
        <div className={styles.colors}>
          {CATEGORY_COLOR_TOKENS.map((token) => (
            <label key={token} className={styles.option} title={CATEGORY_COLORS[token]}>
              <input type="radio" name={`${name}-color`} value={token} checked={colorToken === token} onChange={() => onColorChange(token)} />
              <span className={styles.colorSwatch} style={{ background: `var(--category-${token})` }} aria-hidden="true" />
              <span className={styles.srOnly}>{CATEGORY_COLORS[token]}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
