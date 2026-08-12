import { describe, expect, it } from 'vitest';

const apiKey = import.meta.env.FANTASY_PROS_API_KEY ?? import.meta.env.FANTASYPROS_API_KEY;
const enabled = import.meta.env.FANTASYPROS_LIVE_TESTS === '1' && Boolean(apiKey);
const live = enabled ? describe : describe.skip;

live('FantasyPros MLB Lineups live smoke test', () => {
	it('gets the current projected regular-season slate', async () => {
		const date = new Date().toISOString().slice(0, 10);
		const response = await fetch(
			`https://api.fantasypros.com/public/v2/json/mlb/lineups?start=${date}&period=REG&projected=true`,
			{ headers: { 'x-api-key': apiKey! } },
		);
		expect(response.status).toBe(200);
		const body = (await response.json()) as { games?: Array<Record<string, unknown>> };
		expect(Array.isArray(body.games)).toBe(true);
		expect(body.games?.length).toBeGreaterThan(0);
		expect(body.games?.every((game) => typeof game.game_id === 'string')).toBe(true);
		expect(body.games?.every((game) => typeof game.teams === 'object')).toBe(true);
		expect(body.games?.every((game) => typeof game.hitters === 'object')).toBe(true);
		expect(body.games?.every((game) => typeof game.pitchers === 'object')).toBe(true);
	}, 30_000);
});
