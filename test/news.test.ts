import { describe, expect, it } from 'vitest';
import { FantasyPros } from '../nodes/FantasyPros/FantasyPros.node';
import { newsDescription } from '../nodes/FantasyPros/descriptions/NewsDescription';
import { createExecuteContext, newsParameters } from './helpers';

const node = new FantasyPros();

describe('News Get Many', () => {
	it('routes to the sport News endpoint with native limit', async () => {
		const context = createExecuteContext(newsParameters({ limit: 12 }), [{ items: [] }]);
		await node.execute.call(context);
		expect(context.request).toHaveBeenCalledWith('fantasyProsApi', {
			method: 'GET',
			url: 'https://api.fantasypros.com/public/v2/json/nfl/news',
			qs: { limit: 12 },
			json: true,
		});
	});

	it('serializes category, player, ordering, and MLB-only player ID', async () => {
		const context = createExecuteContext(
			newsParameters({
				sport: 'mlb',
				newsOptions: {
					category: 'injury',
					playerId: 7354,
					mlbamId: 701350,
					orderBy: 'updated',
				},
			}),
			[{ items: [] }],
		);
		await node.execute.call(context);
		expect(context.request.mock.calls[0][1].qs).toEqual({
			limit: 50,
			category: 'injury',
			fpid: 7354,
			MLBAMID: 701350,
			order_by: 'updated',
		});
	});

	it('omits MLBAMID outside MLB and omits unset filters', async () => {
		const context = createExecuteContext(
			newsParameters({ sport: 'nba', newsOptions: { mlbamId: 701350 } }),
			[{ items: [] }],
		);
		await node.execute.call(context);
		expect(context.request.mock.calls[0][1].qs).toEqual({ limit: 50 });
	});

	it('Return All requests the API maximum and Limit slices defensively', async () => {
		const items = Array.from({ length: 4 }, (_, id) => ({ id }));
		const all = createExecuteContext(newsParameters({ returnAll: true }), [{ items }]);
		const limited = createExecuteContext(newsParameters({ limit: 2 }), [{ items }]);
		expect((await node.execute.call(all))[0]).toHaveLength(4);
		expect(all.request.mock.calls[0][1].qs).toEqual({ limit: 100 });
		expect((await node.execute.call(limited))[0]).toHaveLength(2);
	});

	it('fans out raw items with response context, pairedItem, empty handling, and multiple inputs', async () => {
		const context = createExecuteContext(
			newsParameters({ sport: ['nfl', 'nhl'] }),
			[
				{ sport: 'NFL', title: 'News', count: 1, items: [{ id: 1, desc: 'a' }] },
				{ sport: 'NHL', title: 'News', count: 0, items: [] },
			],
			{ inputCount: 2 },
		);
		const [output] = await node.execute.call(context);
		expect(output).toEqual([
			{
				json: {
					id: 1,
					desc: 'a',
					_fantasyPros: { sport: 'NFL', title: 'News', count: 1 },
				},
				pairedItem: { item: 0 },
			},
		]);
		expect(context.request).toHaveBeenCalledTimes(2);
	});

	it('rejects unsupported operations and malformed response shapes', async () => {
		const unsupported = createExecuteContext(newsParameters({ operation: 'unknown' }));
		await expect(node.execute.call(unsupported)).rejects.toThrow(/Unsupported News operation/);
		expect(unsupported.request).not.toHaveBeenCalled();
		for (const limit of [0, 101, 1.5]) {
			const invalidLimit = createExecuteContext(newsParameters({ limit }));
			await expect(node.execute.call(invalidLimit)).rejects.toThrow(/Limit must be an integer/);
			expect(invalidLimit.request).not.toHaveBeenCalled();
		}
		const malformed = createExecuteContext(newsParameters(), [{ items: {} }]);
		await expect(node.execute.call(malformed)).rejects.toThrow(/expected 'items' to be an array/);
	});
});

describe('News UI metadata', () => {
	it('exposes Get Many, four sports, categories, ordering, and MLB-only MLBAM ID', () => {
		const operation = newsDescription.find((property) => property.name === 'operation');
		const sport = newsDescription.find((property) => property.name === 'sport');
		const options = newsDescription.find((property) => property.name === 'newsOptions');
		const mlbam = options?.options?.find((property) => property.name === 'mlbamId');
		expect(operation?.options).toMatchObject([{ name: 'Get Many', value: 'getMany' }]);
		expect(sport?.options).toHaveLength(4);
		expect(options?.options?.find((property) => property.name === 'category')).toBeDefined();
		expect(options?.options?.find((property) => property.name === 'orderBy')).toBeDefined();
		expect(mlbam?.displayOptions?.show).toEqual({ '/sport': ['mlb'] });
	});
});
