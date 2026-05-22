#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const inputPath = process.argv[2];
const text = inputPath ? readFileSync(inputPath, 'utf8') : readFileSync(0, 'utf8');

const classes = [
  {
    name: 'workflow syntax/actionlint',
    pattern: /actionlint|Invalid workflow file|Workflow does not have/i,
    fix: 'Fix the workflow YAML syntax, event, permissions, or expression reported by actionlint/GitHub.',
    auto: true,
    human: false,
    publishStop: true
  },
  {
    name: 'zizmor issue',
    pattern: /zizmor|unpinned-uses|excessive-permissions|template-injection/i,
    fix: 'Tighten workflow permissions, pin actions, or remove unsafe expression/data flow.',
    auto: true,
    human: false,
    publishStop: true
  },
  {
    name: 'secret scan finding',
    pattern: /gitleaks|secret scanning|secret detected|token|private key/i,
    fix: 'Remove the secret, rotate it if exposed, and add a sanitized fixture or allowlist only for proven false positives.',
    auto: false,
    human: true,
    publishStop: true
  },
  {
    name: 'CodeQL finding',
    pattern: /codeql|security-events|code scanning/i,
    fix: 'Inspect the alert, patch the data flow or validation gap, and add regression coverage.',
    auto: true,
    human: false,
    publishStop: true
  },
  {
    name: 'dependency audit finding',
    pattern: /audit|vulnerabilit|GHSA-|CVE-/i,
    fix: 'Update the affected direct dependency or refresh the lockfile to a patched transitive version.',
    auto: true,
    human: false,
    publishStop: true
  },
  {
    name: 'Docker build failure',
    pattern: /docker build|buildx|Dockerfile|trivy|container/i,
    fix: 'Reproduce the container build or scan locally, fix the Dockerfile/dependency issue, and rerun the scan.',
    auto: true,
    human: false,
    publishStop: true
  },
  {
    name: 'test failure',
    pattern: /FAIL .*\.test|Tests:\s+\d+ failed|Test Suites:\s+\d+ failed/i,
    fix: 'Reproduce the failing test, identify root cause, add or update regression coverage, and fix the code.',
    auto: true,
    human: false,
    publishStop: true
  },
  {
    name: 'typecheck failure',
    pattern: /TS\d{4}|tsc --noEmit|TypeScript/i,
    fix: 'Fix the reported TypeScript type error without weakening strictness.',
    auto: true,
    human: false,
    publishStop: true
  },
  {
    name: 'lint failure',
    pattern: /eslint|prettier|Code style issues/i,
    fix: 'Apply the formatter or correct the lint rule violation.',
    auto: true,
    human: false,
    publishStop: false
  },
  {
    name: 'package content issue',
    pattern: /npm pack|package files|tarball|check-metadata|metadata drift/i,
    fix: 'Align package metadata, build output, and package files before packing.',
    auto: true,
    human: false,
    publishStop: true
  },
  {
    name: 'release tag/version mismatch',
    pattern: /release-please|tag.*exists|version.*exists|safe_to_publish/i,
    fix: 'Let release-please choose the next version and avoid manual tags or duplicate published versions.',
    auto: false,
    human: true,
    publishStop: true
  },
  {
    name: 'HTTP auth/origin regression',
    pattern: /Origin is required|Host is required|MCP_HTTP_AUTH|allowed origins|bearer/i,
    fix: 'Restore HTTP host/origin/auth validation and add a focused regression test.',
    auto: true,
    human: false,
    publishStop: true
  },
  {
    name: 'SSH policy regression',
    pattern: /host key|known_hosts|MCP_SSH|private key|passphrase|credential/i,
    fix: 'Restore strict host key verification, raw credential restrictions, or redaction coverage.',
    auto: true,
    human: false,
    publishStop: true
  },
  {
    name: 'flaky/infra failure',
    pattern: /ECONNRESET|ETIMEDOUT|rate limit|runner.*lost|service unavailable|HTTP 5\d\d/i,
    fix: 'Confirm with one targeted rerun or status check, then harden timeout/retry only if evidence shows transient infra.',
    auto: false,
    human: false,
    publishStop: false
  }
];

const match = classes.find((entry) => entry.pattern.test(text)) ?? {
  name: 'unknown',
  fix: 'Inspect failed logs manually and classify before changing code.',
  auto: false,
  human: true,
  publishStop: true
};

console.log(
  JSON.stringify(
    {
      class: match.name,
      root_cause: match.name === 'unknown' ? 'unknown from supplied logs' : `matched ${match.name}`,
      recommended_fix: match.fix,
      auto_fix_allowed: match.auto,
      human_approval_required: match.human,
      publish_must_stop: match.publishStop
    },
    null,
    2
  )
);
