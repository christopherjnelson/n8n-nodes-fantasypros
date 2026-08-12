# PR 10 human release-candidate review

PR 10 is reserved for a later manual release-candidate review. It may contain fixes found during review; it is not a ceremonial PR. Do not tag or publish without explicit final authorization.

## Clean-instance setup

- [ ] Start a clean, supported n8n instance and install the locally packed artifact.
- [ ] Confirm only the FantasyPros node and FantasyPros API credential are registered.
- [ ] Create a credential using a reviewer-owned FantasyPros key without recording it in logs, screenshots, workflows, or files.
- [ ] Verify the key's plan and endpoint entitlements are understood.

## Node and endpoint tour

- [ ] Inspect all seven resource selectors and all twelve operations.
- [ ] Execute Player → Get Many for each supported sport.
- [ ] Discover current player IDs, then execute Player → Compare with two and four players.
- [ ] Execute Ranking → Get Rankings, Get Consensus Rankings, and Get Experts across representative sports.
- [ ] Execute Projection → Get NFL, Get MLB, and Get NBA across applicable preseason, daily, weekly, and rest-of-season modes.
- [ ] Execute News → Get Many and Injury → Get Many across representative sports.
- [ ] Execute NFL → Get Player Points.
- [ ] Execute MLB → Get Lineups for confirmed and projected lineups; confirm an empty slate is handled correctly.
- [ ] Confirm every successful execution produces useful output items, not merely a successful HTTP status.

## Usability and failure review

- [ ] Identify confusing labels, descriptions, ordering, required markers, defaults, or dropdown values.
- [ ] Verify sport- and mode-specific fields appear and disappear correctly.
- [ ] Use outputs in downstream Set/Edit Fields, Filter, and Code nodes to assess usefulness.
- [ ] Review comparison context and nested lineup output for deterministic usability.
- [ ] Exercise invalid dates, seasons, weeks, IDs, credentials, entitlement failures, and rate limits where safe.
- [ ] Confirm errors are actionable and do not expose credentials or unsafe response details.
- [ ] Check the browser console for errors and inspect both light and dark icons.

## Documentation and policy

- [ ] Verify README installation, credential, operation, parameter, output, compatibility, and rate-limit guidance against the release candidate.
- [ ] Review FantasyPros plan, licensing, terms, trademark attribution, and non-affiliation language.
- [ ] Confirm the README does not imply that a free or prototype key allows production use.
- [ ] Review the changelog and decide whether `0.1.0` remains the correct final version.

## Artifact and release infrastructure

- [ ] Run all local validation commands and `npm run release:check` from a clean checkout.
- [ ] Build, run `npm pack --dry-run`, then inspect every file in the actual tarball.
- [ ] Confirm no tests, fixtures, secrets, source-only files, or template artifacts are packaged.
- [ ] Inspect source and compiled codex metadata; both must identify `n8n-nodes-fantasypros.fantasyPros`.
- [ ] Confirm the npm package name is available or owned by the intended publisher.
- [ ] Verify npm Trusted Publishing prerequisites and the documented bootstrap fallback.
- [ ] Review the GitHub release workflow, provenance settings, and final changelog text.

## Authorization

- [ ] Record all review findings and fix every release-blocking issue on PR 10.
- [ ] Obtain explicit human confirmation of the final version.
- [ ] Obtain explicit human authorization before creating any tag or publishing to npm.
- [ ] Confirm n8n verification submission is separately authorized, if desired.
