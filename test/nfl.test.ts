import { describe, expect, it } from 'vitest';
import { FantasyPros } from '../nodes/FantasyPros/FantasyPros.node';
import { nflDescription } from '../nodes/FantasyPros/descriptions/NflDescription';
import { createExecuteContext, nflParameters } from './helpers';

const node = new FantasyPros();

describe('NFL Get Player Points', () => {
	it('routes to the season-specific endpoint and serializes every filter', async () => {
		const context = createExecuteContext(
			nflParameters({
				season: 2025,
				startWeek: 2,
				endWeek: 8,
				position: 'QB',
				scoring: 'PPR',
				minimalResponse: true,
			}),
			[{ players: [] }],
		);
		await node.execute.call(context);
		expect(context.request).toHaveBeenCalledWith('fantasyProsApi', {
			method: 'GET',
			url: 'https://api.fantasypros.com/public/v2/json/nfl/2025/player-points',
			qs: { start: 2, end: 8, position: 'QB', scoring: 'PPR', min: 'true' },
			json: true,
		});
	});

	it('omits the optional minimal-response flag when false', async () => {
		const context = createExecuteContext(nflParameters(), [{ players: [] }]);
		await node.execute.call(context);
		expect(context.request.mock.calls[0][1].qs).toEqual({
			start: 1,
			end: 18,
			position: 'ALL',
			scoring: 'STD',
		});
	});

	it('rejects an end week earlier than the start week before requesting', async () => {
		const context = createExecuteContext(nflParameters({ startWeek: 10, endWeek: 9 }));
		await expect(node.execute.call(context)).rejects.toThrow(
			/End Week must not be earlier than Start Week/,
		);
		expect(context.request).not.toHaveBeenCalled();
	});

	it('validates season, week bounds, integer weeks, Limit, and operation', async () => {
		const cases = [
			[nflParameters({ season: 2011 }), /Season must be/],
			[nflParameters({ startWeek: 0 }), /Start Week must be/],
			[nflParameters({ endWeek: 23 }), /End Week must be/],
			[nflParameters({ startWeek: 1.5 }), /Start Week must be/],
			[nflParameters({ limit: 0 }), /Limit must be/],
			[nflParameters({ limit: 1.5 }), /Limit must be/],
			[nflParameters({ operation: 'unknown' }), /Unsupported NFL operation/],
		] as const;
		for (const [parameters, message] of cases) {
			const context = createExecuteContext(parameters);
			await expect(node.execute.call(context)).rejects.toThrow(message);
			expect(context.request).not.toHaveBeenCalled();
		}
	});

	it('applies Limit after retrieval and Return All preserves all players', async () => {
		const players = Array.from({ length: 4 }, (_, player_id) => ({ player_id }));
		const limited = createExecuteContext(nflParameters({ limit: 2 }), [{ players }]);
		const all = createExecuteContext(nflParameters({ returnAll: true }), [{ players }]);
		expect((await node.execute.call(limited))[0]).toHaveLength(2);
		expect((await node.execute.call(all))[0]).toHaveLength(4);
	});

	it('fans out raw players with context, pairing, empty handling, and multiple inputs', async () => {
		const context = createExecuteContext(
			nflParameters({ season: [2025, 2026] }),
			[
				{ season: '2025', scoring: 'STD', players: [{ player_id: 1, points: 10 }] },
				{ season: '2026', scoring: 'STD', players: [] },
			],
			{ inputCount: 2 },
		);
		const [output] = await node.execute.call(context);
		expect(output).toEqual([
			{
				json: {
					player_id: 1,
					points: 10,
					_fantasyPros: { season: '2025', scoring: 'STD' },
				},
				pairedItem: { item: 0 },
			},
		]);
		expect(context.request).toHaveBeenCalledTimes(2);
	});

	it('rejects malformed response shapes', async () => {
		const context = createExecuteContext(nflParameters(), [{ players: {} }]);
		await expect(node.execute.call(context)).rejects.toThrow(/expected 'players' to be an array/);
	});
});

describe('NFL UI metadata', () => {
	it('exposes the complete Get Player Points contract', () => {
		const operation = nflDescription.find((property) => property.name === 'operation');
		const fields = nflDescription.map((property) => property.name);
		const position = nflDescription.find((property) => property.name === 'position');
		const scoring = nflDescription.find((property) => property.name === 'scoring');
		expect(operation?.options).toMatchObject([
			{ name: 'Get Player Points', value: 'getPlayerPoints' },
		]);
		expect(fields).toEqual(
			expect.arrayContaining([
				'season',
				'startWeek',
				'endWeek',
				'position',
				'scoring',
				'minimalResponse',
				'returnAll',
				'limit',
			]),
		);
		expect(position?.options).toHaveLength(18);
		expect(scoring?.options).toHaveLength(3);
	});
});
