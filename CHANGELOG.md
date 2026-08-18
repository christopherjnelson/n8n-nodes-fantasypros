# Changelog

All notable changes to this project will be documented in this file.

## [0.1.1] - 2026-08-18

### Fixed

- Added `testedBy: 'fantasyProsApi'` to node credentials and explicit `ICredentialTestRequest` type to FantasyPros API credentials for n8n Creator Portal automated validation.

## [0.1.0] - 2026-08-18

### Added

- FantasyPros API credential with automatic `x-api-key` authentication.
- Player Get Many and Compare for NFL, MLB, NBA, and NHL.
- Rankings, Consensus Rankings, and Experts for supported generic sports.
- NFL, MLB, and NBA Projection operations.
- News and Injury collection operations for supported generic sports.
- NFL Player Points and MLB Lineups operations.
- Deterministic collection fan-out, response context, limits, item pairing, and Continue On Fail support.
- Actionable API error handling, including entitlement and rate-limit guidance.
- Mocked contract tests, opt-in live smoke tests, UI metadata tests, and release-package audits.
