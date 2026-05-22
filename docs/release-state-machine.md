# Release State Machine

`scripts/release-state.mjs` reports the current release state for the package version in `package.json`.

## Usage

```bash
pnpm run release:dry-run
node scripts/release-state.mjs --strict
```

`--strict` exits non-zero when `safe_to_publish` is false. The default dry run prints blockers without failing local CI.

## States

- `no-release`
- `release-pr-open`
- `release-pr-green`
- `release-pr-merged`
- `tag-created`
- `dry-run-success`
- `npm-published`
- `mcp-registry-updated`
- `docker-ghcr-published`
- `github-release-published`
- `post-release-smoke-success`
- `complete`
- `blocked`

The current implementation reports the states it can prove from local metadata, git tags, GitHub Releases, release PRs, and npm package version state. Unknown remote failures are reported as blockers rather than guessed.

## Publish safety

`safe_to_publish` is false when:

- package metadata versions drift
- the npm package version already exists
- the release tag already exists
- the GitHub Release already exists

When unsafe, the next safe command is to resolve blockers or let release-please choose the next version.
