#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function quoteCmdArg(value) {
  return /^[A-Za-z0-9@._:/\\=-]+$/.test(value) ? value : `"${value.replace(/"/g, '""')}"`;
}

function resolveCommand(command, args) {
  if (process.platform === 'win32' && command === 'npm') {
    return {
      command: process.env.ComSpec ?? 'cmd.exe',
      args: ['/d', '/s', '/c', ['npm', ...args].map(quoteCmdArg).join(' ')]
    };
  }

  return { command, args };
}

function run(command, args) {
  const resolved = resolveCommand(command, args);
  const result = spawnSync(resolved.command, resolved.args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  if (result.status === 0 && !result.error) {
    return {
      ok: true,
      stdout: String(result.stdout ?? '').trim()
    };
  }

  {
    const error = result.error;
    return {
      ok: false,
      stdout: String(result.stdout ?? '').trim(),
      stderr: String(result.stderr ?? error?.message ?? '').trim()
    };
  }
}

function inferState({ hasReleasePr, tagExists, releaseExists, npmExists }) {
  if (npmExists && releaseExists && tagExists) {
    return 'complete';
  }

  if (npmExists || tagExists || releaseExists) {
    return 'blocked';
  }

  if (hasReleasePr) {
    return 'release-pr-open';
  }

  return 'no-release';
}

const packageJson = readJson('package.json');
const serverJson = readJson('server.json');
const version = packageJson.version;
const tagName = `v${version}`;
const tagResult = run('git', ['tag', '--list', tagName]);
const ghReleaseResult = run('gh', ['release', 'view', tagName, '--json', 'tagName,url,isDraft']);
const npmResult = run('npm', ['view', `${packageJson.name}@${version}`, 'version']);
const prResult = run('gh', [
  'pr',
  'list',
  '--state',
  'open',
  '--search',
  'head:release-please',
  '--json',
  'number,url,title,isDraft'
]);

const releasePrs = prResult.ok && prResult.stdout ? JSON.parse(prResult.stdout) : [];
const tagExists = tagResult.ok && tagResult.stdout.split('\n').includes(tagName);
const releaseExists = ghReleaseResult.ok && ghReleaseResult.stdout.length > 0;
const npmExists = npmResult.ok && npmResult.stdout === version;
const state = inferState({
  hasReleasePr: releasePrs.length > 0,
  tagExists,
  releaseExists,
  npmExists
});
const blockers = [];

if (packageJson.version !== serverJson.version || serverJson.packages?.[0]?.version !== version) {
  blockers.push('version metadata drift');
}

if (npmExists) {
  blockers.push(`npm package ${packageJson.name}@${version} already exists`);
}

if (tagExists) {
  blockers.push(`git tag ${tagName} already exists`);
}

if (releaseExists) {
  blockers.push(`GitHub Release ${tagName} already exists`);
}

const safeToPublish = blockers.length === 0 && state !== 'blocked';
const result = {
  package: packageJson.name,
  version,
  state,
  safe_to_publish: safeToPublish,
  tag: { name: tagName, exists: tagExists },
  github_release: { exists: releaseExists },
  npm: { exists: npmExists },
  release_prs: releasePrs,
  blockers,
  next_safe_command: safeToPublish
    ? 'Merge the release-please PR after required checks and protected environment approval.'
    : 'Do not publish; resolve blockers or wait for release-please to choose the next version.'
};

console.log(JSON.stringify(result, null, 2));

if (process.argv.includes('--strict') && !safeToPublish) {
  process.exit(1);
}
