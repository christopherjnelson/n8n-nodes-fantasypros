import { describe, expect, it } from 'vitest';
import { FantasyPros } from '../nodes/FantasyPros/FantasyPros.node';
import { projectionDescription } from '../nodes/FantasyPros/descriptions/ProjectionDescription';
import { createExecuteContext, projectionParameters } from './helpers';

const node = new FantasyPros();

describe('Projection operations', () => {
	it.each([
		['getNfl', '/nfl/2026/projections', 'players', { position: 'QB', week: 1 }],
		['getMlb', '/mlb/2026/projections', 'player', { type: 'preseason' }],
		['getNba', '/nba/2026/projections', 'player', { type: 'preseason', stype: 'total' }],
	])('routes %s to the documented endpoint and collection', async (operation, path, field, qs) => {
		const context = createExecuteContext(projectionParameters(operation), [{ [field]: [] }]);
		await node.execute.call(context);
		expect(context.request).toHaveBeenCalledWith('fantasyProsApi', {
			method: 'GET',
			url: `https://api.fantasypros.com/public/v2/json${path}`,
			qs,
			json: true,
		});
	});

	it('serializes NFL position, positions, players, experts, and weekly mode', async () => {
		const context = createExecuteContext(
			projectionParameters('getNfl', {
				position: 'RB',
				nflWeek: 7,
				nflOptions: {
					positions: ['RB', 'WR', 'TE'],
					playerIds: '7354, 6880',
					expertIds: '345 332:12',
				},
			}),
			[{ players: [] }],
		);
		await node.execute.call(context);
		expect(context.request.mock.calls[0][1].qs).toEqual({
			position: 'RB',
			week: 7,
			positions: 'RB:WR:TE',
			players: '7354:6880',
			filters: '345:332:12',
		});
	});

	it.each([
		['preseason', { position: 'QB', week: 0 }],
		['ros', { position: 'QB', ros: true }],
	])('serializes NFL %s mode without an irrelevant week', async (period, expected) => {
		const context = createExecuteContext(
			projectionParameters('getNfl', { nflProjectionPeriod: period }),
			[{ players: [] }],
		);
		await node.execute.call(context);
		expect(context.request.mock.calls[0][1].qs).toEqual(expected);
	});

	it('serializes every MLB daily projection parameter using OpenAPI names', async () => {
		const context = createExecuteContext(
			projectionParameters('getMlb', {
				mlbProjectionType: 'daily',
				mlbDate: '2026-08-12',
				mlbPosition: 'OF',
				mlbOptions: {
					expertIds: '71,538',
					playerIds: '7354:6880',
					siteEligibility: 'Y',
					leagueKey: 'mlb~cd789a16-00f2-43c0-af80-f9d876c9e33e',
				},
			}),
			[{ player: [] }],
		);
		await node.execute.call(context);
		expect(context.request.mock.calls[0][1].qs).toEqual({
			type: 'daily',
			date: '2026-08-12',
			position: 'OF',
			filters: '71:538',
			fpIds: '7354,6880',
			site_eligibility: 'Y',
			league_key: 'mlb~cd789a16-00f2-43c0-af80-f9d876c9e33e',
		});
	});

	it('sends MLB week only for weekly projections and omits unset optional parameters', async () => {
		const weekly = createExecuteContext(
			projectionParameters('getMlb', { mlbProjectionType: 'weekly', mlbWeek: 28 }),
			[{ player: [] }],
		);
		const ros = createExecuteContext(projectionParameters('getMlb', { mlbProjectionType: 'ros' }), [
			{ player: [] },
		]);
		await node.execute.call(weekly);
		await node.execute.call(ros);
		expect(weekly.request.mock.calls[0][1].qs).toEqual({ type: 'weekly', week: 28 });
		expect(ros.request.mock.calls[0][1].qs).toEqual({ type: 'ros' });
	});

	it('serializes every NBA projection parameter using schema delimiters', async () => {
		const context = createExecuteContext(
			projectionParameters('getNba', {
				nbaProjectionType: 'daily',
				nbaDate: '2026-08-12',
				nbaPosition: 'PG',
				nbaStatisticsType: 'avg',
				nbaPreciseValues: true,
				nbaOptions: {
					expertIds: '71,538',
					playerIds: '2918:2239',
					teamIds: '1:2',
				},
			}),
			[{ player: [] }],
		);
		await node.execute.call(context);
		expect(context.request.mock.calls[0][1].qs).toEqual({
			type: 'daily',
			date: '2026-08-12',
			position: 'PG',
			stype: 'avg',
			stat_values: 'precise',
			filters: '71:538',
			fpIds: '2918,2239',
			team_id: '1,2',
		});
	});

	it('fans out differing collection keys with response context and paired metadata', async () => {
		const nfl = createExecuteContext(projectionParameters('getNfl'), [
			{ season: '2026', week: '1', players: [{ fpid: 1, stats: [] }] },
		]);
		const mlb = createExecuteContext(projectionParameters('getMlb'), [
			{ season: '2026', type: 'preseason', player: [{ fpid: 2, hr: 30 }] },
		]);
		expect((await node.execute.call(nfl))[0]).toEqual([
			{
				json: { fpid: 1, stats: [], _fantasyPros: { season: '2026', week: '1' } },
				pairedItem: { item: 0 },
			},
		]);
		expect((await node.execute.call(mlb))[0]).toEqual([
			{
				json: { fpid: 2, hr: 30, _fantasyPros: { season: '2026', type: 'preseason' } },
				pairedItem: { item: 0 },
			},
		]);
	});

	it('applies Limit, returns all, emits no fake items, and pairs multiple inputs', async () => {
		const players = [{ id: 1 }, { id: 2 }, { id: 3 }];
		const limited = createExecuteContext(
			projectionParameters('getNba', { returnAll: false, limit: 2 }),
			[{ player: players }],
		);
		const all = createExecuteContext(projectionParameters('getNba'), [{ player: players }]);
		const empty = createExecuteContext(projectionParameters('getNba'), [{ player: [] }]);
		const multiple = createExecuteContext(
			projectionParameters('getNba', { season: [2026, 2025] }),
			[{ player: [{ id: 1 }] }, { player: [{ id: 2 }] }],
			{ inputCount: 2 },
		);
		expect((await node.execute.call(limited))[0]).toHaveLength(2);
		expect((await node.execute.call(all))[0]).toHaveLength(3);
		expect((await node.execute.call(empty))[0]).toEqual([]);
		const liveStyleEmpty = createExecuteContext(projectionParameters('getNfl'), [
			{ count: 0, players: null },
		]);
		expect((await node.execute.call(liveStyleEmpty))[0]).toEqual([]);
		expect((await node.execute.call(multiple))[0].map((item) => item.pairedItem)).toEqual([
			{ item: 0 },
			{ item: 1 },
		]);
	});

	it('rejects invalid dates, seasons, weeks, IDs, league keys, operations, and response shapes', async () => {
		const cases = [
			projectionParameters('getNfl', { returnAll: false, limit: 0 }),
			projectionParameters('getNfl', { season: 2011 }),
			projectionParameters('getNfl', { nflWeek: 23 }),
			projectionParameters('getNfl', { nflOptions: { playerIds: '1:nope' } }),
			projectionParameters('getMlb', { mlbProjectionType: 'daily', mlbDate: '2026-02-30' }),
			projectionParameters('getMlb', { mlbProjectionType: 'weekly', mlbWeek: -1 }),
			projectionParameters('getMlb', { mlbProjectionType: 'unknown' }),
			projectionParameters('getNfl', { nflProjectionPeriod: 'unknown' }),
			projectionParameters('getMlb', { mlbOptions: { leagueKey: 'not-a-key' } }),
			projectionParameters('getNba', { nbaOptions: { teamIds: 'MIL,BOS' } }),
			projectionParameters('unknown'),
		];
		for (const parameters of cases) {
			const context = createExecuteContext(parameters);
			await expect(node.execute.call(context)).rejects.toThrow();
			expect(context.request).not.toHaveBeenCalled();
		}
		const malformed = createExecuteContext(projectionParameters('getMlb'), [{ player: {} }]);
		await expect(node.execute.call(malformed)).rejects.toThrow(/expected 'player' to be an array/);
		const unexplainedNull = createExecuteContext(projectionParameters('getNfl'), [
			{ count: 1, players: null },
		]);
		await expect(node.execute.call(unexplainedNull)).rejects.toThrow(
			/expected 'players' to be an array/,
		);
	});
});

