# Contributing

Thanks for your interest in contributing to the National Carbon Credit Registry!

## Getting Started
- Read the [README](./README.md) for architecture, local setup, and deployment paths.
- Preferred workflows: open an Issue first for larger changes.

## How to Contribute

Contributions are welcome by all, we have a number of different types of issues and reports to help us understand your contributions.

### Writing Issues

    - **Bugs**: If you have found what you think is a bug, please submit a bug report via our issue tracker using the bug report template.
    - **Feature Submissions & Requests**: If you have an idea for a feature that you would like to develop or request, please first begin a discussion on our issue tracker so we can help coordinate.
    - **Becoming a Core Contributor**: If you think your involvement with the project would benefit from you being a core contributor, please discuss this with the core team and request access via our issue tracker.

### Writing Pull Requests

To keep reviews fast and code quality high:

- **Keep PRs small and focused.** One logical change per PR. If it’s growing, split it.
- **All CI must pass** before requesting review (build, tests, linters, type checks).
- Include tests for any behavior change and update docs when relevant.
- Write a clear description: **what changed, why, how it was tested**, and note any breaking changes.
- Reference related issues (e.g., `Fixes #123`) and avoid unrelated refactors—send those separately.


## Building Dependencies
- Backend: Node.js LTS, Yarn, PostgreSQL; optional AWS tooling for cloud flows.
- Frontend: Node.js LTS, Yarn.
- Optional: Docker/Compose for containerized services.

## Building the Project
- **Containers**: `docker-compose up -d --build` (see [README](./README.md)).
- **Local services**: follow “Run Services Locally” (DB setup, `yarn run sls:install`, `sls offline`).

## Workflow and Branching
- Branch from `main`: `feat/<desc>` or `fix/<desc>`.
- Keep PRs small; rebase as needed; squash-merge with Conventional Commit titles.

## Coding Style and Linters
- ESLint + Prettier; TypeScript strict mode.
- Run locally:
  ```bash
  npm run lint
  ```
## Security and Responsible Disclosure Policy
Please see [SECURITY.md](./SECURITY.md)