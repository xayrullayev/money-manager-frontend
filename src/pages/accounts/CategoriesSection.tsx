import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  archiveCategory,
  createCategory,
  listCategories,
  unarchiveCategory,
  updateCategory,
  type Category,
  type CategoryType,
} from "../../shared/api/categories";
import { ApiError } from "../../shared/api/client";
import { suggestCategoryTokens, toCategoryTokens, type CategoryColorToken, type CategoryIconKey } from "../../shared/lib/categoryTokens";
import { Button } from "../../shared/ui/Button";
import { CategoryAppearancePicker } from "../../shared/ui/CategoryAppearancePicker";
import { CategoryIcon } from "../../shared/ui/CategoryIcon";
import { Dialog, DialogCancelButton } from "../../shared/ui/Dialog";
import { EmptyState } from "../../shared/ui/EmptyState";
import { SkeletonList } from "../../shared/ui/Skeleton";
import { Input } from "../../shared/ui/Input";
import { Select } from "../../shared/ui/Select";
import styles from "./AccountsPage.module.css";

const TYPE_LABELS: Record<CategoryType, string> = { INCOME: "Daromad", EXPENSE: "Xarajat" };
const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));
const message = (error: unknown) => (error instanceof ApiError ? error.message : "Ma'lumotlarni yuklab bo'lmadi. Qayta urinib ko'ring.");

/**
 * Design-07: Kategoriyalar boshqaruvi. Daromad/xarajat kategoriyalarini
 * yaratish va tahrirlash; tarixli kategoriya o'chirilmaydi, arxivlanadi —
 * arxivlangan kategoriya yangi operatsiyalarda tanlash uchun ko'rinmaydi
 * (bu filtr AddTransactionDialog'da allaqachon bor: `!c.archived`), lekin
 * eski operatsiyalarda nomi saqlanib qoladi. Arxivdan chiqarish bir bosishda
 * (backend idempotent, tarixga ta'sir qilmaydi).
 */

