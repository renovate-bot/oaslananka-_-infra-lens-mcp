# AGENTS.md

Canonical repository instructions for AGENTS.md-aware coding agents.

## Tool usage guide

### `analyze_server`

Connects to a Linux host over SSH, samples the requested collection window, compares the result to recorded baselines, and explains anomalies in plain English.

Use it for questions like:

- "Is `prod-01` healthy right now?"
- "Why is this server slow?"
- "What changed compared to normal traffic?"

### `snapshot`

Captures a point-in-time metric snapshot and stores it in SQLite without running anomaly analysis.

Use it when you want fresh telemetry for later history lookups or before a manual investigation.

### `record_baseline`

Stores a labeled healthy-state sample so future comparisons have statistical context.

Use it during normal operating windows such as:

- daytime steady state
- peak traffic
- post-deployment warm state

### `compare_to_baseline`

Collects a fresh snapshot and compares it to a named baseline label.

Use it when an operator already knows which baseline is relevant and wants the shortest differential view.

### `get_history`

Returns CPU, memory, or load history from SQLite, optionally filtered by label.

Use it to answer trend questions and to separate default incident snapshots from named baseline sessions.

## Operational limits

- Host key verification is strict by default. Use known_hosts or pinned SHA256 host key fingerprints.
- The HTTP transport binds to loopback by default. Non-loopback deployments must use a remote-safe profile, auth, allowed origins, and allowed hosts.
- SSH credentials are redacted from structured logs and are never stored in SQLite.

## Working rules

- Keep the current MCP tool surface unchanged unless a task explicitly asks for a new tool.
- Preserve stdio protocol safety: do not write user-facing protocol data to stdout outside MCP responses.
- Route operational logging through the existing structured logger and keep secrets redacted.
- Prefer Node 24 for CI, Docker, release, and docs. Keep Node 22 compatibility when `engines.node` remains `>=22`.
- Before wrapping up code changes, run `pnpm run lint`, `pnpm run test:coverage`, and `pnpm run build`. Run `pnpm run test:e2e` when Docker-backed SSH verification is relevant.
- Follow `docs/release.md` for release-please, npm trusted publishing, and MCP Registry version decisions.
