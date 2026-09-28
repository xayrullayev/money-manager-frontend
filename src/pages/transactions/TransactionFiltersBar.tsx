import { useEffect, useId, useState } from "react";
import type { Account } from "../../shared/api/accounts";
import type { Category } from "../../shared/api/categories";
import { Tabs } from "../../shared/ui/Tabs";
import { toLocalDate } from "../../shared/lib/period";
import {
  applyPeriod,
  countActiveFilters,
  detectPeriod,
  EMPTY_FILTERS,
  removeFilter,
  SEARCH_MAX_LENGTH,
  type PeriodFilter,
  type TransactionFilters,
  type TransactionTypeFilter,
} from "../../shared/lib/transactionFilters";
import { formatShortDate } from "./transactionView";
import styles from "./TransactionsPage.module.css";

/** Design-06: "Search 300ms debounce". */
const SEARCH_DEBOUNCE_MS = 300;

const TYPE_TABS: { value: TransactionTypeFilter; label: string }[] = [
  { value: "", label: "Hammasi" },
  { value: "EXPENSE", label: "Xarajat" },
  { value: "INCOME", label: "Daromad" },
  { value: "TRANSFER", label: "O‘tkazma" },
];

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "all", label: "Butun tarix" },
  { value: "this_month", label: "Bu oy" },
  { value: "last_month", label: "O‘tgan oy" },
  { value: "last_30_days", label: "So‘nggi 30 kun" },
  { value: "custom", label: "Maxsus davr" },
];

interface Props {
  filters: TransactionFilters;
  onChange: (next: TransactionFilters) => void;
  accounts: Account[];
  categories: Category[];
}

