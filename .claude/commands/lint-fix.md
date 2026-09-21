---
description: Run ESLint --fix for backend and/or frontend.
allowed-tools: Bash(cd backend/services && yarn lint), Bash(cd web && yarn lint)
---

Lint and auto-fix this repo. Run whichever side(s) are relevant to the change
just made:

- **Backend** (`backend/services/`): `yarn lint` runs
  `eslint "{src,apps,test}/**/*.ts" --fix`. Note: no ESLint config file
  (`.eslintrc*`) is committed under `backend/services/` — if this command
  errors for a config-related reason rather than a real lint violation, say so
  explicitly rather than papering over it or adding a new config file
  unprompted.
- **Frontend** (`web/`): `yarn lint` runs `eslint .` against
  `web/eslint.config.js` (flat config — `@eslint/js` recommended +
  `typescript-eslint` recommended + `eslint-plugin-react-hooks` +
  `eslint-plugin-react-refresh`).

After running, review what `--fix` changed (backend) before considering it
done — auto-fixes can occasionally reformat more than intended in a large
file. Report any violations that couldn't be auto-fixed, with the actual
output.
