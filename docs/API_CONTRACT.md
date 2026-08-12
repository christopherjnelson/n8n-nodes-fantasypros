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

## Specification discrepancies

The Rankings `filters` descriptions call the value comma-delimited, while the live OpenAPI schema pattern and examples require colon-delimited numeric IDs. This node follows the authoritative schema pattern and serializes expert IDs with colons.

The NBA Projection `team_id` examples use team abbreviations, while its referenced `digitComma` schema requires comma-delimited numeric IDs. This node follows the schema and validates numeric team IDs.

The live Projection API can return a collection as `null` when its accompanying `count` is zero, although the OpenAPI response schema declares an array. The node treats only this explicit zero-count form as an empty collection; other non-array values remain errors.

The MVP brief calls for a News recency or updated-since filter, but the current News OpenAPI operation exposes no such filter. It exposes `order_by` (`created` or `updated`) only. The node follows the live specification and does not invent an unsupported query parameter.