export function TransactionFiltersBar({ filters, onChange, accounts, categories }: Props) {
  const idPrefix = useId();
  const [searchInput, setSearchInput] = useState(filters.search);
  const [customOpen, setCustomOpen] = useState(false);
  const period = detectPeriod(filters);
  const showCustom = customOpen || period === "custom";
  const today = toLocalDate();

  // URL tashqaridan o'zgarsa (Back, chip × yoki "tozalash") — input render paytida sinxronlanadi
  // (React: "adjusting state when a prop changes", effektsiz).
  const [syncedSearch, setSyncedSearch] = useState(filters.search);
  if (syncedSearch !== filters.search) {
    setSyncedSearch(filters.search);
    if (searchInput.trim() !== filters.search) setSearchInput(filters.search);
  }

  // Debounce: yozish to'xtagach 300ms o'tib URL yangilanadi.
  useEffect(() => {
    if (searchInput.trim() === filters.search) return;
    const timer = window.setTimeout(() => onChange({ ...filters, search: searchInput }), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput, filters, onChange]);

  // Tur tanlanganda faqat shu turdagi kategoriyalar; o'tkazmada kategoriya yo'q.
  const categoryOptions = categories.filter((c) => !filters.type || c.type === filters.type);

  function handleType(value: string) {
    const type = value as TransactionTypeFilter;
    const keepCategory =
      type !== "TRANSFER" && (!type || categories.find((c) => c.id === filters.categoryId)?.type === type);
    onChange({ ...filters, type, categoryId: keepCategory ? filters.categoryId : "" });
  }

  function handlePeriod(value: PeriodFilter) {
    setCustomOpen(value === "custom");
    onChange(applyPeriod(filters, value));
  }

  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? "Hisob";
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "Kategoriya";

  const chips: { key: Parameters<typeof removeFilter>[1]; label: string }[] = [];
  if (filters.search) chips.push({ key: "search", label: `“${filters.search}”` });
  if (filters.type) chips.push({ key: "type", label: TYPE_TABS.find((t) => t.value === filters.type)?.label ?? filters.type });
  if (filters.from || filters.to) {
    const label =
      period !== "custom"
        ? (PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? "Davr")
        : `${filters.from ? formatShortDate(filters.from) : "…"} – ${filters.to ? formatShortDate(filters.to) : "…"}`;
    chips.push({ key: "period", label });
  }
  if (filters.accountId) chips.push({ key: "accountId", label: accountName(filters.accountId) });
  if (filters.categoryId) chips.push({ key: "categoryId", label: categoryName(filters.categoryId) });

  return (
    <section className={styles.filters} aria-label="Filtrlar">
      <div className={styles.searchField}>
        <label htmlFor={`${idPrefix}-search`} className="sr-only">
          Izoh bo‘yicha qidirish
        </label>
        <span className={styles.searchIcon} aria-hidden="true">⌕</span>
        <input
          id={`${idPrefix}-search`}
          type="search"
          className={styles.searchInput}
          placeholder="Izoh bo‘yicha qidirish"
          value={searchInput}
          maxLength={SEARCH_MAX_LENGTH}
          onChange={(event) => setSearchInput(event.target.value)}
          enterKeyHint="search"
        />
      </div>

      <Tabs
        items={TYPE_TABS}
        value={filters.type}
        onChange={handleType}
        ariaLabel="Operatsiya turi"
        className={styles.typeTabs}
      />

      <div className={styles.filterGrid}>
        <div className={styles.filterField}>
          <label htmlFor={`${idPrefix}-period`} className={styles.filterLabel}>Davr</label>
          <select
            id={`${idPrefix}-period`}
            className={styles.filterSelect}
            value={showCustom ? "custom" : period}
            onChange={(event) => handlePeriod(event.target.value as PeriodFilter)}
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {showCustom && (
          <div className={styles.dateRange}>
            <div className={styles.filterField}>
              <label htmlFor={`${idPrefix}-from`} className={styles.filterLabel}>Dan</label>
              <input
                id={`${idPrefix}-from`}
                type="date"
                className={styles.filterSelect}
                value={filters.from}
                max={filters.to || today}
                onChange={(event) => onChange({ ...filters, from: event.target.value })}
              />
            </div>
            <div className={styles.filterField}>
              <label htmlFor={`${idPrefix}-to`} className={styles.filterLabel}>Gacha</label>
              <input
                id={`${idPrefix}-to`}
                type="date"
                className={styles.filterSelect}
                value={filters.to}
                min={filters.from || undefined}
                max={today}
                onChange={(event) => onChange({ ...filters, to: event.target.value })}
              />
            </div>
          </div>
        )}

        <div className={styles.filterField}>
          <label htmlFor={`${idPrefix}-account`} className={styles.filterLabel}>Hisob</label>
          <select
            id={`${idPrefix}-account`}
            className={styles.filterSelect}
            value={filters.accountId}
            onChange={(event) => onChange({ ...filters, accountId: event.target.value })}
          >
            <option value="">Barcha hisoblar</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {`${account.name}${account.archived ? " (arxiv)" : ""}`}
              </option>
            ))}
          </select>
        </div>

        {filters.type !== "TRANSFER" && (
          <div className={styles.filterField}>
            <label htmlFor={`${idPrefix}-category`} className={styles.filterLabel}>Kategoriya</label>
            <select
              id={`${idPrefix}-category`}
              className={styles.filterSelect}
              value={filters.categoryId}
              onChange={(event) => onChange({ ...filters, categoryId: event.target.value })}
            >
              <option value="">Barcha kategoriyalar</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {`${category.name}${!filters.type ? ` · ${category.type === "INCOME" ? "daromad" : "xarajat"}` : ""}${category.archived ? " (arxiv)" : ""}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {chips.length > 0 && (
        <div className={styles.chips}>
          <ul className={styles.chipList} aria-label="Faol filtrlar">
            {chips.map((chip) => (
              <li key={chip.key} className={styles.chip}>
                <span className={styles.chipLabel}>{chip.label}</span>
                <button
                  type="button"
                  className={styles.chipRemove}
                  aria-label={`Filtrni olib tashlash: ${chip.label}`}
                  onClick={() => {
                    if (chip.key === "period") setCustomOpen(false);
                    onChange(removeFilter(filters, chip.key));
                  }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          {countActiveFilters(filters) > 1 && (
            <button
              type="button"
              className={styles.clearAll}
              onClick={() => {
                setCustomOpen(false);
                setSearchInput("");
                onChange(EMPTY_FILTERS);
              }}
            >
              Barchasini tozalash
            </button>
          )}
        </div>
      )}

      {filters.type === "TRANSFER" && (
        <p className={styles.transferNote}>O‘tkazmalar daromad va xarajat jamiga kirmaydi — ular faqat hisoblar orasidagi pul harakati.</p>
      )}
    </section>
  );
}
