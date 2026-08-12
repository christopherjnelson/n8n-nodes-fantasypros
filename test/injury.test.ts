import { describe, expect, it } from 'vitest';
import { FantasyPros } from '../nodes/FantasyPros/FantasyPros.node';
import { injuryDescription } from '../nodes/FantasyPros/descriptions/InjuryDescription';
import { createExecuteContext, injuryParameters } from './helpers';

const node = new FantasyPros();

describe('Injury Get Many', () => {
	it('routes every supported sport to its Injury endpoint', async () => {
		for (const sport of ['nfl', 'mlb', 'nba', 'nhl']) {
			const context = createExecuteContext(injuryParameters({ sport }), [{ injuries: [] }]);
			await node.execute.call(context);
			expect(context.request.mock.calls[0][1].url).toBe(
				`https://api.fantasypros.com/public/v2/json/${sport}/injuries`,
			);
		}
	});

	it('serializes NFL filters and colon-delimited IDs', async () => {
		const context = createExecuteContext(
			injuryParameters({
				injuryOptions: {
					year: 2026,
					week: 2,
					includeProbabilities: true,
					includeMinors: true,
					teamIds: 'SF, MIN',
					playerIds: '7354, 6880',
				},
			}),
			[{ injuries: [] }],
		);
		await node.execute.call(context);
		expect(context.request.mock.calls[0][1].qs).toEqual({
			year: 2026,
			week: 2,
			include_probabilities: 'true',
			team_id: 'SF:MIN',
			player_ids: '7354:6880',
		});
	});

	it('serializes MLB-only minor-league option and omits sport-inapplicable filters', async () => {
		const context = createExecuteContext(
			injuryParameters({
				sport: 'mlb',
				injuryOptions: {
					week: 3,
					includeProbabilities: true,
					includeMinors: true,
				},
			}),
			[{ injuries: [] }],
		);
		await node.execute.call(context);
		expect(context.request.mock.calls[0][1].qs).toEqual({ include_minors: 'true' });
	});

	it('applies Limit after retrieval and Return All preserves every injury', async () => {
		const injuries = Array.from({ length: 4 }, (_, player_id) => ({ player_id }));
		const limited = createExecuteContext(injuryParameters({ limit: 2 }), [{ injuries }]);
		const all = createExecuteContext(injuryParameters({ returnAll: true }), [{ injuries }]);
		expect((await node.execute.call(limited))[0]).toHaveLength(2);
		expect(limited.request.mock.calls[0][1].qs).toEqual({});
		expect((await node.execute.call(all))[0]).toHaveLength(4);
	});

	it('fans out raw injuries with context, pairedItem, empty handling, and multiple inputs', async () => {
		const context = createExecuteContext(
			injuryParameters({ sport: ['nfl', 'nhl'] }),
			[
				{ sport: 'NFL', count: 1, injuries: [{ player_id: 1, status: 'OUT' }] },
				{ sport: 'NHL', count: 0, injuries: [] },
			],
			{ inputCount: 2 },
		);
		const [output] = await node.execute.call(context);
		expect(output).toEqual([
			{
				json: {
					player_id: 1,
					status: 'OUT',
					_fantasyPros: { sport: 'NFL', count: 1 },
				},
				pairedItem: { item: 0 },
			},
		]);
		expect(context.request).toHaveBeenCalledTimes(2);
	});

	it('validates limits, seasons, weeks, IDs, operations, and response shapes before use', async () => {
		const cases = [
			[injuryParameters({ limit: 0 }), /Limit must be a positive integer/],
			[injuryParameters({ limit: 1.5 }), /Limit must be a positive integer/],
			[injuryParameters({ injuryOptions: { year: 2011 } }), /Season must be/],
			[injuryParameters({ injuryOptions: { year: -1 } }), /Season must be/],
			[injuryParameters({ injuryOptions: { year: 'not-a-year' } }), /Season must be/],
			[injuryParameters({ injuryOptions: { week: 23 } }), /Week must be/],
			[injuryParameters({ injuryOptions: { teamIds: 'SF-BAD' } }), /Team IDs must/],
			[injuryParameters({ injuryOptions: { playerIds: '7354:x' } }), /Player IDs must/],
			[injuryParameters({ operation: 'unknown' }), /Unsupported Injury operation/],
		] as const;
		for (const [parameters, message] of cases) {
			const context = createExecuteContext(parameters);
			await expect(node.execute.call(context)).rejects.toThrow(message);
			expect(context.request).not.toHaveBeenCalled();
		}
		const malformed = createExecuteContext(injuryParameters(), [{ injuries: {} }]);
		await expect(node.execute.call(malformed)).rejects.toThrow(
			/expected 'injuries' to be an array/,
		);
	});
});

describe('Injury UI metadata', () => {
	it('exposes four sports and NFL/MLB-only option conditions', () => {
		const operation = injuryDescription.find((property) => property.name === 'operation');
		const sport = injuryDescription.find((property) => property.name === 'sport');
		const options = injuryDescription.find((property) => property.name === 'injuryOptions');
		const probabilities = options?.options?.find(
			(property) => property.name === 'includeProbabilities',
		);
		const minors = options?.options?.find((property) => property.name === 'includeMinors');
		const week = options?.options?.find((property) => property.name === 'week');
		expect(operation?.options).toMatchObject([{ name: 'Get Many', value: 'getMany' }]);
		expect(sport?.options).toHaveLength(4);
		expect(probabilities?.displayOptions?.show).toEqual({ '/sport': ['nfl'] });
		expect(week?.displayOptions?.show).toEqual({ '/sport': ['nfl'] });
		expect(minors?.displayOptions?.show).toEqual({ '/sport': ['mlb'] });
	});
});
