import { describe, expect, it } from 'vitest';
import { FantasyPros } from '../nodes/FantasyPros/FantasyPros.node';
import { rankingsDescription } from '../nodes/FantasyPros/descriptions/RankingsDescription';
import { createExecuteContext, rankingsParameters } from './helpers';

const node = new FantasyPros();

describe('Ranking operations', () => {
	it.each([
		['getRankings', '/nfl/2026/rankings', 'players'],
		['getConsensusRankings', '/nfl/2026/consensus-rankings', 'players'],
		['getExperts', '/nfl/2026/rankings/experts', 'experts'],
	])('routes %s to the documented endpoint', async (operation, path, field) => {
		const context = createExecuteContext(rankingsParameters(operation), [{ [field]: [] }]);
		await node.execute.call(context);
		expect(context.request).toHaveBeenCalledWith('fantasyProsApi', {
			method: 'GET',
			url: `https://api.fantasypros.com/public/v2/json${path}`,
			qs: operation === 'getConsensusRankings' ? { position: 'RB' } : {},
			json: true,
		});
	});

	it('serializes every Get Rankings parameter using OpenAPI names', async () => {
		const context = createExecuteContext(
			rankingsParameters('getRankings', {
				useDraftersType: true,
				rankingsOptions: {
					playerId: 6880,
					expertIds: '345, 332:12',
					minimal: true,
					rankRange: true,
					rankStats: true,
					week: 0,
				},
			}),
			[{ players: [] }],
		);
		await node.execute.call(context);
		expect(context.request.mock.calls[0][1].qs).toEqual({
			player: 6880,
			filters: '345:332:12',
			min: 'true',
			range: 'true',
			rankstats: 'true',
			week: 0,
			type: 'DRAFTERS',
		});
	});

	it('serializes MLB site eligibility and omits NFL-only ranking type', async () => {
		const context = createExecuteContext(
			rankingsParameters('getRankings', {
				sport: 'mlb',
				siteEligibility: 'CBSSP',
				useDraftersType: true,
			}),
			[{ players: [] }],
		);
		await node.execute.call(context);
		expect(context.request.mock.calls[0][1].qs).toEqual({ site_eligibility: 'CBSSP' });
	});

	it('serializes Consensus Rankings filters and NFL-only parameters', async () => {
		const context = createExecuteContext(
			rankingsParameters('getConsensusRankings', {
				position: 'IDP',
				rankingType: 'ROS',
				scoring: 'PPR',
				consensusOptions: {
					expertIds: '345 332',
					expertDetails: 'available',
					includeIdp: true,
					week: 8,
				},
			}),
			[{ players: [] }],
		);
		await node.execute.call(context);
		expect(context.request.mock.calls[0][1].qs).toEqual({
			position: 'IDP',
			type: 'ROS',
			scoring: 'PPR',
			filters: '345:332',
			experts: 'available',
			include_idp: 'true',
			week: 8,
		});
	});

	it('omits NFL-only Consensus Rankings parameters for other sports', async () => {
		const context = createExecuteContext(
			rankingsParameters('getConsensusRankings', {
				sport: 'mlb',
				position: 'OF',
				rankingType: 'DRAFT',
				scoring: 'PPR',
				consensusOptions: { includeIdp: true, week: 4 },
			}),
			[{ players: [] }],
		);
		await node.execute.call(context);
		expect(context.request.mock.calls[0][1].qs).toEqual({ position: 'OF', type: 'DRAFT' });
	});

	it('serializes every Get Experts parameter and permits all optional filters to be unset', async () => {
		const populated = createExecuteContext(
			rankingsParameters('getExperts', {
				position: 'QB',
				rankingType: 'DRAFT',
				scoring: 'HALF',
				includeOverall: true,
			}),
			[{ experts: [] }],
		);
		const empty = createExecuteContext(rankingsParameters('getExperts'), [{ experts: [] }]);
		await node.execute.call(populated);
		await node.execute.call(empty);
		expect(populated.request.mock.calls[0][1].qs).toEqual({
			position: 'QB',
			type: 'DRAFT',
			scoring: 'HALF',
			include_overall: 'true',
		});
		expect(empty.request.mock.calls[0][1].qs).toEqual({});
	});

	it('fans out entities with response context, raw fields, and paired input metadata', async () => {
		const context = createExecuteContext(rankingsParameters('getRankings'), [
			{
				sport: 'NFL',
				season: 2026,
				players: [
					{ player_id: 1, rank: 2 },
					{ player_id: 2, rank: 1 },
				],
			},
		]);
		const [output] = await node.execute.call(context);
		expect(output).toEqual([
			{
				json: { player_id: 1, rank: 2, _fantasyPros: { sport: 'NFL', season: 2026 } },
				pairedItem: { item: 0 },
			},
			{
				json: { player_id: 2, rank: 1, _fantasyPros: { sport: 'NFL', season: 2026 } },
				pairedItem: { item: 0 },
			},
		]);
	});

	it('applies Limit after retrieval, returns all, and emits nothing for empty arrays', async () => {
		const entities = [{ id: 1 }, { id: 2 }, { id: 3 }];
		const limited = createExecuteContext(
			rankingsParameters('getExperts', { returnAll: false, limit: 2 }),
			[{ experts: entities }],
		);
		const all = createExecuteContext(rankingsParameters('getExperts'), [{ experts: entities }]);
		const empty = createExecuteContext(rankingsParameters('getExperts'), [{ experts: [] }]);
		expect((await node.execute.call(limited))[0]).toHaveLength(2);
		expect((await node.execute.call(all))[0]).toHaveLength(3);
		expect((await node.execute.call(empty))[0]).toEqual([]);
	});

	it('processes and pairs multiple input items', async () => {
		const context = createExecuteContext(
			rankingsParameters('getRankings', {
				sport: ['nfl', 'nhl'],
				season: [2026, 2025],
			}),
			[{ players: [{ id: 1 }] }, { players: [{ id: 2 }] }],
			{ inputCount: 2 },
		);
		const [output] = await node.execute.call(context);
		expect(output.map((item) => item.pairedItem)).toEqual([{ item: 0 }, { item: 1 }]);
		expect(context.request.mock.calls.map((call) => call[1].url)).toEqual([
			'https://api.fantasypros.com/public/v2/json/nfl/2026/rankings',
			'https://api.fantasypros.com/public/v2/json/nhl/2025/rankings',
		]);
	});

	it('rejects invalid seasons, weeks, IDs, operations, and response shapes before output', async () => {
		const cases = [
			rankingsParameters('getRankings', { season: 2011 }),
			rankingsParameters('getRankings', { rankingsOptions: { week: 23 } }),
			rankingsParameters('getRankings', { rankingsOptions: { expertIds: '3:nope' } }),
			rankingsParameters('unknown'),
		];
		for (const parameters of cases) {
			const context = createExecuteContext(parameters);
			await expect(node.execute.call(context)).rejects.toThrow();
			expect(context.request).not.toHaveBeenCalled();
		}
		const malformed = createExecuteContext(rankingsParameters('getRankings'), [{ players: {} }]);
		await expect(node.execute.call(malformed)).rejects.toThrow(/expected 'players' to be an array/);
	});
});

