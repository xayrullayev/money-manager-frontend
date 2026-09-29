/**
 * Frontend-CHECK-04 — demonstratsiya uchun chek seed ma'lumotlari.
 *
 * B08 kelishilgan mock response o'rnida (backend hali ulanmagan) mustaqil,
 * deterministik fixture. Shaxsiy chek identifikatori yoki tashqi so'rov yo'q.
 * Sanalar `CHECK_TODAY` atrofida — hafta/oy davrlarini sinash uchun.
 */
import type { CheckDetail } from "./checkTypes";

/** Fixture'lar shu sanaga nisbatan joylashgan (deterministik test uchun). */
export const CHECK_TODAY = "2026-09-29"; // seshanba

export const checkFixtures: CheckDetail[] = [
  {
    // Joriy hafta — POSTED. Ikki "Uzum" qatori bir chekda: 12403 + 12078 = 24481, frequency 1.
    id: "chk_2026_09_29_korzinka",
    merchantName: "Korzinka",
    purchasedAt: "2026-09-29",
    currency: "UZS",
    status: "POSTED",
    items: [
      { code: "00806001001000000", name: "Uzum Shohona Ozb, kg", category: "Mevalar", net: 12403 },
      { code: "00806001001000000", name: "Uzum Husayni Iz Korzinki", category: "Mevalar", net: 12078 },
      { code: "00201003001000000", name: "MolSo'kum, kg", category: "Go'sht mahsulotlari", net: 155575 },
      { code: "00701001001000000", name: "Kartoshka oq Ozb, kg", category: "Sabzavotlar", net: 12100 },
      { code: "03923001002000000", name: "Logotipli paket", category: "", net: 1300 },
    ],
  },
  {
    // Joriy hafta — POSTED.
    id: "chk_2026_09_28_makro",
    merchantName: "Makro",
    purchasedAt: "2026-09-28",
    currency: "UZS",
    status: "POSTED",
    items: [
      { code: "00401001001076004", name: "Sut Lactel 2% 1L", category: "Sut mahsulotlari", net: 15490 },
      { code: "00806001001000000", name: "Uzum Shohona Ozb, kg", category: "Mevalar", net: 9800 },
      { code: "01806003001000000", name: "Konfet Toffee, kg", category: "Shirinliklar", net: 5179 },
    ],
  },
  {
    // Joriy hafta — hali IMPORTED (posted emas) → reytingga qo'shilmaydi.
    id: "chk_2026_09_27_havas",
    merchantName: "Havas",
    purchasedAt: "2026-09-27",
    currency: "UZS",
    status: "IMPORTED",
    items: [
      { code: "01512001001085002", name: "Kungaboqar moyi 1L", category: "Yog' va yormalar", net: 20790 },
      { code: "01104001003004001", name: "Gerkules suli 400g", category: "Yog' va yormalar", net: 4990 },
    ],
  },
  {
    // O'tgan hafta, shu oy — POSTED.
    id: "chk_2026_09_18_korzinka",
    merchantName: "Korzinka",
    purchasedAt: "2026-09-18",
    currency: "UZS",
    status: "POSTED",
    items: [
      { code: "00702001001000000", name: "Pomidor pushti, kg", category: "Sabzavotlar", net: 27089 },
      { code: "00803001001000000", name: "Banan Ekvador, kg", category: "Mevalar", net: 14237 },
      { code: "02201002001017004", name: "Madanli suv 330ml", category: "Ichimliklar", net: 8990 },
    ],
  },
  {
    // O'tgan oy — POSTED (oylik davrga tushmaydi, faqat kengroq tarixда).
    id: "chk_2026_08_15_oasis",
    merchantName: "Oasis",
    purchasedAt: "2026-08-15",
    currency: "UZS",
    status: "POSTED",
    items: [
      { code: "00706001001000000", name: "Sabzi qizil, kg", category: "Sabzavotlar", net: 14670 },
      { code: "01902001001078021", name: "Makaron Makfa 400g", category: "Yog' va yormalar", net: 11490 },
    ],
  },
  {
    // Eng eski — DRAFT (hech qachon reytingga kirmaydi).
    id: "chk_2026_08_02_baraka",
    merchantName: "Baraka Market",
    purchasedAt: "2026-08-02",
    currency: "UZS",
    status: "DRAFT",
    items: [
      { code: "00403003002051002", name: "Qatiq Musaffo 900g", category: "Sut mahsulotlari", net: 17790 },
    ],
  },
];
