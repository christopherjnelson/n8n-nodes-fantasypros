# FantasyPros API contract

The node targets the official FantasyPros Public API v2 base URL:
`https://api.fantasypros.com/public/v2/json`.

The live [OpenAPI documentation](https://api.fantasypros.com/public/v2/docs/) is authoritative for query names, allowed values, conditional behavior, and response shapes. The specification is inspected during development and is not committed as a generated artifact.

## MVP endpoint coverage

| Resource   | Operation              | Route                                      |
| ---------- | ---------------------- | ------------------------------------------ |
| Player     | Get Many               | `GET /{sport}/players`                     |
| Player     | Compare                | `GET /{sport}/compare-players`             |
| Rankings   | Get Rankings           | `GET /{sport}/{season}/rankings`           |
| Rankings   | Get Consensus Rankings | `GET /{sport}/{season}/consensus-rankings` |
| Rankings   | Get Experts            | `GET /{sport}/{season}/rankings/experts`   |
| Projection | Get NFL                | `GET /nfl/{season}/projections`            |
| Projection | Get MLB                | `GET /mlb/{season}/projections`            |
| Projection | Get NBA                | `GET /nba/{season}/projections`            |
| News       | Get Many               | `GET /{sport}/news`                        |
| Injury     | Get Many               | `GET /{sport}/injuries`                    |
| NFL        | Get Player Points      | `GET /nfl/{season}/player-points`          |
| MLB        | Get Lineups            | `GET /mlb/lineups`                         |

PGA, NCAAF, triggers, writes, custom league synchronization, and other FantasyPros functionality are outside the MVP.
