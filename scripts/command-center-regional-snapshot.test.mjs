#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("../web/node_modules/typescript");

const sourcePath = "web/src/Pages/CommandCenter/regionalSnapshotMath.ts";
const source = fs.readFileSync(sourcePath, "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
  fileName: sourcePath,
});

const module = { exports: {} };
vm.runInNewContext(outputText, {
  module,
  exports: module.exports,
  require,
  console,
});

const { singleCountTradeVolume } = module.exports;

assert.equal(singleCountTradeVolume([]), 0, "empty regional metrics should be zero");

assert.equal(
  singleCountTradeVolume([
    { boughtCredits: 0, soldCredits: 0 },
    { boughtCredits: null, soldCredits: undefined },
  ]),
  0,
  "empty city metrics should be zero"
);

assert.equal(
  singleCountTradeVolume([
    { boughtCredits: 300, soldCredits: 0 },
    { boughtCredits: 0, soldCredits: 300 },
  ]),
  300,
  "one settled cross-city trade must not be counted once for the buyer and once for the seller"
);

assert.equal(
  singleCountTradeVolume([
    { boughtCredits: 100, soldCredits: 0 },
    { boughtCredits: 50, soldCredits: 0 },
  ]),
  150,
  "buyer-only regional metrics should still produce a useful single-sided total"
);

assert.equal(
  singleCountTradeVolume([
    { boughtCredits: 0, soldCredits: 75 },
    { boughtCredits: 0, soldCredits: 25 },
  ]),
  100,
  "seller-only regional metrics should still produce a useful single-sided total"
);

assert.equal(
  singleCountTradeVolume([
    { boughtCredits: 100, soldCredits: 0 },
    { boughtCredits: 0, soldCredits: 50 },
  ]),
  100,
  "imbalanced regional metrics should use the larger single-sided total"
);

assert.equal(
  singleCountTradeVolume([
    { boughtCredits: -100, soldCredits: Number.NaN },
    { boughtCredits: 40, soldCredits: 30 },
  ]),
  40,
  "invalid or negative credits should not reduce the single-sided total"
);

console.log("command-center-regional-snapshot tests passed");
