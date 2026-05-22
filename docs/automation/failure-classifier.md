# Failure Classifier

`scripts/classify-gh-failure.mjs` classifies failed GitHub Actions logs into operational buckets.

## Usage

```bash
gh run view <run-id> --log-failed > failed.log
node scripts/classify-gh-failure.mjs failed.log
```

## Output

The script emits JSON with:

- `class`
- `root_cause`
- `recommended_fix`
- `auto_fix_allowed`
- `human_approval_required`
- `publish_must_stop`

Classes include workflow syntax, workflow security, secret scan, CodeQL, dependency audit, Docker, tests, typecheck, lint, package content, release version mismatch, HTTP auth/origin, SSH policy, flaky infrastructure, and unknown.
