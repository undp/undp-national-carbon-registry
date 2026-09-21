---
description: Generate, run, revert, or list TypeORM migrations for backend/services.
allowed-tools: Bash(cd backend/services && yarn migration:*), Bash(cd backend/services && yarn typeorm:*), Read, Grep, Glob
argument-hint: generate <name> | run | revert | show
---

Handle a TypeORM migration task in `backend/services` for argument: $ARGUMENTS

Migrations use `src/data-source.ts` as the data source and live in
`src/migrations/` (currently a single baseline migration). `DB_SYNCHRONIZE`
must stay `false` outside local dev — never suggest flipping it on as a
shortcut.

Based on `$ARGUMENTS`:

- **`generate <name>`**: first make sure the relevant TypeORM entities under
  `backend/services/libs/shared/src/entities/` already reflect the intended
  schema change (this command does not write entity code). Then run, from
  `backend/services/`:
  ```
  yarn migration:generate src/migrations/<name>
  ```
  Read the generated file before reporting done — TypeORM's diff can include
  unrelated drift (column drops/renames it inferred incorrectly). Flag
  anything in the generated SQL that doesn't match the intended change; don't
  silently accept it.

- **`run`**: run `yarn migration:run` from `backend/services/`. Only do this
  against a database you've confirmed is local/disposable — ask first if
  that's not already established in this session.

- **`revert`**: run `yarn migration:revert` from `backend/services/`. Same
  local/disposable-DB caveat as `run`.

- **`show`**: run `yarn migration:show` from `backend/services/` to list
  applied vs. pending migrations — safe to run anytime.

- **No argument / unclear**: ask which of the above is wanted rather than
  guessing; running the wrong migration command against a shared database is
  hard to undo.

Report exactly which command ran, its output, and (for `generate`) a summary
of what the generated migration actually does.
