import { describe, expect, it } from 'vitest';

const apiKey = import.meta.env.FANTASY_PROS_API_KEY ?? import.meta.env.FANTASYPROS_API_KEY;
const enabled = import.meta.env.FANTASYPROS_LIVE_TESTS === '1' && Boolean(apiKey);
const live = enabled ? describe : describe.skip;
const baseUrl = 'https://api.fantasypros.com/public/v2/json';
const season = new Date().getUTCFullYear();

async function get(path: string): Promise<Record<string, unknown>> {
	const response = await fetch(`${baseUrl}${path}`, { headers: { 'x-api-key': apiKey! } });
	expect(response.status).toBe(200);
	return (await response.json()) as Record<string, unknown>;
}

live('FantasyPros Projection live smoke tests', () => {
	it('gets representative NFL, MLB, and NBA projections', async () => {
		const nfl = await get(`/nfl/${season}/projections?position=RB&week=0`);
		const mlb = await get(`/mlb/${season}/projections?type=ros&position=OF`);
		const nba = await get(`/nba/${season - 1}/projections?type=preseason&position=PG`);

		expect(Array.isArray(nfl.players)).toBe(true);
		expect((nfl.players as unknown[]).length).toBeGreaterThan(0);
		expect(Array.isArray(mlb.player)).toBe(true);
		expect((mlb.player as unknown[]).length).toBeGreaterThan(0);
		expect(Array.isArray(nba.player)).toBe(true);
		expect((nba.player as unknown[]).length).toBeGreaterThan(0);
	}, 30_000);
});
