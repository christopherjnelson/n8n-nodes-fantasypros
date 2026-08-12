# n8n-nodes-fantasypros

An n8n community node for the official FantasyPros Public API v2. The package is under active MVP development.

## Installation

Install `n8n-nodes-fantasypros` through n8n Community Nodes after it is published. No npm release has been made yet.

## Compatibility

Development targets Node.js 22.22 or newer and current n8n community-node tooling.

## Credentials

Request an API key from [FantasyPros API Data](https://www.fantasypros.com/api-data/), then create a **FantasyPros API** credential in n8n. The credential sends the key in the `x-api-key` header. Never place the key in workflow fields.

Users must provide their own key and comply with the terms and entitlements of their FantasyPros plan. A prototype or limited key must not be assumed to permit production use.

## Operations

Current operations:

- Player → Get Many: returns one n8n item per player, with Return All/Limit controls
- Player → Compare: returns one item containing the API's nested ranking groups plus optional player and expert detail maps

The planned MVP also covers Rankings, Projection, News, Injury, NFL player points, and MLB lineups through the routes described in [the API contract](docs/API_CONTRACT.md).

## Development

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

The standard suite uses mocked data and never requires a live API key.

Live tests are opt-in. Export `FANTASY_PROS_API_KEY` (or `FANTASYPROS_API_KEY`) and run `npm run test:live`. Live Player Compare discovers current IDs from Player Get Many rather than keeping fragile IDs in source.

## Resources

- [Official FantasyPros Public API v2 reference](https://api.fantasypros.com/public/v2/docs/)
- [FantasyPros API overview](https://www.fantasypros.com/api-data/)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE.md)

FantasyPros is a trademark of its owner. This independent community project is not affiliated with or endorsed by FantasyPros.
