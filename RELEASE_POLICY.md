# Release Policy

This repository is released through release-please manifest mode and the guarded GitHub Actions release workflow.

Canonical release documentation lives in [docs/release.md](./docs/release.md) and [docs/release-state-machine.md](./docs/release-state-machine.md).

Core rules:

1. Do not publish from implementation pull requests.
2. Do not create manual release tags or production GitHub Releases.
3. Keep `package.json`, `mcp.json`, `server.json`, and `.release-please-manifest.json` aligned.
4. Publish npm packages only through `.github/workflows/release.yml`.
5. Prefer npm Trusted Publishing/OIDC. Use `NPM_TOKEN` only as a protected fallback.
6. Do not publish MCP Registry metadata until connector and registry readiness are intentionally enabled and documented.

Run:

```bash
pnpm run release:dry-run
```

before any release-state decision.
