# Security Policy

## Supported versions

Security fixes target the latest published `infra-lens-mcp` release and the default branch. The package supports Node.js 22 and newer, with Node.js 24 LTS used for CI, Docker, and release automation.

## Reporting a vulnerability

Please do not open a public issue for vulnerabilities.

Email **oaslananka@gmail.com** with subject **`[SECURITY] infra-lens-mcp`**. Do not include live secrets, private keys, bearer tokens, registry tokens, or production credentials in the report. A response is expected within 72 hours.

## Security scope

- SSH credential handling and host key verification
- Process, command output, and log redaction
- SQLite metric history exposure
- MCP tool schema safety
- HTTP transport auth, Origin, Host, and body-limit enforcement
- GitHub Actions release and package publishing controls

## Threat model summary

`infra-lens-mcp` connects to remote Linux hosts and collects operational telemetry. Treat it as security-sensitive automation.

- SSH host key verification is strict by default and uses `known_hosts` or pinned SHA256 host keys.
- SSH credentials are held in memory only for the active connection and are never written to SQLite.
- Raw SSH credentials are rejected in `remote-safe`, `chatgpt`, and `claude` profiles.
- Process command arguments are not collected by default; secret-like strings are redacted if present in process output, command errors, or logs.
- HTTP binds to loopback by default. Non-loopback HTTP requires a remote-safe profile, auth, allowed origins, and allowed hosts.
- OAuth token validation is not implemented in this package. Public HTTP deployments should use a production OAuth-aware reverse proxy or gateway.

## Data stored

The SQLite database may contain:

- CPU, memory, load, disk, and network metrics
- Process names and PIDs
- Hostname and OS metadata
- Baseline labels and snapshot timestamps

It must not contain SSH passwords, private keys, passphrases, bearer tokens, or registry credentials. If you find stored secrets, report it as a vulnerability.
