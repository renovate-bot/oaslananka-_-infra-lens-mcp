# Review Thread Gate

The review-thread gate blocks pull requests that have actionable unresolved review threads.

## Files

- `scripts/check-review-threads.mjs`
- `.github/workflows/review-thread-gate.yml`
- `review-thread-summary.json` artifact

## Behavior

The script queries GitHub GraphQL `PullRequest.reviewThreads(first: 100)` and reads:

- pull request id and URL
- draft state
- thread id
- resolved and outdated state
- path, line, original line, and diff side
- comments with author, body, URL, and timestamps

It ignores resolved threads, outdated threads, and pure informational bot comments. It blocks unresolved human review threads and actionable bot review threads.

Label updates are best effort. If token permissions do not allow labels, the gate still reports the review-thread result.