describe('Projection UI metadata', () => {
	it('exposes all three operations', () => {
		const operation = projectionDescription.find((property) => property.name === 'operation');
		expect(operation?.options).toMatchObject([
			{ name: 'Get MLB', value: 'getMlb' },
			{ name: 'Get NBA', value: 'getNba' },
			{ name: 'Get NFL', value: 'getNfl' },
		]);
	});

	it('uses operation and mode-specific display conditions', () => {
		const nflWeek = projectionDescription.find((property) => property.name === 'nflWeek');
		const mlbDate = projectionDescription.find((property) => property.name === 'mlbDate');
		const mlbWeek = projectionDescription.find((property) => property.name === 'mlbWeek');
		const nbaDate = projectionDescription.find((property) => property.name === 'nbaDate');
		expect(nflWeek?.displayOptions?.show).toMatchObject({
			operation: ['getNfl'],
			nflProjectionPeriod: ['weekly'],
		});
		expect(mlbDate?.displayOptions?.show).toMatchObject({
			operation: ['getMlb'],
			mlbProjectionType: ['daily'],
		});
		expect(mlbWeek?.displayOptions?.show).toMatchObject({
			operation: ['getMlb'],
			mlbProjectionType: ['weekly'],
		});
		expect(nbaDate?.displayOptions?.show).toMatchObject({
			operation: ['getNba'],
			nbaProjectionType: ['daily'],
		});
	});
});
