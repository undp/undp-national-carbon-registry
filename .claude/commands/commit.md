---
description: Stage task-relevant files and commit with a plain-imperative message matching this repo's recent commit style.
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*)
---

Create a git commit for the work just completed in this session.

1. Run `git status` and `git diff` (staged and unstaged) to see everything
   that changed, and `git log --oneline -15` to keep the message style
   consistent with recent history.
2. Stage **only the files relevant to the task just completed** — never
   `git add -A` or `git add .` blindly. If unrelated changes are present
   (e.g. stray local files, unrelated in-progress edits), leave them unstaged
   and say so.
3. Write a commit message in this repo's **plain imperative** style — no
   Conventional Commits type/scope prefix. Match the tone of recent commits
   like:
   - `fix migration issues`
   - `add missing values to example file`
   - `make configuration values consistent`
   - `disable TypeORM synchronize in production`

   Lowercase first word, present-tense imperative, one line unless the change
   genuinely needs a body paragraph explaining *why* (not *what* — the diff
   already shows what).
4. Do not commit anything under `.env`, `.env.*` (except the committed
   `.env.*.example` files), or other files that look like they contain secrets
   — warn instead of committing if one is staged.
5. Run `git status` after to confirm the commit succeeded and report what was
   (and wasn't) included.

Never use `--amend`, `--no-verify`, or force-push. If a pre-commit hook fails,
fix the underlying issue and create a new commit rather than bypassing it.
