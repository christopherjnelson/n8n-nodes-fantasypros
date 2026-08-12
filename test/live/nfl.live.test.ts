import { describe, expect, it } from 'vitest';

const apiKey = import.meta.env.FANTASY_PROS_API_KEY ?? import.meta.env.FANTASYPROS_API_KEY;
const enabled = import.meta.env.FANTASYPROS_LIVE_TESTS === '1' && Boolean(apiKey);
const live = enabled ? describe : describe.skip;

live('FantasyPros NFL Player Points live smoke test', () => {
	it('gets representative quarterback points', async () => {
		const completedSeason = new Date().getUTCFullYear() - 1;
		const response = await fetch(
			`https://api.fantasypros.com/public/v2/json/nfl/${completedSeason}/player-points?start=1&end=18&position=QB&scoring=PPR&min=true`,
			{ headers: { 'x-api-key': apiKey! } },
		);
		expect(response.status).toBe(200);
		const body = (await response.json()) as { players?: unknown[] };
		expect(Array.isArray(body.players)).toBe(true);
		expect(body.players?.length).toBeGreaterThan(0);
	}, 30_000);
});
