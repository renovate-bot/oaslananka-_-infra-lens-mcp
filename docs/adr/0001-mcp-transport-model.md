# ADR 0001: MCP Transport Model

- Status: Accepted
- Date: 2026-05-26
- Owners: maintainers

## Context

`infra-lens-mcp` is primarily a local MCP server that can be launched by desktop MCP clients with `npx -y infra-lens-mcp`. It also exposes a Streamable HTTP entry point for controlled deployments and integration testing. The transport choice affects protocol safety, logging, deployment hardening, and what credentials can be accepted.

## Decision

Keep stdio as the default transport and keep Streamable HTTP as an explicit alternate entry point. The stdio server owns the local desktop use case and must not write user-facing protocol data outside MCP responses. The HTTP server must keep the same tool surface and reuse the shared tool registration code in `src/server-core.ts`.

HTTP deployments must pass through `src/http-security.ts` policy checks before tool handling. Non-loopback HTTP binds are not routine local development; they require an auth mode, allowed origins, allowed hosts, and a remote-safe runtime profile.

The HTTP transport is intentionally **stateless** today. `StreamableHTTPServerTransport` runs with `sessionIdGenerator: undefined`, the server does not issue `MCP-Session-Id`, and client-supplied `MCP-Session-Id` headers are rejected before body parsing. This avoids accidental state retention, session identifier logging, and cleanup ambiguity until streaming/session lifecycle support becomes an explicit product goal.

## Consequences

- Positive: Desktop clients get the simplest and safest default path through stdio.
- Positive: HTTP deployments reuse the same tool implementation instead of drifting into a second product surface.
- Positive: Transport-specific security policy stays isolated around the HTTP entry point.
- Positive: Stateless HTTP avoids server-side session cleanup and makes identifier handling explicit.
- Negative: HTTP remains intentionally conservative and needs gateway support for production OAuth validation.
- Negative: GET/SSE streaming and DELETE session termination are not available until stateful HTTP becomes product scope.
- Follow-up: Public connector readiness stays false until production OAuth token validation is implemented or delegated in a documented deployment profile.

## Alternatives Considered

| Option | Pros | Cons | Fit |
| --- | --- | --- | --- |
| Stdio default plus hardened HTTP | Matches local MCP clients, preserves one tool surface, supports controlled HTTP deployments | Requires policy checks for HTTP and gateway OAuth for public deployments | High |
| HTTP-only server | Easier to deploy behind web infrastructure | Increases local credential exposure risk and adds auth burden for desktop use | Low |
| Stdio-only server | Smallest attack surface | Blocks controlled remote deployments and HTTP integration scenarios | Medium |
