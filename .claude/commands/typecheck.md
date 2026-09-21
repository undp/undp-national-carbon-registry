---
description: Type-check the backend (nest build) and/or frontend (tsc -b) — the only type-check paths in this repo.
allowed-tools: Bash(cd backend/services && yarn build), Bash(cd web && yarn build)
---

Type-check this repo. There is no standalone `tsc --noEmit` script in either
app — the build commands are the type-check:

- **Backend** (`backend/services/`): `yarn build` runs `nest build`, which
  type-checks `src/` and both libs (`@app/shared`, `@app/core`) via their path
  aliases.
- **Frontend** (`web/`): `yarn build` runs `tsc -b && vite build` — `tsc -b`
  is the actual type-check step (`web/src` is strict-mode: `noUnusedLocals`,
  `noUnusedParameters`, `noFallthroughCasesInSwitch` all on), `vite build`
  bundles.

Run whichever side(s) are relevant to the change just made (both, if unsure or
if the change touches a shared contract like a DTO consumed by the frontend).
Report pass/fail per side with the actual error output on failure — don't
summarize away type errors.
