# Money Manager — Frontend

React + TypeScript (Vite) ilovasi. `money-manager` monorepo'ning `front/` qismi.

## Ishga tushirish

```bash
npm install
cp .env.example .env.local   # kerak bo'lsa API manzilini o'zgartiring
npm run dev
```

- `npm run build` — typecheck + production build
- `npm run typecheck` — faqat `tsc -b`
- `npm run lint` — oxlint
- `npm test` — util testlari (`node:test`)
- `npm run preview` — build natijasini lokal ko'rish

Node versiyasi `.nvmrc`da (22.12.0). Toza o'rnatish va CI — faqat `npm ci` (lockfile'dagi aniq versiyalar). Stack va versiya siyosati: [`docs/adr/0001-frontend-stack.md`](../docs/adr/0001-frontend-stack.md). CI: [`.github/workflows/frontend-ci.yml`](../.github/workflows/frontend-ci.yml) — lint → typecheck → test → build.

## Arxitektura (Frontend-01)

```
src/
  app/              router, AuthContext (sessiya holati), ErrorBoundary, ProtectedRoute, AppShell (sidebar/bottom nav)
  pages/
    auth/           PhoneEntryScreen, OtpVerifyScreen, AuthLayout (Design-AUTH-01/02, Design-03)
    onboarding/     OnboardingScreen (valyuta/timezone/birinchi hisob)
    dashboard/      DashboardPage (Design-04), AddTransactionDialog (Design-05, qisman)
  shared/
    api/            axios client (cookie session + CSRF), Problem Details error modeli,
                     auth/onboarding/accounts/categories/transactions/dashboard endpointlari
    ui/             Button, PhoneInput, OtpInput — qayta ishlatiladigan komponentlar
    hooks/          useCountdown (SMS resend taymeri)
    lib/            money.ts (formatlash, idempotency key), period.ts (davr filtri)
  styles/           design tokens (rang/spacing/radius/breakpoint), light+dark mode
```

## Bajarilgan Trello tasklari

