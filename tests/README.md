# Tests

Security regression tests for the two highest-risk pieces of custom crypto and
input handling. Run with plain Node — no test framework needed.

```bash
node tests/encryption.test.mjs      # prescription encryption at rest
node tests/safe-redirect.test.mjs   # open-redirect guard
```

Both mirror the logic in `src/lib/storage.ts` and `src/lib/safe-redirect.ts`.
If you change either of those, run these and keep them in sync.
