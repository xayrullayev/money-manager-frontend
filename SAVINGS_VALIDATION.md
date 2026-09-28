# Saving Plans frontend — 2026-09-28

## Implemented

Frontend-Savings-01–05: typed API client; shared progress/icon atoms and style guide; responsive page, dialogs, contributions/reversals, yearly ledger balance chart; protected lazy routing and navigation; dashboard summary/top-three plans. User-approved scope includes totalTarget, dueDate/clearDueDate, remainingDays. Members/tips are deferred.

Existing app design tokens, Urbanist, AppShell drawer, CSRF client, Dialog focus/dirty guards and Toast lifecycle are reused. No production fixture data, API environment changes or new runtime dependencies were added. The temporary UI fixture was outside this repository and never connected to user data.

## Verified

- `npm test`: 68/68 passing. New tests cover 17-digit decimal precision, invalid amount rejection, withdrawal/overflow guards, timezone day, UUID retry retention, Undo cancellation/one-shot dispatch, endpoint encoding/cursors/year/version/headers, React markup privacy and progress accessibility.
- `npm run build`: TypeScript and Vite pass; main bundle size advisory remains.
- `npm run lint`: succeeds; existing unrelated warnings remain.
- Native Chrome with in-memory sample data: page loaded, six plans and correct fixture aggregates appeared, selected detail/chart/history appeared in accessibility tree; responsive two-column card layout screenshot inspected; create dialog opened and focused name input.

## Not yet verified

- Complete create/edit/contribute/withdraw/reverse/archive workflows against the real running backend in a browser.
- Full 320/390/768/1440 screen QA, all modal keyboard flows, empty/error/stale states and dashboard visual QA.
- Staging/code review sign-off.

Browser automation initially failed with an app-server initialization error. Later the dedicated browser returned: “Browser security check was unavailable … admin-enforced policy could not be verified, so access was not granted.” Retrying returned the same result. Security controls were not bypassed. Existing native Chrome evidence is partial and is not presented as full visual QA.

## Manual QA steps

1. Run the updated backend with its migrations in an isolated test environment and the normal frontend API URL; sign in as a test user.
2. Open `/savings`, create a base-currency plan with a future due date, edit target/icon/color, clear due date, and verify 409 reload after concurrent edits.
3. Add a contribution and withdrawal; retry an interrupted identical contribution; verify only one ledger record. Undo a removal before six seconds, then let another removal expire; verify reversal and updated totals/chart. Repeat across navigation/logout.
4. Check yearly balance values including future-month gaps, archived plans, cursor pagination, empty/error retry states, and insufficient funds.
5. Hide balances, check card/detail/history/chart markup and dashboard; verify all four viewport widths and keyboard focus/Escape/dirty guard. Dashboard Add Plan and plan links should open the correct destination.
