# Security Notes

## SSH

SSH host key verification is strict by default. A connection is accepted only when one of these checks succeeds:

- `connection.hostKeySha256` matches the remote host key SHA256 fingerprint
- `connection.knownHostsPath` contains a matching OpenSSH `known_hosts` entry
- `MCP_SSH_KNOWN_HOSTS` points to a matching OpenSSH `known_hosts` file

`MCP_SSH_STRICT_HOST_CHECKING=false` exists for disposable local fixtures only and logs a warning once per process.

`full` profile is for trusted local stdio development only. `remote-safe`, `chatgpt`, and `claude` profiles are for network-facing or connector deployments; they reject inline SSH secret fields before opening a connection, require `MCP_SSH_ALLOWED_HOSTS`, and expect identities to come from an external agent, preset identity, or gateway-managed environment.

Production SSH policy controls are enforced before an SSH connection is opened:

- `MCP_SSH_ALLOWED_HOSTS` supports exact host/IP entries and IPv4 CIDR ranges. It is required for remote-safe profiles and is also enforced in `full` profile when configured.
- `MCP_SSH_ALLOWED_USERS` restricts allowed SSH usernames.
- `MCP_SSH_ALLOWED_PORTS` restricts allowed SSH ports.
- `MCP_SSH_MAX_SESSIONS_PER_HOST` caps active sessions per host and port.
- `MCP_SSH_MAX_CONNECTION_ATTEMPTS_PER_MINUTE` caps connection attempts per host and port in a rolling minute window.

## Collector privacy

- `include_processes=false` skips process collection.
- `include_network=false` skips network collection.
- The default process command collects process names, PIDs, CPU, and memory only.
- Secret-like strings in process output, SSH errors, and logs are redacted.

Redaction covers password, passphrase, token, access token, refresh token, secret, client secret, API key, bearer authorization, and private key header patterns.

## HTTP

HTTP defaults to loopback. Non-loopback binds fail unless a remote-safe profile, auth mode, allowed origins, and allowed hosts are configured.

The HTTP policy layer rejects:

- unsupported endpoint paths and HTTP methods before body parsing
- client-provided `MCP-Session-Id` values because HTTP mode is stateless today
- missing or invalid `Origin` when origin enforcement is configured
- missing or invalid `Host` when host enforcement is configured
- missing or invalid bearer auth when bearer mode is configured
- oversized or non-JSON request bodies
- requests over the configured timeout
- requests above the Node process concurrency limit
- requests above the optional per-client in-memory rate limit

Errors are returned as sanitized JSON without stack traces and include `X-Content-Type-Options: nosniff` and `Cache-Control: no-store`.

When deploying behind a reverse proxy or OAuth gateway, keep the Node process on a private network path, forward only the canonical MCP endpoint, and treat proxy-side limits as an outer layer rather than a replacement for the in-process timeout, concurrency, body-size, origin, and host checks.

## MCP connector readiness

HTTP is available for local and controlled deployments, but public connector publication is not marked ready because this package does not implement production OAuth token validation. Public deployments should terminate OAuth and HTTPS in a gateway or reverse proxy before forwarding to this server.

## GitHub Actions token permissions

Workflows explicitly set workflow-level `permissions` to `contents: read`. Jobs that need write access declare it at job scope only:

- CodeQL declares `security-events: write` on the analysis job so SARIF upload can succeed without granting that write permission to the whole workflow.
- `release-please` declares `contents: write`, `pull-requests: write`, and `issues: write` because it creates release commits, tags, release pull requests, and related issue updates.
- The npm publish job declares `contents: write`, `id-token: write`, and `attestations: write` because it uploads release assets, requests npm trusted-publishing identity, and creates artifact attestations.

Do not add workflow-level write permissions. If a future release job needs additional write access, document the API call or action input that requires it in this section and keep the permission scoped to that job.

## Dependency update policy

Dependabot version updates run weekly for npm, GitHub Actions, and Docker base images. npm patch/minor updates are grouped by production versus development dependency type, while major npm updates are isolated so migrations such as TypeScript, ESLint, or Zod can be reviewed independently.

Dependabot is the canonical version-update automation for this repository. Do not add a second dependency-update bot configuration unless the governance issue for dependency automation is updated first.

Dependabot pull requests must pass the same required branch checks as maintainer-authored changes. If an update changes release behavior, package metadata, workflow permissions, or container base images, include the upstream changelog link and any new deprecation/security notes in the pull request.

## License and SPDX standards

Run `pnpm run check:licenses` before changing license metadata, dependency manifests, release packaging, or CI security gates. The check verifies:

- `package.json` declares the repository license.
- `REUSE.toml` provides project-level SPDX metadata for tracked files.
- `LICENSES/MIT.txt` and `LICENSE` contain the MIT license text.
- Installed dependency licenses reported by `pnpm licenses list --json --long` match `license-policy.json`.

When adding a new file, keep it covered by `REUSE.toml` or add file-specific SPDX metadata if it uses a different license. When adding a dependency, run `pnpm run check:licenses`; if the dependency introduces a new license expression, either choose a dependency with an already-approved license or update `license-policy.json` with a review note in the pull request.
