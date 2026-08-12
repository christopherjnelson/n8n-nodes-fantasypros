import { describe, expect, it } from 'vitest';
import { FantasyPros } from '../nodes/FantasyPros/FantasyPros.node';
import { mlbDescription } from '../nodes/FantasyPros/descriptions/MlbDescription';
import confirmedResponse from './fixtures/mlb-lineups-confirmed.json';
import projectedResponse from './fixtures/mlb-lineups-projected.json';
import { createExecuteContext, mlbParameters } from './helpers';

const node = new FantasyPros();

describe('MLB Get Lineups', () => {
	it('routes with date and period while omitting the optional projected flag', async () => {
		const context = createExecuteContext(mlbParameters({ startDate: '2026-08-12T14:30:00.000Z' }), [
			{ games: [] },
		]);
		await node.execute.call(context);
		expect(context.request).toHaveBeenCalledWith('fantasyProsApi', {
			method: 'GET',
			url: 'https://api.fantasypros.com/public/v2/json/mlb/lineups',
			qs: { start: '2026-08-12', period: 'REG' },
			json: true,
		});
	});

	it('serializes projected lineups using the documented string value', async () => {
		const context = createExecuteContext(mlbParameters({ period: 'PRE', projected: true }), [
			projectedResponse,
		]);
		await node.execute.call(context);
		expect(context.request.mock.calls[0][1].qs).toEqual({
			start: '2026-08-12',
			period: 'PRE',
			projected: 'true',
		});
	});

	it('preserves confirmed nested team, hitter, and pitcher data in one game item', async () => {
		const context = createExecuteContext(mlbParameters(), [confirmedResponse]);
		const [output] = await node.execute.call(context);
		expect(output).toHaveLength(1);
		expect(output[0].json).toMatchObject({
			game_id: 'game-confirmed',
			teams: { BAL: { record: '60-58' } },
			hitters: { BAL: { '1': { player_id: '46268', position: '2B' } } },
			pitchers: { TEX: { player_id: '6995', player_name: 'Sample Pitcher' } },
			_fantasyPros: {
				season: '2026',
				start: '2026-08-12',
				end: '2026-08-12',
				count: 1,
			},
		});
		expect(output[0].pairedItem).toEqual({ item: 0 });
	});

	it('preserves projected nested lineup data deterministically', async () => {
		const context = createExecuteContext(mlbParameters({ projected: true }), [projectedResponse]);
		const [output] = await node.execute.call(context);
		expect(output[0].json).toMatchObject({
			game_id: 'game-projected',
			hitters: { NYY: { '1': { player_id: '300' } } },
			pitchers: { BOS: { player_id: '200', player_name: 'Projected Pitcher' } },
		});
	});

	it('applies Limit after retrieval and Return All preserves all games', async () => {
		const games = Array.from({ length: 4 }, (_, game_id) => ({
			game_id: String(game_id),
			teams: {},
			hitters: {},
			pitchers: {},
		}));
		const limited = createExecuteContext(mlbParameters({ limit: 2 }), [{ games }]);
		const all = createExecuteContext(mlbParameters({ returnAll: true }), [{ games }]);
		expect((await node.execute.call(limited))[0]).toHaveLength(2);
		expect((await node.execute.call(all))[0]).toHaveLength(4);
	});

	it('distinguishes valid empty slates from malformed or missing collections', async () => {
		for (const emptyResponse of [
			{ count: 0, games: [] },
			{ count: 0, games: null },
		]) {
			const empty = createExecuteContext(mlbParameters(), [emptyResponse]);
			expect((await node.execute.call(empty))[0]).toEqual([]);
		}
		for (const malformedResponse of [{ count: 0 }, { count: 1, games: null }, { games: {} }]) {
			const malformed = createExecuteContext(mlbParameters(), [malformedResponse]);
			await expect(node.execute.call(malformed)).rejects.toThrow(/expected 'games' to be an array/);
		}
	});

	it('handles multiple inputs and preserves their pairedItem relationships', async () => {
		const context = createExecuteContext(
			mlbParameters({ startDate: ['2026-08-12', '2026-08-13'] }),
			[
				{ games: [{ game_id: 'one', teams: {}, hitters: {}, pitchers: {} }] },
				{ games: [{ game_id: 'two', teams: {}, hitters: {}, pitchers: {} }] },
			],
			{ inputCount: 2 },
		);
		const [output] = await node.execute.call(context);
		expect(output.map((item) => [item.json.game_id, item.pairedItem])).toEqual([
			['one', { item: 0 }],
			['two', { item: 1 }],
		]);
	});

	it('validates date, period, Limit, and operation before requesting', async () => {
		const cases = [
			[mlbParameters({ startDate: '2026-02-30' }), /valid calendar date/],
			[mlbParameters({ startDate: '08-12-2026' }), /YYYY-MM-DD/],
			[mlbParameters({ startDate: '2026-08-12-not-iso' }), /valid date or ISO date-time/],
			[mlbParameters({ period: 'SPRING' }), /Period must be/],
			[mlbParameters({ limit: 0 }), /Limit must be/],
			[mlbParameters({ limit: 1.5 }), /Limit must be/],
			[mlbParameters({ operation: 'unknown' }), /Unsupported MLB operation/],
		] as const;
		for (const [parameters, message] of cases) {
			const context = createExecuteContext(parameters);
			await expect(node.execute.call(context)).rejects.toThrow(message);
			expect(context.request).not.toHaveBeenCalled();
		}
	});

	it('rejects games with malformed essential nested fields', async () => {
		for (const game of [
			{ game_id: 'one', hitters: {}, pitchers: {} },
			{ game_id: 'one', teams: [], hitters: {}, pitchers: {} },
			{ game_id: 1, teams: {}, hitters: {}, pitchers: {} },
		]) {
			const context = createExecuteContext(mlbParameters(), [{ games: [game] }]);
			await expect(node.execute.call(context)).rejects.toThrow(/each game must include/);
		}
	});
});

describe('MLB UI metadata', () => {
	it('exposes date, all season periods, projected lineups, Return All, and Limit', () => {
		const operation = mlbDescription.find((property) => property.name === 'operation');
		const fields = mlbDescription.map((property) => property.name);
		const period = mlbDescription.find((property) => property.name === 'period');
		expect(operation?.options).toMatchObject([{ name: 'Get Lineups', value: 'getLineups' }]);
		expect(fields).toEqual(
			expect.arrayContaining(['startDate', 'period', 'projected', 'returnAll', 'limit']),
		);
		expect(period?.options).toHaveLength(3);
	});
});
