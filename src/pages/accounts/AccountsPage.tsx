import { useState } from "react";
import { useAuth } from "../../app/AuthContext";
import { Tabs } from "../../shared/ui/Tabs";
import { AccountsSection } from "./AccountsSection";
import { CategoriesSection } from "./CategoriesSection";
import styles from "./AccountsPage.module.css";

type SectionKey = "accounts" | "categories";

const TABS = [
  { value: "accounts" as const, label: "Hisoblar" },
  { value: "categories" as const, label: "Kategoriyalar" },
];

/**
 * Design-07: Hisoblar va kategoriyalar. Ikkala boshqaruv bitta sahifada,
 * Design-02 Tabs komponenti orqali almashtiriladi.
 */
export function AccountsPage() {
  const { user } = useAuth();
  const [section, setSection] = useState<SectionKey>("accounts");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Hisoblar va kategoriyalar</h1>
          <p>Pullaringizni va ularni qanday guruhlashni shu yerda boshqaring.</p>
        </div>
      </header>
      <Tabs items={TABS} value={section} onChange={(value) => setSection(value as SectionKey)} ariaLabel="Hisoblar yoki kategoriyalar" />
      {section === "accounts" ? (
        <AccountsSection baseCurrency={user?.baseCurrency ?? "UZS"} />
      ) : (
        <CategoriesSection />
      )}
    </div>
  );
}