type EditorState = { category: Category } | { category: null; type: CategoryType };
export function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [archiving, setArchiving] = useState<Category | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listCategories({ includeArchived })
      .then((items) => {
        if (!cancelled) {
          setCategories(items);
          setStatus("ready");
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(message(cause));
          setStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [includeArchived, revision]);

  function refresh(text = "") {
    setNotice(text);
    setError("");
    setStatus("loading");
    setRevision((value) => value + 1);
  }

  async function restore(category: Category) {
    if (restoring) return;
    setRestoring(category.id);
    setRestoreError("");
    try {
      await unarchiveCategory(category.id);
      refresh(`"${category.name}" arxivdan chiqarildi — yangi operatsiyalarda yana tanlanadi.`);
    } catch (cause) {
      setRestoreError(message(cause));
    } finally {
      setRestoring(null);
    }
  }

  const openNew = (type: CategoryType) => { setNotice(""); setEditor({ category: null, type }); };

  const groups: { type: CategoryType; items: Category[] }[] = (["EXPENSE", "INCOME"] as const).map((type) => ({
    type,
    items: categories.filter((category) => category.type === type),
  }));

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <p>Xarajat va daromadlaringizni ma'noli guruhlarga ajrating.</p>
        <Button onClick={() => openNew("EXPENSE")}>+ Kategoriya qo'shish</Button>
      </div>
      {notice && <p className={styles.notice} role="status">{notice}</p>}
      {restoreError && <p className={styles.error} role="alert">{restoreError}</p>}
      <div className={styles.toolbar}>
        <span>{includeArchived ? "Barcha kategoriyalar" : "Faol kategoriyalar"}{status === "ready" ? ` · ${categories.length}` : ""}</span>
        <label className={styles.checkbox}>
          <input type="checkbox" checked={includeArchived} onChange={(event) => { setStatus("loading"); setIncludeArchived(event.target.checked); }} />
          Arxivlanganlarni ko'rsatish
        </label>
      </div>
      {status === "loading" && <SkeletonList rows={5} label="Kategoriyalar yuklanmoqda…" />}
      {status === "error" && (
        <EmptyState
          tone="error"
          title="Kategoriyalarni yuklab bo'lmadi"
          description={error}
          action={<Button variant="secondary" onClick={() => refresh()}>Qayta urinish</Button>}
        />
      )}
      {status === "ready" && categories.length === 0 && (
        <EmptyState
          icon="🏷️"
          title="Hali kategoriya yo'q"
          description="Xarajat yoki daromad turlarini guruhlash uchun birinchi kategoriyangizni qo'shing."
          action={<Button variant="secondary" onClick={() => openNew("EXPENSE")}>Birinchi kategoriyani qo'shish</Button>}
        />
      )}
      {status === "ready" && categories.length > 0 && (
        <div className={styles.categoryGroups}>
          {groups.map((group) => (
            <section key={group.type} className={styles.categoryGroup} aria-label={TYPE_LABELS[group.type]}>
              <div className={styles.categoryGroupHeader}>
                <h2 className={styles.categoryGroupTitle}>{TYPE_LABELS[group.type]}</h2>
                <Button variant="ghost" onClick={() => openNew(group.type)} aria-label={`${TYPE_LABELS[group.type]} kategoriyasini qo'shish`}>+ Qo'shish</Button>
              </div>
              {group.items.length === 0 ? (
                <p className={styles.hint}>Bu turda kategoriya yo'q.</p>
              ) : (
                <ul className={styles.categoryList}>
                  {group.items.map((category) => (
                    <li key={category.id} className={styles.categoryRow}>
                      <span className={styles.categoryName}>
                        <CategoryIcon iconKey={category.iconKey} colorToken={category.colorToken} size="sm" />
                        <span>{category.name}</span>
                        {category.archived && <span className={styles.badge}>Arxivlangan</span>}
                      </span>
                      <span className={styles.actions}>
                        {!category.archived ? (
                          <>
                            <Button variant="secondary" onClick={() => setEditor({ category })}>Tahrirlash</Button>
                            <Button variant="ghost" onClick={() => setArchiving(category)}>Arxivlash</Button>
                          </>
                        ) : (
                          <Button
                            variant="secondary"
                            loading={restoring === category.id}
                            disabled={restoring !== null && restoring !== category.id}
                            onClick={() => void restore(category)}
                            aria-label={`"${category.name}" kategoriyasini arxivdan chiqarish`}
                          >
                            Arxivdan chiqarish
                          </Button>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
      <p className={styles.footnote}>Arxivlangan kategoriya yangi operatsiyalarda tanlab bo'lmaydi, lekin eski operatsiyalarda nomi saqlanadi.</p>
      {editor && (
        <CategoryEditor
          category={editor.category}
          initialType={editor.category ? editor.category.type : editor.type}
          onClose={() => setEditor(null)}
          onSaved={() => {
            const created = editor.category === null;
            setEditor(null);
            refresh(created ? "Kategoriya qo'shildi." : "Kategoriya yangilandi.");
          }}
        />
      )}
      {archiving && (
        <ArchiveCategoryDialog category={archiving} onClose={() => setArchiving(null)} onArchived={() => { setArchiving(null); refresh("Kategoriya arxivlandi."); }} />
      )}
    </div>
  );
}

function CategoryEditor({
  category,
  initialType,
  onClose,
  onSaved,
}: {
  category: Category | null;
  initialType: CategoryType;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [type, setType] = useState<CategoryType>(initialType);
  const initialTokens = category ? toCategoryTokens(category.iconKey, category.colorToken) : suggestCategoryTokens("", initialType);
  const [iconKey, setIconKey] = useState<CategoryIconKey>(initialTokens.iconKey);
  const [colorToken, setColorToken] = useState<CategoryColorToken>(initialTokens.colorToken);
  // Yangi kategoriyada foydalanuvchi tanlovga tegmaguncha belgi/rang nomga qarab taklif qilinadi.
  const [picked, setPicked] = useState(category !== null);

  const dirty = category
    ? name !== category.name || iconKey !== initialTokens.iconKey || colorToken !== initialTokens.colorToken
    : name.trim() !== "" || picked;

  function suggest(nextName: string, nextType: CategoryType) {
    if (picked) return;
    const tokens = suggestCategoryTokens(nextName.trim(), nextType);
    setIconKey(tokens.iconKey);
    setColorToken(tokens.colorToken);
  }
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (locked.current) return;
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Kategoriya nomini kiriting.";
    setFields(next);
    setError("");
    if (Object.keys(next).length) return;
    locked.current = true;
    setBusy(true);
    try {
      if (category) await updateCategory(category.id, { name: name.trim(), iconKey, colorToken });
      else await createCategory({ name: name.trim(), type, iconKey, colorToken });
      onSaved();
    } catch (cause) {
      setError(message(cause));
      if (cause instanceof ApiError) setFields(cause.fieldErrors ?? {});
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  return (
    <Dialog title={category ? "Kategoriyani tahrirlash" : "Yangi kategoriya"} onClose={onClose} preventClose={busy} dirty={dirty}>
      <form onSubmit={submit} className={styles.form} noValidate>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <Input
          label="Kategoriya nomi"
          value={name}
          onChange={(value) => { setName(value); suggest(value, type); }}
          maxLength={60}
          disabled={busy}
          placeholder="Masalan, Oziq-ovqat"
          error={fields.name}
        />
        {!category ? (
          <Select
            label="Turi"
            value={type}
            onChange={(value) => { setType(value as CategoryType); suggest(name, value as CategoryType); }}
            options={TYPE_OPTIONS}
            disabled={busy}
          />
        ) : (
          <p className={styles.hint}>Turi: {TYPE_LABELS[category.type]}. Yaratilgandan keyin tur o'zgartirilmaydi — mavjud operatsiyalar shu turga bog'liq.</p>
        )}
        <CategoryAppearancePicker
          iconKey={iconKey}
          colorToken={colorToken}
          onIconChange={(value) => { setPicked(true); setIconKey(value); }}
          onColorChange={(value) => { setPicked(true); setColorToken(value); }}
          disabled={busy}
        />
        {(fields.iconKey || fields.colorToken) && <p className={styles.error} role="alert">{fields.iconKey ?? fields.colorToken}</p>}
        <div className={styles.formActions}>
          <DialogCancelButton disabled={busy} />
          <Button type="submit" loading={busy}>Saqlash</Button>
        </div>
      </form>
    </Dialog>
  );
}

function ArchiveCategoryDialog({ category, onClose, onArchived }: { category: Category; onClose: () => void; onArchived: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const locked = useRef(false);

  async function archive() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      await archiveCategory(category.id);
      onArchived();
    } catch (cause) {
      setError(message(cause));
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  return (
    <Dialog title="Kategoriyani arxivlash" onClose={onClose} preventClose={busy}>
      <p className={styles.archiveText}>"{category.name}" kategoriyasi yangi operatsiyalar uchun ko'rinmaydi. Eski operatsiyalar va hisobotlarda nomi saqlanadi. Keyin "Arxivlanganlarni ko'rsatish" orqali arxivdan chiqarishingiz mumkin.</p>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.formActions}>
        <Button variant="secondary" disabled={busy} onClick={onClose}>Bekor qilish</Button>
        <Button loading={busy} onClick={() => void archive()}>Arxivlash</Button>
      </div>
    </Dialog>
  );
}
