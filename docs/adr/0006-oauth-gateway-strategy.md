# ADR 0006: OAuth Gateway Strategy

- Status: Accepted
- Date: 2026-06-24
- Owners: maintainers

## Context

The HTTP transport can be deployed behind public MCP clients and gateways, but production OAuth validation is security-sensitive. Implementing issuer discovery, JWKS caching, audience binding, scope checks, expiry handling, clock skew, token error mapping, and metadata hardening inside this package would create a large authentication surface.

## Decision

`infra-lens-mcp` uses an **external OAuth gateway strategy** for production remote HTTP deployments.

The package does not perform native OAuth/JWT validation. Instead, `MCP_HTTP_AUTH_MODE=oauth-gateway` requires:

- `MCP_HTTP_AUTHORIZATION_SERVERS`
- HTTPS `MCP_HTTP_RESOURCE_URL`
- `MCP_HTTP_OAUTH_GATEWAY_SECRET`
- a trusted gateway that validates OAuth before forwarding traffic
- direct network access to the Node process blocked except from that gateway

The gateway must inject the configured `MCP_HTTP_OAUTH_GATEWAY_HEADER` header, default `x-infra-lens-gateway-auth`, with the configured secret. Requests missing that header receive `401`; requests with an invalid value receive `403`.

`MCP_HTTP_AUTH_MODE=oauth` is accepted as a compatibility alias for `oauth-gateway`, but documentation should prefer the explicit `oauth-gateway` name.

## Consequences

- Positive: the package avoids incomplete token validation and keeps production OAuth policy at the gateway boundary.
- Positive: runtime behavior now matches the documented strategy and fails closed when gateway settings are missing.
- Positive: protected resource metadata can still advertise the upstream authorization servers and resource URL.
- Negative: production deployments need a gateway or reverse proxy and private backend networking.
- Negative: native OAuth validation remains out of scope unless a future ADR replaces this decision.

## Alternatives Considered

| Option | Pros | Cons | Fit |
| --- | --- | --- | --- |
| External OAuth gateway | Smaller trusted surface; uses mature gateway/OIDC products; easy to fail closed | Requires deployment infrastructure | High |
| Native OAuth/JWT validation | Self-contained public server | Large security surface; easy to implement incorrectly | Low for current release |
| Bearer-only production mode | Simple | Does not meet OAuth connector expectations | Medium for private deployments only |
