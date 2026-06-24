# Usage Guide

## Connection inputs

Default `full` profile inputs may include local SSH credentials:

```json
{
  "connection": {
    "host": "app-01.internal",
    "username": "ops",
    "privateKey": "-----BEGIN OPENSSH PRIVATE KEY-----...",
    "hostKeySha256": "SHA256:..."
  }
}
```

For `remote-safe`, `chatgpt`, and `claude` profiles, raw `password`, `privateKey`, and `passphrase` fields are rejected. Use an external SSH agent or gateway-managed credentials and set `MCP_SSH_ALLOWED_HOSTS`.

## Analyze a server

```json
{
  "connection": {
    "host": "app-01.internal",
    "username": "ops",
    "hostKeySha256": "SHA256:..."
  },
  "duration_minutes": 5,
  "include_processes": true,
  "include_network": true
}
```

`include_processes=false` skips process collection. `include_network=false` skips network collection. These flags prevent collection at the SSH command layer, not just response rendering.

## Tool outputs

Every tool returns a backward-compatible JSON text block and the same payload as MCP `structuredContent`. Each tool also declares an `outputSchema`, allowing MCP clients to validate and consume machine-readable fields directly.

For example, `analyze_server` exposes typed fields such as `host`, `timestamp`, `collection_window_minutes`, `health_score`, `summary`, `anomalies`, and `metrics`. `get_history` exposes `data_points` and a `history` array of `{ timestamp, value }` points for charting or follow-up reasoning.

## Record a baseline

```json
{
  "connection": {
    "host": "app-01.internal",
    "username": "ops",
    "knownHostsPath": "/Users/you/.ssh/known_hosts"
  },
  "label": "weekday-normal"
}
```

Repeat baseline collection during healthy windows. CPU z-score anomaly detection activates after at least five samples and becomes more useful around ten samples.

## Compare to baseline

```json
{
  "connection": {
    "host": "app-01.internal",
    "username": "ops",
    "hostKeySha256": "SHA256:..."
  },
  "baseline_label": "weekday-normal"
}
```

## Get history

```json
{
  "host": "app-01.internal",
  "metric": "cpu",
  "hours": 24,
  "label": "weekday-normal"
}
```

Leave `label` unset to return all snapshots for the host, or set it to isolate a named baseline stream.
