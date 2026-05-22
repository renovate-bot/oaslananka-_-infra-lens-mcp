#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];

function readJson(path) {
  return JSON.parse(readFileSync(join(root, path), 'utf8'));
}

function normalizeUrl(value) {
  return String(value ?? '')
    .replace(/^git\+/, '')
    .replace(/\.git$/, '')
    .replace(/\/$/, '');
}

function fail(message) {
  failures.push(message);
}

const packageJson = readJson('package.json');
const mcpJson = readJson('mcp.json');
const serverJson = readJson('server.json');

const packageRepository = normalizeUrl(packageJson.repository?.url ?? packageJson.repository);
const mcpRepository = normalizeUrl(mcpJson.repository);
const serverRepository = normalizeUrl(serverJson.repository?.url);

if (packageJson.name !== 'mcp-infra-lens') {
  fail('package.json name must be mcp-infra-lens.');
}

if (packageJson.mcpName !== serverJson.name) {
  fail('package.json mcpName must match server.json name.');
}

if (packageJson.version !== mcpJson.version || packageJson.version !== serverJson.version) {
  fail('package.json, mcp.json, and server.json versions must match.');
}

const serverPackage = serverJson.packages?.[0];
if (serverPackage?.identifier !== packageJson.name) {
  fail('server.json package identifier must match package.json name.');
}

if (serverPackage?.version !== packageJson.version) {
  fail('server.json package version must match package.json version.');
}

if (packageRepository !== mcpRepository || packageRepository !== serverRepository) {
  fail('repository URLs must match across package.json, mcp.json, and server.json.');
}

if (mcpJson.node_version !== packageJson.engines?.node) {
  fail('mcp.json node_version must match package.json engines.node.');
}

const requiredFiles = [
  'dist',
  'README.md',
  'LICENSE',
  'CHANGELOG.md',
  'mcp.json',
  'server.json',
  'docs'
];
for (const file of requiredFiles) {
  if (!packageJson.files?.includes(file)) {
    fail(`package.json files must include ${file}.`);
  }
}

const transports = new Set(mcpJson.transport ?? []);
const serverTransport = serverPackage?.transport?.type;
if (serverTransport && !transports.has(serverTransport)) {
  fail('server.json package transport must be listed in mcp.json transport.');
}

if (transports.has('http') && mcpJson.connector_readiness?.publishReady === true) {
  fail(
    'HTTP connector publish readiness cannot be true without production OAuth/HTTPS validation.'
  );
}

if (process.env.CHECK_METADATA_REQUIRE_DIST === 'true') {
  for (const file of [
    'dist/index.js',
    'dist/index.d.ts',
    'dist/mcp.js',
    'dist/server-http.js',
    'dist/mcp.d.ts',
    'dist/server-http.d.ts'
  ]) {
    if (!existsSync(join(root, file))) {
      fail(`${file} must exist before packaging.`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      package: packageJson.name,
      version: packageJson.version,
      mcpName: packageJson.mcpName,
      transports: [...transports],
      publishReady: mcpJson.connector_readiness?.publishReady ?? false
    },
    null,
    2
  )
);
