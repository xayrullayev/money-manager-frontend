import { useState } from "react";
import styles from "./StyleGuide.module.css";
import { SavingsSection } from "./sections/SavingsSection";
import { AtomsSection } from "./sections/AtomsSection";
import { FormsSection } from "./sections/FormsSection";
import { DataSection } from "./sections/DataSection";
import { SurfacesSection } from "./sections/SurfacesSection";
import {
  Button,
  Input,
  Select,
  Tabs,
  Card,
  EmptyState,
  SkeletonList,
  Dialog,
  DialogCancelButton,
  TransactionRow,
  useToast,
  type TabItem,
  type SelectOption,
} from "../../shared/ui";

const TAB_ITEMS: TabItem[] = [
  { value: "all", label: "Barchasi" },
  { value: "income", label: "Kirim" },
  { value: "expense", label: "Chiqim" },
];

const CURRENCY_OPTIONS: SelectOption[] = ["UZS", "USD", "EUR", "RUB", "GBP", "JPY", "CNY", "KZT", "TRY", "AED", "CHF", "CAD"].map((c) => ({
  value: c.toLowerCase(),
  label: c,
}));

/** Figma "Style & Component / Component" sahifasining to'liq kod ko'rinishi. */
export function ComponentPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("usd");
  const [text, setText] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <AtomsSection />
      <SavingsSection />
      <FormsSection />
      <DataSection />
      <SurfacesSection />

      {/* Jonli, interaktiv shared/ui React komponentlari */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Jonli komponentlar (shared/ui)</h2>
        <p className={styles.sectionDesc}>Yuqoridagi vizual bo'limlar bilan bir tokendan; bular haqiqiy, interaktiv React komponentlari.</p>

        <div className={styles.demoStack}>
          <span className={styles.demoLabel}>Button holatlari</span>
          <div className={styles.demoRow}>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Button fullWidth={false} variant="secondary">
              Secondary
            </Button>
          </div>
        </div>

        <div className={styles.demoStack}>
          <span className={styles.demoLabel}>Input / Select</span>
          <div className={styles.demoGrid}>
            <Input label="Xato holati" value={text} onChange={setText} error="Bu maydon majburiy" />
            <Select label="Qidiriladigan (Combobox)" value={search} onChange={setSearch} options={CURRENCY_OPTIONS} />
          </div>
        </div>

        <div className={styles.demoStack}>
          <span className={styles.demoLabel}>Tabs</span>
          <Tabs items={TAB_ITEMS} value={tab} onChange={setTab} ariaLabel="Operatsiya turi" />
        </div>

        <div className={styles.demoStack}>
          <span className={styles.demoLabel}>Transaction row</span>
          <Card variant="outlined" padding="sm">
            <TransactionRow title="Ish haqi" subtitle="Oylik" amount={4800000} currency="UZS" type="INCOME" />
            <TransactionRow title="Oziq-ovqat" subtitle="Bozor" amount={320000} currency="UZS" type="EXPENSE" />
          </Card>
        </div>

        <div className={styles.demoStack}>
          <span className={styles.demoLabel}>Toast / Dialog</span>
          <div className={styles.demoRow}>
            <Button variant="secondary" onClick={() => showToast("Muvaffaqiyatli saqlandi", "success")}>
              Toast
            </Button>
            <Button onClick={() => setDialogOpen(true)}>Dialog</Button>
          </div>
          {dialogOpen && (
            <Dialog title="Namuna dialog" onClose={() => setDialogOpen(false)}>
              <p style={{ marginTop: 0 }}>Focus-trap, ESC bilan yopish va mobil sheet.</p>
              <div className={styles.demoRow}>
                <DialogCancelButton />
                <Button onClick={() => setDialogOpen(false)}>Tasdiqlash</Button>
              </div>
            </Dialog>
          )}
        </div>

        <div className={styles.demoStack}>
          <span className={styles.demoLabel}>Empty state / Skeleton</span>
          <div className={styles.demoGrid}>
            <EmptyState title="Hozircha operatsiya yo'q" description="Birinchi operatsiyangizni qo'shing." icon="📄" action={<Button>Qo'shish</Button>} />
            <Card variant="outlined">
              <SkeletonList rows={3} variant="row" />
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
