import { describe, expect, it } from 'vitest';
import { FantasyPros } from '../nodes/FantasyPros/FantasyPros.node';
import { playerDescription } from '../nodes/FantasyPros/descriptions/PlayerDescription';
import {
	createExecuteContext,
	playerCompareParameters,
	playerGetManyParameters,
	rejected,
} from './helpers';

const node = new FantasyPros();

describe('Player operations', () => {
	it('fans out players, preserves raw fields, and pairs each result', async () => {
		const context = createExecuteContext(playerGetManyParameters(), [
			{
				players: [
					{ player_id: 1, custom: 'a' },
					{ player_id: 2, custom: 'b' },
				],
			},
		]);
		const [output] = await node.execute.call(context);
		expect(output).toEqual([
			{ json: { player_id: 1, custom: 'a' }, pairedItem: { item: 0 } },
			{ json: { player_id: 2, custom: 'b' }, pairedItem: { item: 0 } },
		]);
		expect(context.request).toHaveBeenCalledWith('fantasyProsApi', {
			method: 'GET',
			url: 'https://api.fantasypros.com/public/v2/json/nfl/players',
			qs: {},
			json: true,
		});
	});

	it('serializes every Player Get Many option using OpenAPI query names', async () => {
		const context = createExecuteContext(
			playerGetManyParameters({
				options: {
					playerId: 42,
					updatedSince: '2026-08-01T12:00:00.000Z',
					ecr: 'included',
					externalIds: ['yahoo', 'espn', 'cbs'],
					showPositionalRank: true,
				},
			}),
			[{ players: [] }],
		);
		await node.execute.call(context);
		expect(context.request.mock.calls[0][1].qs).toEqual({
			player: 42,
			update: '2026-08-01',
			ecr: 'included',
			external_ids: 'yahoo:espn:cbs',
			show: 'pos_rank',
		});
	});

	it('omits unset optional query parameters', async () => {
		const context = createExecuteContext(playerGetManyParameters(), [{ players: [] }]);
		await node.execute.call(context);
		expect(context.request.mock.calls[0][1].qs).toEqual({});
	});

	it('applies Limit after retrieval and Return All bypasses it', async () => {
		const players = [{ id: 1 }, { id: 2 }, { id: 3 }];
		const limited = createExecuteContext(playerGetManyParameters({ returnAll: false, limit: 2 }), [
			{ players },
		]);
		const all = createExecuteContext(playerGetManyParameters(), [{ players }]);
		expect((await node.execute.call(limited))[0]).toHaveLength(2);
		expect((await node.execute.call(all))[0]).toHaveLength(3);
	});

	it('emits no fake item for an empty collection', async () => {
		const context = createExecuteContext(playerGetManyParameters(), [{ players: [] }]);
		expect((await node.execute.call(context))[0]).toEqual([]);
	});

	it('processes and pairs every input item', async () => {
		const context = createExecuteContext(
			playerGetManyParameters({ sport: ['nfl', 'mlb'] }),
			[{ players: [{ id: 1 }] }, { players: [{ id: 2 }] }],
			{ inputCount: 2 },
		);
		const [output] = await node.execute.call(context);
		expect(output.map((item) => item.pairedItem)).toEqual([{ item: 0 }, { item: 1 }]);
		expect(context.request.mock.calls.map((call) => call[1].url)).toEqual([
			'https://api.fantasypros.com/public/v2/json/nfl/players',
			'https://api.fantasypros.com/public/v2/json/mlb/players',
		]);
	});

	it('serializes Compare IDs, experts, season, week, and detail options', async () => {
		const response = { sport: 'NFL', rankings: { PPR: {} }, players: {} };
		const context = createExecuteContext(
			playerCompareParameters({
				playerIds: '10, 20 30',
				compareOptions: { expertIds: '4,5', rankingType: 'ros', details: 'all' },
			}),
			[response],
		);
		const [output] = await node.execute.call(context);
		expect(context.request.mock.calls[0][1]).toMatchObject({
			url: 'https://api.fantasypros.com/public/v2/json/nfl/compare-players',
			qs: {
				players: '10:20:30',
				position: 'RB',
				year: 2026,
				week: 1,
				experts: '4:5',
				ranking_type: 'ros',
				details: 'all',
			},
		});
		expect(output).toEqual([{ json: response, pairedItem: { item: 0 } }]);
	});

	it('omits NFL week for other sports', async () => {
		const context = createExecuteContext(
			playerCompareParameters({ sport: 'mlb', position: 'OF' }),
			[{ sport: 'MLB', rankings: {} }],
		);
		await node.execute.call(context);
		expect(context.request.mock.calls[0][1].qs).not.toHaveProperty('week');
	});

	it.each(['1', '1:2:3:4:5'])(
		'rejects an invalid Compare player count before making a request (%s)',
		async (playerIds) => {
			const context = createExecuteContext(playerCompareParameters({ playerIds }));
			await expect(node.execute.call(context)).rejects.toThrow(/Player IDs must contain/);
			expect(context.request).not.toHaveBeenCalled();
		},
	);

	it('rejects malformed IDs, dates, seasons, and weeks before requesting', async () => {
		const cases = [
			playerCompareParameters({ playerIds: '1:nope' }),
			playerCompareParameters({ season: 2011 }),
			playerCompareParameters({ week: 23 }),
			playerGetManyParameters({ options: { updatedSince: '2026-02-30' } }),
			playerGetManyParameters({ options: { playerId: -1 } }),
			playerGetManyParameters({ returnAll: false, limit: 0 }),
		];
		for (const parameters of cases) {
			const context = createExecuteContext(parameters);
			await expect(node.execute.call(context)).rejects.toThrow();
			expect(context.request).not.toHaveBeenCalled();
		}
	});

	it('exposes every external ID value in the OpenAPI enum', () => {
		const options = playerDescription.find((property) => property.name === 'options');
		const externalIds = Array.isArray(options?.options)
			? options.options.find((property) => property.name === 'externalIds')
			: undefined;
		expect(externalIds?.options).toHaveLength(21);
		expect(externalIds?.options).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ value: 'fantasydraft' }),
				expect.objectContaining({ value: 'rts' }),
				expect.objectContaining({ value: 'xmlteam' }),
			]),
		);
	});

	it('rejects malformed collection response shapes', async () => {
		const context = createExecuteContext(playerGetManyParameters(), [{ players: {} }]);
		await expect(node.execute.call(context)).rejects.toThrow(/expected 'players' to be an array/);
	});

	it('honors continueOnFail per input item', async () => {
		const context = createExecuteContext(
			playerGetManyParameters({ sport: ['nfl', 'mlb'] }),
			[rejected({ statusCode: 401, message: 'secret-safe' }), { players: [{ id: 2 }] }],
			{ inputCount: 2, continueOnFail: true },
		);
		const [output] = await node.execute.call(context);
		expect(output).toHaveLength(2);
		expect(output[0].json.error).toMatch(/rejected the API key/);
		expect(output[0].pairedItem).toEqual({ item: 0 });
		expect(output[1]).toEqual({ json: { id: 2 }, pairedItem: { item: 1 } });
	});

	it.each([
		[400, 'rejected the request'],
		[401, 'rejected the API key'],
		[403, 'plan and endpoint entitlement'],
		[404, 'could not find'],
		[429, 'rate limit exceeded'],
		[503, 'temporarily unavailable'],
	])('converts HTTP %i into an actionable error', async (statusCode, message) => {
		const context = createExecuteContext(playerGetManyParameters(), [
			rejected({
				statusCode,
				message: 'API detail',
				response: { headers: { 'retry-after': '30' } },
			}),
		]);
		await expect(node.execute.call(context)).rejects.toThrow(message);
	});
});

describe('Player UI metadata', () => {
	it('has both operations and all generic sports', () => {
		const operation = playerDescription.find((property) => property.name === 'operation');
		const sport = playerDescription.find((property) => property.name === 'sport');
		expect(operation?.options).toMatchObject([
			{ name: 'Compare', value: 'compare' },
			{ name: 'Get Many', value: 'getMany' },
		]);
		expect(sport?.options).toMatchObject([
			{ value: 'mlb' },
			{ value: 'nba' },
			{ value: 'nfl' },
			{ value: 'nhl' },
		]);
	});

	it('shows week only for NFL Compare and Limit only when Return All is false', () => {
		const week = playerDescription.find((property) => property.name === 'week');
		const limit = playerDescription.find((property) => property.name === 'limit');
		expect(week?.displayOptions?.show).toEqual({
			resource: ['player'],
			operation: ['compare'],
			sport: ['nfl'],
		});
		expect(limit?.displayOptions?.show).toEqual({
			resource: ['player'],
			operation: ['getMany'],
			returnAll: [false],
		});
	});
});
