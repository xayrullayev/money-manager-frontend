const { test } = require("node:test");
const assert = require("node:assert/strict");
const s = require(process.env.TEST_BUILD + "/savings.js");
test("money input rejects rounding, exponent, negative and over limit", () => {
  for (const x of ["0", "-1", "1e3", "1.001", "100000000000000000", "NaN", ""])
    assert.equal(s.validSavingAmount(x), false, x);
  for (const x of ["0.01", "12.30", "99999999999999999.99"])
    assert.equal(s.validSavingAmount(x), true, x);
});
test("preview calculates cents exactly beyond Number safe integer", () => {
  assert.deepEqual(
    s.contributionPreview(
      "9007199254740993.01",
      "99999999999999999.99",
      "0.02",
      "CONTRIBUTION",
    ),
    { amount: "9007199254740993.03", percent: 9 },
  );
  assert.equal(
    s.contributionPreview("0.30", "1", "0.20", "WITHDRAWAL").amount,
    "0.10",
  );
  assert.equal(s.contributionPreview("1", "2", "1.01", "WITHDRAWAL"), null);
  assert.equal(
    s.contributionPreview("99999999999999999.99", "1", "0.01", "CONTRIBUTION"),
    null,
  );
});
test("retry key is UUID v4, same payload retains key, changed payload replaces it", () => {
  const retry = s.createSavingRetry();
  const first = retry("a");
  assert.match(
    first,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
  assert.equal(retry("a"), first);
  assert.notEqual(retry("b"), first);
  assert.equal(retry("a"), first);
});
test("user timezone defines calendar date at UTC boundary", () => {
  assert.equal(
    s.savingToday("Asia/Tashkent", new Date("2026-09-27T21:00:00Z")),
    "2026-09-28",
  );
});

test("Undo prevents the queued reversal, including logout flush", async () => {
  let calls = 0;
  const action = s.deferredSavingAction(async () => {
    calls++;
  });
  assert.equal(action.undo(), true);
  await action.commit();
  await action.commit();
  assert.equal(calls, 0);
});
test("timeout and logout cannot submit two reversals", async () => {
  let calls = 0;
  const action = s.deferredSavingAction(async () => {
    calls++;
  });
  const first = action.commit();
  assert.equal(action.commit(), first);
  assert.equal(action.undo(), false);
  await first;
  assert.equal(calls, 1);
});
