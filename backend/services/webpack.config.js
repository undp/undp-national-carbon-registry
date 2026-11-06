// Custom webpack overrides for `nest build` (Docker / production bundling).
//
// Why this exists: Nest's default webpack config externalises everything that
// resolves inside node_modules. During the *local serverless* flow the alias
// links installed by scripts/link-app-aliases.js (node_modules/src,
// node_modules/@app/*) make bare specifiers like "src/server" and
// "@app/shared/..." resolve into node_modules, so the default config leaves
// them unbundled and `node dist/main.js` crashes with MODULE_NOT_FOUND.
//
// Two independent guards, so the bundle is correct whether or not the links
// exist:
//   1. resolve.alias maps those specifiers straight to the TS sources, so
//      webpack never resolves them through node_modules in the first place;
//   2. externals allowlist re-includes anything that still resolves through
//      node_modules under those two prefixes (belt-and-braces).
// Everything else keeps the defaults Nest provides.
const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = (defaultConfig) => ({
  ...defaultConfig,
  resolve: {
    ...defaultConfig.resolve,
    alias: {
      ...(defaultConfig.resolve && defaultConfig.resolve.alias),
      "^src(/.*)?$": path.resolve(__dirname, "src") + "$1",
      "^@app/([^/]+)(/.*)?$":
        path.resolve(__dirname, "libs") + "/$1/src$2",
    },
  },
  externals: [
    nodeExternals({
      allowlist: [/^src/, /^@app/],
    }),
  ],
});
