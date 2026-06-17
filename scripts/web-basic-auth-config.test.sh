#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENTRYPOINT="$ROOT_DIR/web/docker-entrypoint.sh"
NGINX_CONF="$ROOT_DIR/web/nginx.conf"
DOCKERFILE="$ROOT_DIR/web/Dockerfile"

node - "$ENTRYPOINT" "$NGINX_CONF" "$DOCKERFILE" <<'NODE'
const fs = require("fs");

const [entrypointPath, nginxConfPath, dockerfilePath] = process.argv.slice(2);
const entrypoint = fs.readFileSync(entrypointPath, "utf8");
const nginxConf = fs.readFileSync(nginxConfPath, "utf8");
const dockerfile = fs.readFileSync(dockerfilePath, "utf8");
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

assert(
  nginxConf.includes("include /etc/nginx/conf.d/auth.conf;"),
  "nginx location should include generated auth config"
);
assert(
  entrypoint.includes("BASIC_AUTH_USERNAME") &&
    entrypoint.includes("BASIC_AUTH_PASSWORD"),
  "entrypoint should read Basic Auth username and password env vars"
);
assert(
  entrypoint.includes("auth_basic") &&
    entrypoint.includes("auth_basic_user_file"),
  "entrypoint should generate nginx Basic Auth directives"
);
assert(
  entrypoint.includes("openssl passwd -apr1"),
  "entrypoint should hash the password before writing .htpasswd"
);
assert(
  !entrypoint.includes("BASIC_AUTH_PASSWORD value"),
  "entrypoint must not log the Basic Auth password"
);
assert(
  /RUN\s+apk\s+add(?:\s+--[^\s]+)*\s+openssl/.test(dockerfile),
  "runtime nginx image should install openssl for password hashing"
);

if (failures.length) {
  console.error(failures.map((failure) => `FAIL: ${failure}`).join("\n"));
  process.exit(1);
}
NODE

echo "OK: web basic auth config is generated from environment"
