import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Card, EmptyState, SkeletonList } from "../../../shared/ui";
import type { BadgeTone } from "../../../shared/ui";
import { ArrowLeftIcon } from "../../../app/navIcons";
import { formatMoney } from "../../../shared/lib/money";
import { getCheckDetail, checkTotal } from "../history";
import type { CheckDetail, CheckLineItem, CheckStatus } from "../history";
import styles from "./ChecksDetailPage.module.css";

type Phase = "loading" | "ready" | "error" | "not-found";

const STATUS_LABEL: Record<CheckStatus, { label: string; tone: BadgeTone }> = {
  POSTED: { label: "Xarajatga qo‘shilgan", tone: "success" },
  IMPORTED: { label: "Import qilingan", tone: "accent" },
  DRAFT: { label: "Qoralama", tone: "neutral" },
};

const UNKNOWN_CATEGORY = "Boshqa";

interface CategoryGroup {
  name: string;
  items: CheckLineItem[];
  total: number;
}

/** Qatorlarni kategoriya bo'yicha guruhlaydi (summasi kamayish tartibida). */
function groupByCategory(items: CheckLineItem[]): CategoryGroup[] {
  const map = new Map<string, CategoryGroup>();
  for (const item of items) {
    const name = item.category.trim() || UNKNOWN_CATEGORY;
    const group = map.get(name) ?? { name, items: [], total: 0 };
    group.items.push(item);
    group.total += item.net;
    map.set(name, group);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

/** `/checks/:id` — bitta chek tafsiloti: qatorlar kategoriya bo'yicha guruhlangan. */
export function ChecksDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("loading");
  const [check, setCheck] = useState<CheckDetail | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setPhase("loading");
    getCheckDetail(id, { signal: controller.signal })
      .then((detail) => {
        if (controller.signal.aborted) return;
        setCheck(detail);
        setPhase("ready");
      })
      .catch((error: unknown) => {
        if ((error as { name?: string })?.name === "AbortError") return;
        setPhase((error as { code?: string })?.code === "not-found" ? "not-found" : "error");
      });
    return () => controller.abort();
  }, [id]);

  const status = check ? STATUS_LABEL[check.status] : null;
  const groups = check ? groupByCategory(check.items) : [];
  const total = check ? checkTotal(check) : 0;

  return (
    <div className={styles.page}>
      <Button variant="ghost" type="button" onClick={() => navigate("/checks")}>
        <span className={styles.back}>
          <ArrowLeftIcon /> Cheklar tarixiga
        </span>
      </Button>

      {phase === "loading" && (
        <Card>
          <SkeletonList rows={5} label="Chek tafsiloti yuklanmoqda…" />
        </Card>
      )}

      {phase === "error" && (
        <EmptyState
          tone="error"
          title="Chekni yuklab bo‘lmadi"
          description="Server bilan bog‘lanishda xatolik yuz berdi."
          action={<Button onClick={() => navigate(0)}>Qayta urinish</Button>}
        />
      )}

      {phase === "not-found" && (
        <EmptyState
          title="Chek topilmadi"
          description="Bu chek o‘chirilgan yoki havola noto‘g‘ri bo‘lishi mumkin."
          action={<Button onClick={() => navigate("/checks")}>Cheklar tarixiga</Button>}
        />
      )}

      {phase === "ready" && check && status && (
        <>
          <header className={styles.header}>
            <div className={styles.headingBlock}>
              <h1 className={styles.title}>{check.merchantName}</h1>
              <p className={styles.meta}>
                {check.purchasedAt} · {check.items.length} ta mahsulot
              </p>
            </div>
            <Badge tone={status.tone}>{status.label}</Badge>
          </header>

          <Card className={styles.totalCard}>
            <span className={styles.totalLabel}>Jami summa</span>
            <strong className={styles.totalValue}>{formatMoney(total, check.currency)}</strong>
          </Card>

          <div className={styles.groups}>
            {groups.map((group) => (
              <Card
                key={group.name}
                title={group.name}
                action={<Badge>{formatMoney(group.total, check.currency)}</Badge>}
              >
                <ul className={styles.itemList}>
                  {group.items.map((item, index) => (
                    <li key={`${item.code}-${index}`} className={styles.item}>
                      <span className={styles.itemMain}>
                        <span className={styles.itemName}>{item.name}</span>
                        <span className={styles.itemCode}>MXIK: {item.code}</span>
                      </span>
                      <span className={styles.itemAmount}>{formatMoney(item.net, check.currency)}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
