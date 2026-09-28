const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const context = {
    exports: {},
    require: (id) => {
      if (id.endsWith(".css"))
        return {
          __esModule: true,
          default: new Proxy({}, { get: (_, key) => String(key) }),
        };
      if (id.endsWith("/shared/ui"))
        return {
          ProgressBar: load("src/shared/ui/ProgressBar.tsx").ProgressBar,
          SavingPlanIcon: load("src/shared/ui/SavingPlanIcon.tsx")
            .SavingPlanIcon,
        };
      if (id.startsWith(".")) {
        const target = path.resolve(path.dirname(file), id);
        return load(
          fs.existsSync(target + ".tsx") ? target + ".tsx" : target + ".ts",
        );
      }
      return require(id);
    },
  };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    context,
  );
  cache.set(file, context.exports);
  return context.exports;
}
const { PlanCard } = load("src/pages/savings/PlanCard.tsx");
const { ProgressBar } = load("src/shared/ui/ProgressBar.tsx");
const plan = {
  id: "p",
  name: "<script>travel</script>",
  iconKey: "travel",
  colorToken: "green",
  targetAmount: "99999999999999999.99",
  currentAmount: "9007199254740993.01",
  progressPercent: 9.01,
  completed: false,
  archived: false,
  currency: "USD",
  version: 0,
};
test("hidden plan cards expose no amount or percent in markup/accessibility", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlanCard, { plan, hidden: true, onSelect: () => {} }),
  );
  assert.ok(html.includes("••••••"));
  assert.ok(!html.includes("9.01"));
  assert.ok(!html.includes("USD"));
  assert.ok(!html.includes("progressbar"));
  assert.ok(!html.includes("<script>"));
});
test("visible plan values retain decimal precision and escape names", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlanCard, {
      plan,
      hidden: false,
      selected: true,
      onSelect: () => {},
    }),
  );
  assert.ok(html.includes("9 007 199 254 740 993,01"));
  assert.ok(html.includes("99 999 999 999 999 999,99"));
  assert.ok(html.includes('aria-pressed="true"'));
  assert.ok(html.includes("&lt;script&gt;"));
});
test("progress accessibility and fill clamp invalid, negative and over-target values", () => {
  for (const [value, expected] of [
    [-5, 0],
    [125, 100],
    [NaN, 0],
    [60, 60],
  ]) {
    const html = renderToStaticMarkup(
      React.createElement(ProgressBar, { value }),
    );
    assert.ok(html.includes(`aria-valuenow="${expected}"`));
    assert.ok(html.includes(`width:${expected}%`));
  }
});
