// Ensures the bare-specifier imports used across the codebase ("src/server",
// "@app/shared/...") resolve at RUNTIME for the serverless local flow.
//
// Background: serverless-plugin-typescript compiles TS but does not rewrite
// tsconfig paths or baseUrl specifiers (the Docker/production build uses
// webpack via nest build, which resolves them at bundle time). The compiled
// output in .build/ therefore still contains require("src/server") and
// require("@app/shared/...") calls, which fail with MODULE_NOT_FOUND when the
// handler is loaded locally (undp/undp-national-carbon-registry#345).
//
// Fix: link the specifiers to the compiled output inside node_modules, where
// normal node resolution walk-up finds them:
//   node_modules/@app/<name> -> ../../.build/libs/<name>/src
//   node_modules/src         -> ../.build/src
//
// Runs automatically via the package.json `postinstall` hook; safe to re-run.
// Requires the typescript plugin to have compiled at least once (.build/).
const fs = require("fs");
const path = require("path");

const aliases = ["shared", "core", "cadtrust", "aef-v2"];
const nm = path.join(__dirname, "..", "node_modules");

const ensure = (linkPath, target, label) => {
  try {
    const existing = fs.readlinkSync(linkPath);
    if (existing === target) return;
    console.warn(`${label} symlink points at ${existing}, expected ${target} — replacing`);
    fs.unlinkSync(linkPath);
  } catch (e) {
    // link missing — fall through and create it
  }
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  fs.symlinkSync(target, linkPath, "dir");
};

for (const name of aliases) {
  ensure(path.join(nm, "@app", name), path.join("..", "..", ".build", "libs", name, "src"), `@app/${name}`);
}
ensure(path.join(nm, "src"), path.join("..", ".build", "src"), "src");

console.log("runtime alias links installed in node_modules");
