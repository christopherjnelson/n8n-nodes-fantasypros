# n8n-nodes-fantasypros

An independent n8n community node for the official [FantasyPros Public API v2](https://api.fantasypros.com/public/v2/docs/). It provides one **FantasyPros** node with seven resources and twelve read operations.

## Installation

This package has not been published yet. After release, install `n8n-nodes-fantasypros` from **Settings → Community Nodes** in a self-hosted n8n instance, or follow the [n8n community-node installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

For local development:

```bash
npm ci
npm run build
npm run dev
```

## Compatibility

The package requires Node.js 22.22 or newer, uses n8n node API version 1, and is built with current `@n8n/node-cli` community-node tooling. n8n Cloud availability depends on n8n's community-node policies and is not guaranteed.

## Credentials

Obtain an API key through [FantasyPros API Data](https://www.fantasypros.com/api-data/), then create a **FantasyPros API** credential in n8n. The credential sends the key only in the `x-api-key` header; do not put it in workflow fields.

You must provide your own key and comply with the usage, licensing, rate-limit, and endpoint entitlements of your FantasyPros plan. A free or prototype key must not be assumed to permit production use.

## Operations

| Resource   | Operation              | What it returns                           |
| ---------- | ---------------------- | ----------------------------------------- |
| Player     | Get Many               | Player metadata for NFL, MLB, NBA, or NHL |
| Player     | Compare                | A comparison of two to four players       |
| Ranking    | Get Rankings           | Individual-expert player rankings         |
| Ranking    | Get Consensus Rankings | Expert consensus rankings                 |
| Ranking    | Get Experts            | Experts available for ranking sets        |
| Projection | Get NFL                | NFL player projections                    |
| Projection | Get MLB                | MLB player projections                    |
| Projection | Get NBA                | NBA player projections                    |
| News       | Get Many               | Player news for NFL, MLB, NBA, or NHL     |
| Injury     | Get Many               | Injury reports for NFL, MLB, NBA, or NHL  |
| NFL        | Get Player Points      | Fantasy points by player and week range   |
| MLB        | Get Lineups            | Confirmed or projected game lineups       |

### Key parameter guidance

- Seasons are four-digit years from 2012 onward. Defaults are derived from the current UTC year rather than permanently fixed.
- NFL week fields accept the endpoint-specific documented range. Player Points requires weeks 1–22 and rejects an end week before the start week.
- Player Compare requires two to four numeric FantasyPros player IDs.
- ID lists accept commas, colons, or whitespace as input, then use the delimiter required by the endpoint: expert filters and most NFL lists use colons; MLB/NBA projection player lists and NBA team lists use commas.
- Daily projection dates and MLB lineup dates use `YYYY-MM-DD`. Weekly and daily fields appear only for applicable modes.
- Collection operations provide **Return All** and **Limit**. These are client-side controls except News, where the API's native maximum of 100 is also honored.
- Sport-specific fields are hidden for sports where the official contract does not support them.

See [the internal API contract](docs/API_CONTRACT.md) for the endpoint matrix and known specification discrepancies.

## Output behavior

Collection operations emit one n8n item per primary entity and preserve the API's entity fields. Each entity also receives an `_fantasyPros` object containing response-level context such as sport, season, scoring, or count. Empty collections emit no items. Every item is paired to its originating input item.

Player Compare emits one item containing the complete comparison response. MLB Get Lineups emits one item per game and preserves nested teams, pitchers, and hitters. The node supports multiple input items and honors n8n's **Continue On Fail** behavior.

## Errors and rate limits

The node provides targeted messages for malformed requests, invalid credentials, plan or entitlement failures, missing resources, rate limits, and temporary API failures. A `429` response includes safe retry timing when FantasyPros supplies it. The node does not retry indefinitely.

FantasyPros determines quotas and endpoint availability by plan. Consult your plan terms and the [official API overview](https://www.fantasypros.com/api-data/) before production use.

## Development and testing

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run release:check
```

The standard suite uses mocked, sanitized fixtures and never calls FantasyPros. Live tests are explicitly opt-in:

```bash
FANTASYPROS_LIVE_TESTS=1 npm run test:live
```

Set `FANTASY_PROS_API_KEY` (preferred) or `FANTASYPROS_API_KEY` in the environment. Live Player Compare discovers current player IDs instead of storing fragile IDs in source.

## Resources

- [FantasyPros Public API v2 reference](https://api.fantasypros.com/public/v2/docs/)
- [FantasyPros API overview](https://www.fantasypros.com/api-data/)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Changelog](CHANGELOG.md)
- [Release process](RELEASING.md)

## Version history

- `0.1.2`: Replaced dynamic description property generation with static property literals for strict Creator Portal linting.
- `0.1.1`: Fixed credential test linking for n8n Creator Portal automated validation.
- `0.1.0`: Complete MVP with seven resources and twelve read operations.

## License

[MIT](LICENSE.md)

FantasyPros and related marks belong to their respective owner. This unofficial community project is not affiliated with, endorsed by, or sponsored by FantasyPros.
