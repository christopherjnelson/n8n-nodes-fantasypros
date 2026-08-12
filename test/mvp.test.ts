import { describe, expect, it } from 'vitest';
import { FantasyPros } from '../nodes/FantasyPros/FantasyPros.node';
import {
	createExecuteContext,
	injuryParameters,
	mlbParameters,
	newsParameters,
	nflParameters,
	playerCompareParameters,
	playerGetManyParameters,
	projectionParameters,
	rankingsParameters,
} from './helpers';

const node = new FantasyPros();

const routes = [
	{
		label: 'Player Get Many',
		parameters: playerGetManyParameters(),
		response: { players: [] },
		path: '/nfl/players',
	},
	{
		label: 'Player Compare',
		parameters: playerCompareParameters(),
		response: { sport: 'NFL', rankings: {} },
		path: '/nfl/compare-players',
	},
	{
		label: 'Rankings Get Rankings',
		parameters: rankingsParameters('getRankings'),
		response: { players: [] },
		path: '/nfl/2026/rankings',
	},
	{
		label: 'Rankings Get Consensus Rankings',
		parameters: rankingsParameters('getConsensusRankings'),
		response: { players: [] },
		path: '/nfl/2026/consensus-rankings',
	},
	{
		label: 'Rankings Get Experts',
		parameters: rankingsParameters('getExperts'),
		response: { experts: [] },
		path: '/nfl/2026/rankings/experts',
	},
	{
		label: 'Projection Get NFL',
		parameters: projectionParameters('getNfl'),
		response: { players: [] },
		path: '/nfl/2026/projections',
	},
	{
		label: 'Projection Get MLB',
		parameters: projectionParameters('getMlb'),
		response: { player: [] },
		path: '/mlb/2026/projections',
	},
	{
		label: 'Projection Get NBA',
		parameters: projectionParameters('getNba'),
		response: { player: [] },
		path: '/nba/2026/projections',
	},
	{
		label: 'News Get Many',
		parameters: newsParameters(),
		response: { items: [] },
		path: '/nfl/news',
	},
	{
		label: 'Injury Get Many',
		parameters: injuryParameters(),
		response: { injuries: [] },
		path: '/nfl/injuries',
	},
	{
		label: 'NFL Get Player Points',
		parameters: nflParameters(),
		response: { players: [] },
		path: '/nfl/2026/player-points',
	},
	{
		label: 'MLB Get Lineups',
		parameters: mlbParameters(),
		response: { games: [] },
		path: '/mlb/lineups',
	},
] as const;

describe('complete MVP regression matrix', () => {
	it.each(routes)('routes $label', async ({ parameters, response, path }) => {
		const context = createExecuteContext(parameters, [response]);
		await node.execute.call(context);
		expect(context.request).toHaveBeenCalledTimes(1);
		expect(context.request.mock.calls[0][1].url).toBe(
			`https://api.fantasypros.com/public/v2/json${path}`,
		);
	});

	it('registers exactly seven resources and twelve operations', () => {
		const resource = node.description.properties.find((property) => property.name === 'resource');
		const operationProperties = node.description.properties.filter(
			(property) => property.name === 'operation',
		);
		expect(resource?.options).toHaveLength(7);
		expect(
			operationProperties.reduce(
				(total, property) =>
					total + (Array.isArray(property.options) ? property.options.length : 0),
				0,
			),
		).toBe(12);
	});
});