describe('Ranking UI metadata', () => {
	it('exposes all operations and generic sports', () => {
		const operation = rankingsDescription.find((property) => property.name === 'operation');
		const sport = rankingsDescription.find((property) => property.name === 'sport');
		expect(operation?.options).toMatchObject([
			{ name: 'Get Consensus Rankings', value: 'getConsensusRankings' },
			{ name: 'Get Experts', value: 'getExperts' },
			{ name: 'Get Rankings', value: 'getRankings' },
		]);
		expect(sport?.options).toMatchObject([
			{ value: 'mlb' },
			{ value: 'nba' },
			{ value: 'nfl' },
			{ value: 'nhl' },
		]);
	});

	it('uses sport-aware fields and conditions', () => {
		const positions = rankingsDescription.filter((property) => property.name === 'position');
		const scoring = rankingsDescription.filter((property) => property.name === 'scoring');
		const drafters = rankingsDescription.find((property) => property.name === 'useDraftersType');
		const eligibility = rankingsDescription.find((property) => property.name === 'siteEligibility');
		expect(positions).toHaveLength(8);
		expect(scoring.map((property) => property.displayOptions?.show?.sport)).toEqual([
			['nfl'],
			['nba'],
		]);
		expect(drafters?.displayOptions?.show).toMatchObject({
			operation: ['getRankings'],
			sport: ['nfl'],
		});
		expect(eligibility?.displayOptions?.show).toMatchObject({
			operation: ['getRankings'],
			sport: ['mlb'],
		});
	});
});
