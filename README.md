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
