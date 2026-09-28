const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
function client() {
  const calls = [];
  const apiClient = Object.fromEntries(
    ["get", "post", "patch", "delete"].map((method) => [
      method,
      async (...args) => {
        calls.push({ method, args });
        return { data: { ok: true } };
      },
    ]),
  );
  const context = {
    exports: {},
    require: (id) => {
      assert.equal(id, "./client");
      return { apiClient };
    },
  };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync("src/shared/api/savings.ts", "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    context,
  );
  return { api: context.exports, calls };
}
test("savings API paths, archive flag, cursor and request cancellation", async () => {
  const { api, calls } = client();
  const signal = new AbortController().signal;
  await api.fetchSavingPlans(true, signal);
  await api.fetchSavingPlan("plan/id");
  await api.fetchContributions("plan/id", "opaque+cursor", 15, signal);
  await api.fetchSavingBalance("plan/id", 2025, signal);
  await api.fetchSavingsSummary(signal);
  assert.equal(calls[0].args[1].params.archived, true);
  assert.equal(calls[0].args[1].signal, signal);
  assert.equal(calls[1].args[0], "/savings/plans/plan%2Fid");
  assert.equal(calls[2].args[1].params.cursor, "opaque+cursor");
  assert.equal(calls[2].args[1].params.limit, 15);
  assert.equal(calls[3].args[0], "/savings/plans/plan%2Fid/balance");
  assert.equal(calls[3].args[1].params.year, 2025);
  assert.equal(calls[4].args[0], "/savings/summary");
});
test("mutations preserve decimal strings, optimistic version and caller retry key", async () => {
  const { api, calls } = client();
  const input = {
    amount: "9007199254740993.01",
    kind: "CONTRIBUTION",
    occurredOn: "2026-09-28",
  };
  const key = "00112233-4455-4677-8899-aabbccddeeff";
  await api.addContribution("p", input, key);
  await api.addContribution("p", input, key);
  assert.equal(calls[0].args[1], input);
  assert.equal(calls[0].args[2].headers["Idempotency-Key"], key);
  assert.equal(calls[1].args[2].headers["Idempotency-Key"], key);
  const update = { expectedVersion: 12, clearDueDate: true };
  await api.updateSavingPlan("p", update);
  assert.equal(calls[2].method, "patch");
  assert.equal(calls[2].args[1], update);
  await api.archiveSavingPlan("p");
  await api.unarchiveSavingPlan("p");
  await api.removeContribution("p", "c/id");
  assert.equal(calls[3].args[0], "/savings/plans/p/archive");
  assert.equal(calls[4].args[0], "/savings/plans/p/unarchive");
  assert.equal(calls[5].method, "delete");
  assert.equal(calls[5].args[0], "/savings/plans/p/contributions/c%2Fid");
});
