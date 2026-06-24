#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const checks = [
  {
    file: 'docs/compliance/mcp-2025-11-25.md',
    description: 'MCP 2025-11-25 compliance matrix'
  }
];

const readme = readFileSync('README.md', 'utf8');
const failures = [];

for (const check of checks) {
  if (!existsSync(check.file)) {
    failures.push(`${check.description} is missing at ${check.file}`);
  }

  if (!readme.includes(`./${check.file}`) && !readme.includes(check.file)) {
    failures.push(`README.md does not link to ${check.file}`);
  }
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}
