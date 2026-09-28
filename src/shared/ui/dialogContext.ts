import { createContext, useContext } from "react";

/** Dialog'ning yopish so'rovi (dirty bo'lsa tasdiq so'raydi). Dialog.tsx beradi. */
export const DialogCloseContext = createContext<(() => void) | null>(null);

/**
 * Dialog ichidagi komponentlar uchun yopish so'rovi — `dirty` bo'lsa tasdiq so'raydi.
 * Dialog tashqarisida chaqirilsa xato (dasturchi xatosi).
 */
export function useDialogClose(): () => void {
  const requestClose = useContext(DialogCloseContext);
  if (!requestClose) throw new Error("useDialogClose() faqat <Dialog> ichida ishlatiladi");
  return requestClose;
}
