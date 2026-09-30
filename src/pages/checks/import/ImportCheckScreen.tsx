import { useEffect, useRef, useState } from "react";
import { Button, EmptyState } from "../../../shared/ui";
import { formatMoney } from "../../../shared/lib/money";
import { importErrorMessage } from "./importSource";
import { useCheckImport, type UseCheckImportOptions } from "./useCheckImport";
import { useQrScanner } from "./useQrScanner";
import type { ImportedCheck } from "./checkImportApi";
import styles from "./ImportCheckScreen.module.css";

export interface ImportCheckScreenProps {
  /**
   * Chek muvaffaqiyatli import qilinganda chaqiriladi. Navigatsiya shu callback
   * orqali — ekran global route'ni tahrir qilmaydi (mustaqil export).
   */
  onImported?: (check: ImportedCheck) => void;
  /** "Bekor qilish" / orqaga — ixtiyoriy. */
  onCancel?: () => void;
  /** Test uchun import funksiyasini inject qilish. */
  importOptions?: UseCheckImportOptions;
}

/**
 * Frontend-CHECK-02 — QR va havola orqali chek import ekrani.
 *
 * Ikkala yo'l ham (kamera QR / havola paste) bir xil validatsiya va import
 * mantiqidan o'tadi. Kamera aniq harakat bilan yoqiladi; qo'llab-quvvatlanmasa
 * yoki rad etilsa havola fallback ishlaydi.
 */
export function ImportCheckScreen({ onImported, onCancel, importOptions }: ImportCheckScreenProps) {
  const { status, lastCheck, submit, reset } = useCheckImport(importOptions ?? {});
  const [linkValue, setLinkValue] = useState("");

  // `submit` `useCallback` bilan barqaror; `useQrScanner` uni ref'da saqlaydi.
  const scanner = useQrScanner({ onScan: submit });

  // Import muvaffaqiyatli bo'lganda kamerani to'xtatib, natijani yuqoriga uzatamiz.
  const importedRef = useRef<string | null>(null);
  useEffect(() => {
    if (status.phase === "success" && lastCheck && importedRef.current !== lastCheck.id) {
      importedRef.current = lastCheck.id;
      scanner.stop();
      onImported?.(lastCheck);
    }
  }, [status.phase, lastCheck, scanner, onImported]);

  const processing = status.phase === "processing";

  const handleLinkSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (processing) return;
    submit(linkValue);
  };

  const handleRetry = () => {
    reset();
    importedRef.current = null;
  };

  return (
    <div className={styles.screen} aria-labelledby="import-check-title">
      <header className={styles.header}>
        <h1 id="import-check-title" className={styles.title}>
          Chek import qilish
        </h1>
        <p className={styles.subtitle}>
          Kamera bilan QR kodni skanerlang yoki chek havolasini qo'ying.
        </p>
      </header>

      {/* ── Kamera / QR bloki ── */}
      <section className={styles.section} aria-label="QR skaner">
        <div className={styles.viewport}>
          <video
            ref={scanner.videoRef}
            className={styles.video}
            data-active={scanner.state === "scanning" || undefined}
            aria-label="Kamera ko'rinishi"
          />
          {scanner.state === "scanning" && <div className={styles.reticle} aria-hidden="true" />}
          {scanner.state !== "scanning" && (
            <div className={styles.viewportOverlay}>
              {scanner.state === "denied" && (
                <p className={styles.overlayText} role="alert">
                  {importErrorMessage("camera-denied")}
                </p>
              )}
              {scanner.state === "unsupported" && (
                <p className={styles.overlayText} role="alert">
                  {importErrorMessage("camera-unavailable")}
                </p>
              )}
              {scanner.state === "error" && (
                <p className={styles.overlayText} role="alert">
                  Kamerani ochib bo'lmadi. Havola orqali import qiling.
                </p>
              )}
              {(scanner.state === "idle" || scanner.state === "starting") && (
                <p className={styles.overlayText}>QR kodni skanerlash uchun kamerani yoqing.</p>
              )}
            </div>
          )}
        </div>

        <div className={styles.cameraActions}>
          {scanner.state === "scanning" ? (
            <Button variant="secondary" type="button" onClick={scanner.stop}>
              Kamerani to'xtatish
            </Button>
          ) : (
            <Button
              type="button"
              onClick={scanner.start}
              loading={scanner.state === "starting"}
              disabled={processing}
            >
              Kamerani yoqish
            </Button>
          )}
        </div>
      </section>

      <div className={styles.divider} aria-hidden="true">
        <span>yoki</span>
      </div>

      {/* ── Havola fallback ── */}
      <section className={styles.section} aria-label="Havola orqali import">
        <form className={styles.linkForm} onSubmit={handleLinkSubmit}>
          <label className={styles.linkLabel} htmlFor="check-link">
            Chek havolasi
          </label>
          <input
            id="check-link"
            className={styles.linkInput}
            type="url"
            inputMode="url"
            placeholder="https://ofd.soliq.uz/check?..."
            value={linkValue}
            onChange={(event) => setLinkValue(event.target.value)}
            disabled={processing}
            autoComplete="off"
          />
          <Button type="submit" loading={processing} disabled={processing || linkValue.trim() === ""}>
            Import qilish
          </Button>
        </form>
      </section>

      {/* ── Holat: progress / xato / muvaffaqiyat ── */}
      <div className={styles.statusArea} aria-live="polite">
        {processing && (
          <div className={styles.processing} role="status">
            <div className={styles.progressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={status.progress} aria-label="Chek o'qilmoqda">
              <span className={styles.progressFill} style={{ width: `${status.progress}%` }} />
            </div>
            <p className={styles.processingText}>Chek o'qilmoqda… {status.progress}%</p>
          </div>
        )}

        {status.phase === "error" && status.errorCode && (
          <EmptyState
            tone="error"
            compact
            title="Import amalga oshmadi"
            description={importErrorMessage(status.errorCode)}
            action={
              <Button type="button" onClick={handleRetry}>
                Qayta urinish
              </Button>
            }
          />
        )}

        {status.phase === "success" && lastCheck && (
          <div className={styles.successCard} role="status">
            <p className={styles.successBadge}>Chek import qilindi</p>
            <p className={styles.successMerchant}>{lastCheck.merchantName}</p>
            <p className={styles.successAmount}>{formatMoney(lastCheck.totalAmount, lastCheck.currency)}</p>
            <p className={styles.successMeta}>
              {lastCheck.purchasedAt} · {lastCheck.itemCount} ta mahsulot
            </p>
          </div>
        )}
      </div>

      {onCancel && (
        <div className={styles.footer}>
          <Button variant="ghost" type="button" onClick={onCancel}>
            Bekor qilish
          </Button>
        </div>
      )}
    </div>
  );
}
