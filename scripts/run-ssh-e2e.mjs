#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const composeFile = 'docker-compose.test.yml';
const skipFixture = process.env.INFRA_LENS_E2E_SKIP_FIXTURE === '1';
const jestArgs = [
  '--experimental-vm-modules',
  'node_modules/jest/bin/jest.js',
  '--runInBand',
  '--testPathPatterns=e2e'
];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
    ...options
  });

  if (result.error) {
    console.error(`Failed to execute ${command}: ${result.error.message}`);
    return 1;
  }

  return result.status ?? 1;
}

function dockerCompose(args, options = {}) {
  return run('docker', ['compose', '-f', composeFile, ...args], options);
}

function runJest() {
  return run(process.execPath, jestArgs, {
    env: {
      ...process.env,
      MCP_SSH_STRICT_HOST_CHECKING: 'false'
    }
  });
}

if (skipFixture) {
  process.exit(runJest());
}

if (!existsSync(composeFile)) {
  console.error(`Missing ${composeFile}. Run this script from the repository root.`);
  process.exit(1);
}

const dockerCheck = run('docker', ['version'], { stdio: 'ignore' });
if (dockerCheck !== 0) {
  console.error(
    'Docker is required for SSH e2e tests. Install Docker or set INFRA_LENS_E2E_SKIP_FIXTURE=1 when a fixture is already running.'
  );
  process.exit(dockerCheck);
}

let exitCode = 1;

try {
  dockerCompose(['down', '--volumes', '--remove-orphans'], { stdio: 'ignore' });

  const upCode = dockerCompose(['up', '--detach', '--build']);
  if (upCode !== 0) {
    process.exitCode = upCode;
  } else {
    dockerCompose(['ps']);
    exitCode = runJest();
  }
} finally {
  dockerCompose(['logs', '--no-color', 'ssh-fixture']);
  const downCode = dockerCompose(['down', '--volumes', '--remove-orphans']);
  if (exitCode === 0 && downCode !== 0) {
    exitCode = downCode;
  }
}

process.exit(exitCode);
