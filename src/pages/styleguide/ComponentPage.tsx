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
  Avatar,
  AvatarGroup,
  Badge,
  MessageItem,
  NotificationItem,
  NotificationPanel,
  useToast,
  type TabItem,
  type SelectOption,
  type NotificationTab,
} from "../../shared/ui";

const NOTIF_TABS: NotificationTab[] = [
  { value: "all", label: "Barchasi", count: 1234 },
  { value: "following", label: "Kuzatiladi", count: 3 },
  { value: "orders", label: "Buyurtmalar", count: 3 },
];

const INBOX = [
  { id: "1", name: "Helen Martinez", role: "Trainer", time: "09:15 AM", preview: "Mazda 3 bo'yicha bandlovni tasdiqlayapman — ertalabki slot ochiqmi?", presence: "online" as const, unreadCount: 5 },
  { id: "2", name: "Parker Johnson", time: "08:02 AM", preview: "Email orqali yangi hisob yaratildi", presence: "away" as const },
  { id: "3", name: "Catrin North", time: "1d", preview: "Elektronika #10982 buyurtmasiga sharh qoldirdi", presence: "offline" as const },
];

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
  const [notifTab, setNotifTab] = useState("all");
  const [activeChat, setActiveChat] = useState("1");
  const [readMap, setReadMap] = useState<Record<string, boolean>>({ n1: false });

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

        <div className={styles.demoStack}>
          <span className={styles.demoLabel}>Avatar (presence) / Badge</span>
          <div className={styles.demoRow} style={{ alignItems: "center", gap: "var(--space-4)" }}>
            <Avatar name="Bexzod Xayrullayev" size={28} decorative />
            <Avatar name="Bexzod Xayrullayev" size={40} presence="online" decorative />
            <Avatar name="Karim Bek" size={40} variant="solid" presence="busy" decorative />
            <AvatarGroup ariaLabel="Jamoa">
              <Avatar initials="AB" size={32} decorative />
              <Avatar initials="CD" size={32} decorative />
              <Avatar initials="+5" size={32} variant="solid" decorative />
            </AvatarGroup>
            <Badge tone="accent">Trainer</Badge>
            <Badge tone="success">Bajarildi</Badge>
            <Badge tone="danger" count>5</Badge>
          </div>
        </div>

        <div className={styles.demoStack}>
          <span className={styles.demoLabel}>Inbox — MessageItem (bosiladigan, tanlanadi)</span>
          <Card variant="outlined" padding="sm">
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              {INBOX.map((m) => (
                <MessageItem
                  key={m.id}
                  avatar={<Avatar name={m.name} presence={m.presence} decorative />}
                  name={m.name}
                  role={m.role}
                  time={m.time}
                  preview={m.preview}
                  unreadCount={m.id === activeChat ? undefined : m.unreadCount}
                  selected={m.id === activeChat}
                  onClick={() => setActiveChat(m.id)}
                />
              ))}
            </ul>
          </Card>
        </div>

        <div className={styles.demoStack}>
          <span className={styles.demoLabel}>Bildirishnoma paneli — NotificationPanel</span>
          <NotificationPanel
            title="Bildirishnomalar"
            tabs={NOTIF_TABS}
            activeTab={notifTab}
            onTabChange={setNotifTab}
            onMarkAllRead={() => {
              setReadMap({ n1: true });
              showToast("Barcha bildirishnomalar o'qilgan deb belgilandi", "success");
            }}
          >
            <NotificationItem
              media={<Avatar name="J Davidson" decorative />}
              title="J. Davidson"
              body="Chegirma dasturiga qo'shildi"
              time="2h oldin"
              category="Takliflar"
              unread={!readMap.n1}
              onToggleRead={() => setReadMap((prev) => ({ ...prev, n1: !prev.n1 }))}
              actions={
                <>
                  <Button fullWidth={false} onClick={() => showToast("Qabul qilindi", "success")}>Qabul qilish</Button>
                  <Button fullWidth={false} variant="secondary" onClick={() => showToast("Rad etildi", "info")}>Rad etish</Button>
                </>
              }
            />
            <NotificationItem
              media={<Avatar name="Mark Dowers" decorative />}
              title="Mark Dowers"
              body="Email orqali yangi hisob yaratdi"
              time="3h oldin"
              category="Referal havola"
            />
          </NotificationPanel>
        </div>
      </section>
    </>
  );
}
