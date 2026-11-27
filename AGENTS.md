# store-locator (Shopify app): agent instructions

Remix + Prisma Shopify app (App Store listing: https://apps.shopify.com/store-locator-28). It is owned by Ali (`alikhan410`, personal account); it is **public**. Managed by `Traffic Cop · storetrail` (Matt Bernier's team), which also manages `bernierllc/storetrail.app` (the marketing site and outreach engine).

Global rules in `~/.codex/AGENTS.md` apply. This file records what is specific to this repo.

## Project profile

- **Stage:** live production. A push to `main` deploys to production: `.vercel-ignore.sh` skips every other branch and builds only `main`. Treat every merge into `main` as a prod deploy.
- **Branches:** `main` (default, production). `multi-tenant` and `pricing` are Ali's long-lived branches: **never push to them, never rebase or force-push them**. Do your own work on your own branches cut from `origin/main` (`.worktrees/<topic>`, branch `<type>/<topic>`), and open a PR into `main`.
- **No contact with Ali** from agents. Anything that needs him goes to Matt.
- **Billing:** Shopify *managed pricing* (plans free 10 / basic 500 / pro unlimited locations; no `appSubscriptionCreate`; no subscription webhooks). Any trial or pricing change is governed by the release gate below.
- **Public repo:** PR titles, bodies, commit messages and comments are world-readable. For a security fix, say what was changed ("require authentication on route X"), never the exploit, the exposed data or a reproduction.

## Merging, and what enforces it here

Only the `Traffic Cop · storetrail` thread merges, after the skill path: `adversarial-review`, `review-gate`, `pr-merge-flow`, then `gh pr merge <n> --squash --match-head-commit <sha>` (never `--auto`).

**We do not have admin on this repo, so there are no branch rulesets and no required status checks.** The `Review Gate` workflow (`.github/workflows/review-gate.yml`, trusted scripts in `scripts/`) reports a check on every PR, but GitHub does not make it blocking. The enforcement that exists is the merge guard (the `review-gate` / `pr-merge-flow` PreToolUse hook in the merging agent's session), which refuses `gh pr merge` while the gate fails. Do not merge any other way, and do not push to `main`. If Ali or Matt later adds a ruleset, require `Review Gate` and `build` there.

PR body: a `## Review` section holding the `Fallback review: <reviewer> on <full 40-hex head sha> — verdict: <...>` line; lint with `python3 scripts/lint-review-body.py body.md`.

## Release gate (Canonical Plan 3ca4efec-c95a-8171-aea0-c3dfac006ebe)

Evidence first. Dev-store work proceeds. **A live 30-day trial, any pricing change, and significant spend need a documented owner go decision (Matt/Ali) and passing billing tests.** Never claim "no credit card" or any trial term unless it is verified against the shipped billing flow. Security fixes are not gated by this.

## Commands

| What | Command |
|---|---|
| Install | `npm ci` (Node `^18.20`, `^20.10` or `>=21`, see `package.json` engines) |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Dev | `npm run dev` (needs the Shopify CLI and a dev store) |
| DB | `npm run setup` runs `prisma generate` and `prisma migrate deploy` |

There is no test suite and no CI yet. Adding both is follow-up work; do not claim a change is tested unless you ran it against a dev store.

## Rules specific to this repo

- **Every route that reads or writes store data authenticates and scopes by shop.** `authenticate.admin` for admin routes, `authenticate.public.appProxy` for app-proxy routes, and every Prisma query filters on the session's `shop`. A query by `id` alone is a defect.
- **Secrets:** only in `.env*` (gitignored) and the host's variables. Never print values.
- **Migrations:** never edit or rename one that has reached `main`; add a new one.
- **Production is read-only for agents:** no prod deploys, DB writes or app-store actions outside what a cop's merge triggers.
- **Commits:** conventional, lowercase subject (`type(scope): description`). PRs open ready for review, not draft.
- **Worktrees:** all work in `.worktrees/<topic>` (ignored); the primary checkout stays on `main`, clean.
