#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const actionableKeywords = [
  'bug',
  'potential issue',
  'suggested fix',
  'security',
  'vulnerability',
  'correctness',
  'release',
  'publish',
  'workflow',
  'secret',
  'token',
  'unsafe',
  'package',
  'registry',
  'auth',
  'permission',
  'artifact',
  'attestation',
  'mirror',
  'tag',
  'branch',
  'ssh',
  'command injection',
  'host key',
  'known_hosts',
  'private key',
  'password',
  'passphrase',
  'credential',
  'oauth',
  'jwks',
  'bearer',
  'allowed origins',
  'destructive',
  'sudo',
  'file write',
  'file delete',
  'tunnel'
];

const informationalBotPatterns = [/nit/i, /thanks/i, /looks good/i, /format/i];

function runGh(args, input) {
  return execFileSync('gh', args, {
    input,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
}

function graphql(query, fields) {
  const args = ['api', 'graphql', '-f', `query=${query}`];
  for (const [key, value] of Object.entries(fields)) {
    args.push('-F', `${key}=${value}`);
  }

  return JSON.parse(runGh(args));
}

function isBot(author) {
  return author?.login?.endsWith('[bot]') || author?.__typename === 'Bot';
}

function isInformationalBotThread(thread) {
  const comments = thread.comments.nodes ?? [];
  return (
    comments.length > 0 &&
    comments.every((comment) => {
      const body = comment.body ?? '';
      return (
        isBot(comment.author) && informationalBotPatterns.some((pattern) => pattern.test(body))
      );
    })
  );
}

function isActionableThread(thread) {
  if (thread.isResolved || thread.isOutdated) {
    return false;
  }

  if (isInformationalBotThread(thread)) {
    return false;
  }

  const comments = thread.comments.nodes ?? [];
  const hasHumanComment = comments.some((comment) => !isBot(comment.author));
  if (hasHumanComment) {
    return true;
  }

  return comments.some((comment) => {
    const body = (comment.body ?? '').toLowerCase();
    return actionableKeywords.some((keyword) => body.includes(keyword));
  });
}

function updateLabels(owner, repo, prNumber, blocked) {
  const addLabels = blocked ? ['review:blocked', 'ci:hold'] : ['review:clean', 'ci:ready'];
  const removeLabels = blocked ? ['review:clean', 'ci:ready'] : ['review:blocked', 'ci:hold'];

  try {
    runGh([
      'api',
      '--method',
      'POST',
      `repos/${owner}/${repo}/issues/${prNumber}/labels`,
      '-f',
      `labels[]=${addLabels[0]}`,
      '-f',
      `labels[]=${addLabels[1]}`
    ]);
    for (const label of removeLabels) {
      try {
        runGh([
          'api',
          '--method',
          'DELETE',
          `repos/${owner}/${repo}/issues/${prNumber}/labels/${label}`
        ]);
      } catch {
        // Label cleanup is best effort and must not fail the gate.
      }
    }
  } catch {
    // Label update permission is best effort and must not fail the gate.
  }
}

const owner = process.env.GITHUB_REPOSITORY_OWNER;
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const prNumber = Number(process.env.PR_NUMBER ?? process.argv[2]);

if (!owner || !repoName || !Number.isInteger(prNumber) || prNumber <= 0) {
  throw new Error('GITHUB_REPOSITORY_OWNER, GITHUB_REPOSITORY, and PR_NUMBER are required.');
}

const query = `
query($owner: String!, $repo: String!, $number: Int!) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $number) {
      id
      url
      isDraft
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
          isOutdated
          path
          line
          originalLine
          diffSide
          comments(first: 100) {
            nodes {
              author {
                __typename
                login
              }
              body
              url
              createdAt
              updatedAt
            }
          }
        }
      }
    }
  }
}`;

const response = graphql(query, { owner, repo: repoName, number: prNumber });
const pullRequest = response.data?.repository?.pullRequest;

if (!pullRequest) {
  throw new Error(`Pull request ${owner}/${repoName}#${prNumber} was not found.`);
}
const threads = pullRequest.reviewThreads.nodes ?? [];
const blockingThreads = threads.filter(isActionableThread);
const summary = {
  pull_request: {
    id: pullRequest.id,
    url: pullRequest.url,
    isDraft: pullRequest.isDraft
  },
  total_threads: threads.length,
  blocking_threads: blockingThreads.length,
  threads: blockingThreads
};

mkdirSync(dirname('review-thread-summary.json'), { recursive: true });
writeFileSync('review-thread-summary.json', `${JSON.stringify(summary, null, 2)}\n`);

const lines = [
  '# Review Thread Gate',
  '',
  `Pull request: ${pullRequest.url}`,
  `Blocking threads: ${blockingThreads.length}`,
  ''
];

for (const thread of blockingThreads) {
  lines.push(
    `- ${thread.path ?? 'unknown'}:${thread.line ?? thread.originalLine ?? 0} ${thread.id}`
  );
}

if (process.env.GITHUB_STEP_SUMMARY) {
  writeFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`, { flag: 'a' });
}

updateLabels(owner, repoName, prNumber, blockingThreads.length > 0);

if (blockingThreads.length > 0) {
  console.error(`Blocked by ${blockingThreads.length} unresolved review thread(s).`);
  process.exit(1);
}

console.log('No actionable unresolved review threads.');