- **Frontend-01** — React+TS asos, routing, API client, design tokens, error boundary, `.env` konfiguratsiyasi, AppShell (sidebar/bottom nav); 2026-09-24: deep-link qaytishi, route error sahifasi, skip-link/fokus/title, sticky mobil nav, CI va stack ADR (yuqoridagi "App shell" bo'limi).
- **Frontend-02** (qisman) — auth/onboarding oqimi va Dashboard/operatsiya qo'shish (idempotency key, decimal string amount, backend authoritative balance holati).
- **Design-02** — CSS custom properties sifatida rang/tipografiya/spacing/radius/breakpoint tokenlari, WCAG AA maqsadli kontrast, 44px touch target.
- **Design-03** — telefon + SMS kod orqali ro'yxatdan o'tish oqimi (email/parolsiz), onboarding registratsiyadan ajratilgan alohida bosqich sifatida.
- **Design-AUTH-01** — telefon raqami kiritish ekrani (mask, +998 country code, validatsiya holatlari, numeric keypad, dark mode).
- **Design-AUTH-02** — 6 xonali OTP ekrani (auto-focus, paste, autofill, auto-submit, countdown, shake xato animatsiyasi).
- **Design-04** — Dashboard: haqiqiy Figma skrinshotiga (desktop, Bosh sahifa) moslab qurildi — sarlavha+CTA, davr filtri (joriy oy nomi bilan, masalan "Sentabr 2026"), 3 ta teng xulosa kartasi (Jami qoldiq/Daromad/Xarajat), alohida "Qoldiqni yashirish" tugmasi, ikki ustunli grid (So'nggi operatsiyalar — sana bo'yicha guruhlangan + Oylik budjet — umumiy progress va kategoriya ro'yxati), footer izohi, loading/empty/error holatlari. Rang tokenlari (--color-primary-*, --color-income) Figma dizayniga mos quyuq yashil/teal aksentga o'zgartirildi (avval ko'k edi).
- **Frontend-check-01** — API client turlari tekshirildi va butun `/api/v1` kontrakti uchun brauzer ichidagi mock javob qatlami qo'shildi (`src/shared/api/mock/`, `VITE_API_MOCK`); real backendsiz UI/QA. Batafsil pastdagi "Mock API" bo'limida.
- **Frontend-check-03** — Chek (operatsiya) tafsiloti ekrani: `/transactions/:id` — bitta operatsiyani chek ko'rinishida to'liq ko'rsatadi (tur, summa, sana, hisob(lar), kategoriya, valyuta, izoh, ID), Tahrirlash / O'chirish / "Xarajatga saqlash" (nusxa) amallari bilan. Batafsil pastdagi "Chek tafsiloti" bo'limida.
- **Design-05** (qisman) — Operatsiya qo'shish dialogi: Xarajat/Daromad/O'tkazma tab, desktop dialog/mobile sheet (bitta responsive komponent), amount>0 validatsiyasi, category faqat mos type, bitta hisobga transfer taqiqlangan, dublyaj submit bloklanadi, saving/success/error holatlari. Tahrirlash/o'chirish dialoglari hali yo'q.

## App shell (Frontend-01)

- **Layout route:** himoyalangan sahifalar bitta `ProtectedRoute > AppShell > <Outlet/>` ostida (`app/router.tsx`) — shell navigatsiyada qayta mount bo'lmaydi.
- **Deep-link:** sessiyasiz ochilgan himoyalangan manzil (query/hash bilan) eslab qolinadi va login yoki onboarding'dan keyin o'sha yerga qaytiladi (`shared/lib/returnTo.ts`; faqat ilova ichidagi nisbiy yo'l — open redirect yo'q; o'zi "Chiqish"ni bosganda eslab qolinmaydi).
- **Xatolar:** sahifa ichidagi render xatosi `RouteErrorPage` (router `errorElement`), provider darajasidagisi `ErrorBoundary` — ikkalasi bir xil `ErrorFallback`, stack trace ko'rsatilmaydi. `/auth/me` tarmoq/5xx xatosida login'ga otilmaydi — "Server bilan bog'lanib bo'lmadi" + "Qayta urinish" (faqat 401 = sessiya yo'q).
- **Klaviatura / a11y:** birinchi Tab — "Asosiy kontentga o'tish" skip-link; sahifa (pathname) almashganda fokus `<main>`ga o'tadi (query o'zgarishi fokusni olmaydi); har sahifada `document.title` ("Budjetlar · Money Manager", `shared/lib/pageTitle.ts`); faol havolada `aria-current="page"`; fokus halqasi `--focus-ring` (oq bo'shliq + primary-500, oq fonda ~8:1).
- **Mobil (<768):** pastki nav sticky (safe-area bilan); "Yana" menyusi Escape / tashqariga bosish / havola tanlash bilan yopiladi, Escape'da fokus tugmaga qaytadi; Hisoblar/Hisobotlar/Sozlamalar ochiq bo'lsa "Yana" faol ko'rinadi. Qatlamlar `--z-nav`/`--z-dropdown`/`--z-skip-link` tokenlari bilan.
- **QA (2026-09-24):** real backend + PostgreSQL 18 bilan Playwright — 6 sahifa × 320/390/768/1440, gorizontal scroll 0; shell tekshiruvlari (deep-link, xato ekranlari, 503/retry, skip-link, fokus, title, sticky nav, "Yana" menyusi, 404) dev va production build'da o'tdi.

## Auth oqimi

```
/register  → /register/verify → /onboarding → /
/login     → /login/verify    → /            (agar onboarding oldin tugagan bo'lsa)
```

Login va registratsiya bir xil UI/API'ni ishlatadi (Design-03: "keyingi kirish usuli bu
o'zgarishda alohida belgilanmagan"); backend `verify` javobidagi `isNewUser` orqali
onboardingga yo'naltirish yoki to'g'ridan-to'g'ri kirishni aniqlaydi.

## Bosh sahifa (Dashboard) oqimi

`/` — `ProtectedRoute` (sessiya yo'q bo'lsa `/login`ga, onboarding tugallanmagan bo'lsa
`/onboarding`ga yo'naltiradi) → `AppShell` (sidebar desktopda, bottom nav mobileda —
hozircha faqat "Bosh sahifa" faol, qolganlari Design-06/07 tayyor bo'lgach ulanadi) →
`DashboardPage`:

- Davr filtri (`Bu oy` / `O'tgan oy` / `So'nggi 30 kun`) → `/dashboard/summary?from&to`.
- Jami qoldiq karta — `Yashirish/Ko'rsatish` toggle, holat `localStorage`da saqlanadi.
- Shu davrdagi daromad/xarajat — signed format (+/−), rang + matn (faqat rang emas).
- Oylik budjet progressi — kategoriya, sarflangan/limit, foiz, progress bar; limitdan
  oshganda qizil holat.
- So'nggi operatsiyalar ro'yxati — tur ikonkasi, kategoriya/hisob, sana, signed summa.
- "+ Xarajat qo'shish" CTA → `AddTransactionDialog` (Design-05): Xarajat/Daromad/
  O'tkazma, hisob/kategoriya `listAccounts`/`listCategories`dan yuklanadi, submit
  `Idempotency-Key` header bilan (Bakend-10 qabul mezoni).

## Backend contract holati

`src/shared/api/*.ts` dagi endpoint yo'llari va javob shakllari Trello kartalar (Bakend-04,
07, 08, 09, 10, 11, 12) tavsifidan olingan, lekin **hali implement qilinmagan/final emas** —
ayniqsa auth (Bakend-04 email/parol yozgan, Design-03 esa telefon/SMS talab qiladi — handoff
eslatmasi). Backend tayyor bo'lgach shu fayllardagi yo'l/javob shakllari moslashtiriladi;
UI/state logikasi asosan o'zgarishsiz qoladi. Hozircha real backend bo'lmagani sabab
Dashboard/dialog ekranlarini ko'rish uchun `/api/v1` mock server yoki backendni ishga
tushirish kerak (`.env.local`dagi `VITE_API_BASE_URL`).

## Mock API (Frontend-check-01)

Real backend hali tayyor emas (yuqoridagi "Backend contract holati"). Shu sabab
`src/shared/api/mock/` da butun `/api/v1` kontraktining brauzer ichidagi in-memory
mock implementatsiyasi bor — real backendsiz Dashboard/dialog/hisobot/jamg'arma
ekranlarini ko'rish va QA qilish uchun.

Yoqish:

```bash
echo "VITE_API_MOCK=1" >> .env.local   # yoki .env.example'dagi qiymatni 1 qiling
npm run dev
```

- Mock rejimda `apiClient` adapteri `main.tsx` da render'dan oldin almashtiriladi —
  hech qanday tarmoq so'rovi ketmaydi, `console`da bir marta ogohlantirish chiqadi.
- **OTP kod har doim `111111`.** Demo telefon `+998901234567` — onboarding tugagan
  (to'g'ridan-to'g'ri Dashboardga), boshqa raqamlar — yangi foydalanuvchi (onboarding).
- Ma'lumotlar sahifa ochilganda seed qilinadi va sahifa yopilguncha saqlanadi;
  create/update/delete mutatsiyalari holatga yoziladi (balans, budjet foizi,
  jamg'arma progressi qayta hisoblanadi), shuning uchun UI real backenddagidek javob beradi.
- Xatolar Bakend-13 "Problem Details" shaklida qaytadi (`400`, `404`,
  `409 STALE_VERSION`, `401`), idempotency-key retry bir xil natija beradi (Bakend-10),
  CSV eksport `text/csv` Blob qaytaradi.
- **Turlar tekshiruvi:** mock javoblari `src/shared/api/*.ts` kontrakt interfeyslariga
  bog'langan, shuning uchun `tsc` mock data'ni kontraktga qarab tekshiradi.
- **Testlar:** `tests/mockApi.test.mjs` (11 test) `dispatch`ni to'g'ridan-to'g'ri
  (axios/brauzersiz) sinaydi — seed, balans ta'siri, idempotency, versiya konflikti,
  dashboard kontrakti, auth, daily-limit, savings, 404. `npm test` bilan ishga tushadi.

Ishlab chiqarish (mock o'chirilgan, standart) buildida bu qatlam no-op — real backend
`VITE_API_BASE_URL` orqali ishlatiladi.

## Chek tafsiloti (Frontend-check-03)

`/transactions/:id` — bitta operatsiyaning **chek (kvitansiya) ko'rinishidagi to'liq
tafsilot ekrani**. Operatsiyalar ro'yxatidagi tafsilot oynasidan "To‘liq chek
ko‘rinishi →" havolasi orqali ochiladi (`getTransaction` bilan id bo'yicha yuklanadi).

- **Ko'rinish:** tur belgisi (rang bilan), sarlavha (kategoriya / "Hisoblararo
  o‘tkazma"), katta belgi bilan summa, tishli ajratgich, va qatorlar — sana,
  hisob yoki qayerdan→qayerga (transfer), kategoriya, valyuta, izoh, operatsiya ID.
- **Amallar:**
  - **Tahrirlash** — mavjud `AddTransactionDialog` (tur o'zgarmaydi, `expectedVersion`,
    409 STALE_VERSION jim overwrite qilinmaydi); saqlangach ekran yangilanadi.
  - **O‘chirish** — `DeleteTransactionDialog` tasdig'i, so'ng ro'yxatga qaytadi
    (`version` mos kelmasa 409 xato toast bilan ko'rsatiladi).
  - **Xarajatga saqlash** — shu operatsiyadan **yangi xarajat nusxasini** oldindan
    to'ldirib ochadi (summa/sana/izoh, xarajat bo'lsa hisob/kategoriya ham);
    saqlangach yangi operatsiyaning chek ekraniga o'tadi. Asl operatsiya o'zgarmaydi.
    Buning uchun `AddTransactionDialog`ga `template` propi qo'shildi (faqat yaratish rejimida).
- **Holatlar:** loading skeleti, topilmadi (404), xato + qayta urinish, orqaga havola.
- Mock rejimda ham to'liq ishlaydi (`GET/PATCH/DELETE /transactions/:id`).
  Tekshiruv: `tests/mockApi.test.mjs` da id bo'yicha olish, 404 va versiya konflikti testlari.

## Keyingi qadamlar

- **Design-05 qolgani** — tahrirlash/o'chirish dialogi, saving/error visual states to'liq QA.
- **Design-06** — Operatsiyalar ro'yxati va qidiruv (filtr, sahifalash, desktop jadval/mobile guruhlangan ro'yxat).
- **Design-07** — Hisoblar va kategoriyalar boshqaruvi (yaratish/tahrirlash/arxivlash).
- AppShelldagi "Operatsiyalar/Hisoblar/Sozlamalar" nav itemlarini navigatsiyaga ulash.
- Edit conflict UX (409 → version mismatch) va logoutda boshqa user cache tozalash — Frontend-02 qolgan qabul mezonlari.

## Operatsiyalar ro‘yxati

`/transactions` — himoyalangan operatsiyalar tarixi. Desktopda jadval, telefonda sana bo‘yicha guruhlangan ro‘yxat. Sidebar va mobil Tarix havolasi ulangan.

- Izoh bo‘yicha 300 ms qidiruv; tur, hisob, kategoriya va sana filtrlari URLda saqlanadi. Brauzer Back/Forward filtrlarni tiklaydi.
- Arxivlangan hisob va kategoriyalar ham tarix filtrida mavjud. Transfer tanlanganda kategoriya filtri o‘chiriladi.
- Server cursor orqali 20 tadan yozuv olinadi. Keyingi sahifa xatosida oldingi natijalar saqlanadi; filtr almashtirilganda eskirgan javoblar e’tiborsiz qoldiriladi.
- Ro‘yxatdagi operatsiya tafsilotlarini ochib to‘liq izohni o‘qish mumkin. Tahrirlash va o‘chirish bu vazifa doirasiga kirmaydi.
- Amaldagi API faqat izoh bo‘yicha qidiradi; kategoriya nomi uchun alohida kategoriya filtri bor.
- Trello ulanishi mavjud bo‘lmagani uchun karta qabul mezonlari va statusi jonli tekshirilmadi.

### Filtrlangan jamlar va real backend integratsiyasi

Boshlanish va tugash sanasi tanlanganda `/reports/summary` aynan operatsiyalar ro‘yxatidagi tur, hisob, kategoriya va izoh qidiruvi filtrlari bilan chaqiriladi. Daromad, xarajat va sof farq server hisoblagan qiymatlardan ko‘rsatiladi. Davr to‘liq tanlanmasa joriy oy qiymatini “butun tarix jami” deb noto‘g‘ri ko‘rsatmaydi; foydalanuvchiga ikkala sanani tanlash va 366 kunlik limit tushuntiriladi. `TRANSFER` filtri summary endpointiga yuborilmaydi, chunki o‘tkazmalar jamga kirmaydi.

Izolyatsiyalangan Spring Boot/H2 serverida haqiqiy frontend API modullari bilan 15 ta HTTP tekshiruv o‘tdi: dashboard balans/jam/recent reconciliation, tur+kategoriya, hisob va izoh qidiruvi bo‘yicha jamlar, transfer/opening exclusion, CSV encoding va xavfsizlik, bo‘sh davr, 367 kunlik xato, ownership va sessiya tugashi. Test faqat yangi sintetik foydalanuvchi yaratadi; `tests/reports.integration.mjs` explicit `--isolated-test-server` va `--otp-log` parametrlarisiz ishga tushmaydi.

## Oylik budjetlar (Frontend-03)

`/budgets?month=YYYY-MM` — profil timezone bo‘yicha joriy oy, URL/Back bilan davrni tiklash, faol xarajat kategoriyasiga limit yaratish, limitni tahrirlash va tasdiqlab olib tashlash. Summalar APIga string sifatida yuboriladi; sarf/remaining/foiz serverdan olinadi. 80% dan ogohlantirish, >100% uchun matn+belgi va oshgan summa. Kategoriya havolasi tanlangan oy va kategoriya filtrli `/transactions`ni ochadi.

Loading/empty/error/retry, offline saqlash xabari, double-submit himoyasi, dirty-form tasdig‘i, 5s slow hint, summa maxfiyligi va mobil navigatsiya qo‘shilgan.

## Hisobot, CSV va sozlamalar (Frontend-03)

`/reports` — profil vaqt mintaqasi bo‘yicha oy/yil/maxsus davr, hisob filtri, server jamlari, kategoriya ulushi va oylar jadvali. Transferlar jamlarga kirmaydi. Kategoriya havolasi filtrlangan operatsiyalarni ochadi. Barcha hisoblar arxivlanganlarni ham qamraydi — bu interfeysda ko‘rsatilgan.

CSV shu sana va hisob filtridan foydalanadi; UTF-8 fayl backenddan olinadi, sana oralig‘i fayl nomida va ekranda ko‘rinadi. Foydalanuvchi qarori: hozircha bir eksportda ko‘pi bilan **366 kun**; uzunroq davr yuborilmaydi. Bo‘sh natija, xato/qayta urinish, uzoq kutish va takroriy bosish holatlari ko‘zda tutilgan.

`/settings` — ism va vaqt mintaqasini saqlash, mahalliy vaqt namunasi, eksportga havola va chiqishni tasdiqlash. API valyuta almashtirishni qo‘llamagani sabab valyuta faqat o‘qiladi.

Tekshiruv: 23 ta util testi, build va lint. Budjet 320/390/768/1440 px o‘lchamlarda mock API bilan tekshirildi. Hisobotda CSV yuklab olish boshlanishi, 366 kundan uzun davr rad etilishi va profil vaqt mintaqasini saqlash mock API bilan tekshirildi. Bu real backend yoki haqiqiy telefon sinovi o‘rnini bosmaydi.

Qolgan release QA: real backend bilan end-to-end va haqiqiy mobil brauzer tekshiruvi. Budjet limitlarini keyingi oyga default ko‘chirish backendda mavjud emas. Hisobotning barcha hisoblar filtri backend kontraktiga ko‘ra arxivlarni ham oladi. Shu sabab Frontend-03 hali yakunlangan deb belgilanmagan.


### Budjet va profil integratsiyasi — 2026-09-24

Haqiqiy Spring Boot backend alohida `test` profilidagi H2 bazada tekshirildi; mavjud foydalanuvchi ma’lumotlariga tegilmadi. Frontendning haqiqiy `shared/api/budgets.ts` va `profile.ts` modullari orqali profil GET/PATCH va saqlanishi, noto‘g‘ri timezone, budjet create/list/update/delete, takroriy limit 409, boshqa user uchun 404 va budjet o‘chirilganda operatsiyalar saqlanishi tekshirildi (9 guruh tekshiruv).

Brauzerda haqiqiy cookie/CSRF bilan login/onboarding, budjet yaratish/tahrirlash va refreshdan keyingi saqlanishi, profil ismi/timezone saqlanishi tekshirildi. `exceeded=true` bo‘lsa, foiz 100.00 ga yaxlitlanganida ham UI limit oshganini ko‘rsatadi; regressiya testi qo‘shildi. Sozlamalar formasi saqlashdan qaytgan profil bilan sinxronlanadi (trim qilingan ism va timezone). Valyuta readonly qoladi, avtomatik carry-over qo‘shilmadi.

Frontend build/lint o‘tdi; lintda avvalgi 5 warning saqlanadi. Yakuniy run: 29 test o‘tdi (boshqa parallel frontend ishlarining testlari ham kiradi). Bu H2 integratsiya dalili; PostgreSQL/staging va real telefondagi yakuniy QA hali alohida bajariladi. Ushbu ishdagi responsive qayta tekshiruv sessiya tugagani sabab to‘liq dalil sifatida hisoblanmadi.

### Hisobot va CSV integratsiyasi — 2026-09-24

Haqiqiy `shared/api/reports.ts` va `transactions.ts` modullari alohida Spring Boot `test` / H2 serveriga qarshi tekshirildi. Opt-in `tests/reports.integration.mjs` yangi sintetik user bilan 12 guruhni tekshiradi: summary/category/monthly trend mosligi; opening/transfer jamlardan chiqarilishi; sana va hisob filtri; bo‘sh natija; CSV Blob, UTF-8 BOM, CRLF, sarlavha, transfer qatori, formula/quote escaping; 367 kunlik xato; mavjud bo‘lmagan hisob; sessiya tugagandagi JSON xatosi. Auth cookie va CSRF ishlatiladi, himoya o‘chirilmaydi, credential va CSV mazmuni chiqarilmaydi.

Havoladagi maxsus sana davri endi “Bu oy” deb ko‘rsatilmaydi. Faqat `preset=last_month` kabi havola berilsa ham profil timezone bo‘yicha tegishli sanalar olinadi. Eski preset yangi sanalarga mos kelmasa “Maxsus davr” ko‘rsatiladi. 3 regression test qo‘shildi; 366 kunlik cheklov saqlangan.

Qayta sinash uchun Node 24 va **alohida, disposable H2 test bazasi** kerak. Mavjud 8080 yoki foydalanuvchi bazasiga qarshi ishlatmang. Backend papkasida:

```sh
JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home ./mvnw spring-boot:run -Dspring-boot.run.useTestClasspath=true -Dspring-boot.run.profiles=test '-Dspring-boot.run.arguments=--server.port=8095 --app.cors.allowed-origins=http://localhost:5184' > /private/tmp/mm-integration-backend.log 2>&1
```

Frontend papkasida:

```sh
node tests/reports.integration.mjs --isolated-test-server http://localhost:8095 --otp-log /private/tmp/mm-integration-backend.log
```

Test dev-only OTP logidan faqat o‘zi yaratgan user kodini xotirada oladi; kod, cookie va telefonni chop etmaydi. Test tugagach ajratilgan backendni to‘xtatish H2 sinov ma’lumotlarini yo‘qotadi. Bu test `npm test`ga avtomatik qo‘shilmagan: ishga tushirish uchun server va log yo‘li ochiq ko‘rsatilishi shart.

Natija: build, lint va 32 util testi o‘tdi; lintda avvalgi 5 warning bor. Haqiqiy HTTP frontend integratsiyasida 12/12 tekshiruv o‘tdi. Bu Node/fetch adapteri + Spring Boot/H2 dalili; brauzer download-click, 320/390/768/1440 responsive, PostgreSQL/staging va haqiqiy telefondagi yakuniy tekshiruv o‘rnini bosmaydi. Ushbu qayta tekshiruvda brauzer sintetik sessiyasi qayta login talab qilgani uchun UI dalili sifatida hisoblanmadi.

## Kunlik limit (Frontend-04…06)

Bosh sahifadagi "Kunlik limit" bloki — bugungi xarajat kunlik limitga nisbatan. Kontrakt: [`docs/daily-limit-contract.md`](../docs/daily-limit-contract.md) (`GET/POST/PATCH/DELETE /api/v1/daily-limit`).

- **Fayllar:** `shared/api/dailyLimit.ts` (API, `DailyLimitStatus`), `shared/lib/dailyLimit.ts` (bar kengligi, `aria-valuetext`, status → matn/ton, oshgan summa, input tekshiruvi — budjetdagi `validLimit` qoidasi), `pages/dashboard/DailyLimitCard.tsx` (blok), `pages/dashboard/DailyLimitEditor.tsx` (o'rnatish/tahrirlash va o'chirish dialoglari), `shared/ui/Menu.tsx` (`MenuButton` — umumiy ⋮ menyu).
- **Joylashuv:** desktopda o'ng ustun tepasida; 1100px dan tor ekranda "So'nggi operatsiyalar"dan oldin. Operatsiya saqlangach blok qayta yuklanadi.
- **Holatlar:** skelet → xato + "Qayta urinish"; limit yo'q — "Kunlik limit o'rnatilmagan" + "Limit o'rnatish" (⋮ yo'q); `OK`; `NEAR` — "Limitga yaqinlashdingiz" + ikonka; `REACHED` — "Kunlik limitga yetdingiz"; `OVER` — "Limitdan X oshdi" (manfiy `remaining`dan). Rang yagona signal emas. Bar kengligi `min(percent, 100)%`, foiz server stringi (`240.3%`).
- **Pul:** summalar string; float hisob yo'q. `formatMoney` decimal stringni aniq formatlaydi — 17 xonali limit yaxlitlanmaydi, blokda faqat raqam guruhlari orasida qatorga o'tadi.
- **Editor:** summa + valyuta, "Limit faqat xarajatlarni kuzatadi…" izohi. 400 → input ostida; 409 `DAILY_LIMIT_EXISTS` → holat qayta yuklanib tahrirlash rejimiga o'tadi (kiritilgan qiymat saqlanadi); 409 `STALE_VERSION` → "Limit boshqa joyda o'zgargan" + "So'nggi holatni yuklash"; 404 → yaratish rejimi; tarmoq xatosi → qiymat saqlanadi + "Qayta urinish". Takroriy submit ref-lock bilan bloklanadi, o'zgartirilgan forma yopilsa tasdiq so'raladi.
- **O'chirish:** tasdiq dialogi (fokus "Bekor qilish"da) → `DELETE` → blok "o'rnatilmagan" holatiga + toast.
- **Menyu (a11y):** `aria-haspopup="menu"`, `aria-expanded`, `role=menu/menuitem`; ↑/↓, Home/End; Esc va tashqariga bosish yopib fokusni tugmaga qaytaradi; bosish maydonlari ≥ 44px.
- **Tekshiruv (2026-09-28):** `tests/dailyLimit.test.cjs` (+ `money.test.cjs` ro'yxatga olindi); real backend + PostgreSQL 18 bilan Playwright: 390 va 320 px'da to'liq ssenariy (yaratish → xarajat → foiz o'sishi → OVER → STALE_VERSION → DAILY_LIMIT_EXISTS → o'chirish), dashboard 320/390/768/1440 da gorizontal scroll 0, konsol xatosi 0.


## Jamg‘arma rejalari (Frontend-Savings-01…05)

`/savings` himoyalangan, lazy yuklanadigan sahifa. Sidebar va mobil menyuda **Jamg‘arma** bandi mavjud. Dashboardda jami jamg‘arma va dastlabki uchta faol reja ko‘rinadi; `?new=1` yaratish dialogini, `?plan=<id>` tegishli rejani ochadi.

- Uch ko‘rsatkich: jami jamg‘arma, jami maqsad, faol rejalar. Reja yaratish/tahrirlash, ikon/rang, maqsad summasi, ixtiyoriy muddat, arxivlash/tiklash.
- Hissa qo‘shish va yechish, sana/izoh, aniq decimal hisoblangan progress preview. Valyuta profilning bazaviy valyutasiga mos; sana profil vaqt zonasidan olinadi.
- Haqiqiy `/savings/plans/{id}/balance?year=` grafigi, kelajak oylarida qiymat yo‘q; aniq qiymatlar ochiladigan ro‘yxatda. Hissalar tarixi cursor pagination bilan, immutable reversal orqali bekor qilish.
- 6 soniyalik Undo toast; sahifa almashishi Undo’ni bekor qilmaydi. Sessiyadan chiqish kutilayotgan amalni bir marta yakunlaydi. Hissa POST retry kaliti UUID v4: bir xil payload forma ochiq turgan vaqt davomida bir kalitni saqlaydi.
- Summalar decimal string, preview BigInt; faqat grafik koordinatalari uchun Number. `mm.balanceHidden` umumiy sozlamasi summalar, foizlar, progress va grafik qiymatlarini yashiradi. Tahrirlash dialogi foydalanuvchi so‘ragan qiymatni o‘zgartirish uchun ko‘rsatadi.
- `ProgressBar` va `SavingPlanIcon` shared UI; variantlar `/style-guide/components` da. Member va Saving Tips keyingi bosqichga qoldirilgan.

Tekshiruv: 68 ta test (API kontrakt adapteri, aniq pul/chegaralar, UUID retry, Undo poygasi, React server-render privacy va progress a11y), production build. Native Chrome’da namunaviy ma’lumotli sahifa va yaratish dialogi ochilishi ko‘rildi. Bu **real backend bilan end-to-end yoki 320/390/768/1440 yakuniy QA tasdig‘i emas**: brauzerning admin policy tekshiruvi ishlamagani sababli qolgan vizual/amaliy QA bloklangan. Staging va to‘liq ekran o‘lchamlari bo‘yicha tekshiruv Review / QA’da qoladi. Batafsil: `SAVINGS_VALIDATION.md`.
