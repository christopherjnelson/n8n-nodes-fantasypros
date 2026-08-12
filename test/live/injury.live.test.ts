import { describe, expect, it } from 'vitest';

const apiKey = import.meta.env.FANTASY_PROS_API_KEY ?? import.meta.env.FANTASYPROS_API_KEY;
const enabled = import.meta.env.FANTASYPROS_LIVE_TESTS === '1' && Boolean(apiKey);
const live = enabled ? describe : describe.skip;

live('FantasyPros Injury live smoke test', () => {
	it('gets representative NFL injuries', async () => {
		const year = new Date().getUTCFullYear();
		const response = await fetch(
			`https://api.fantasypros.com/public/v2/json/nfl/injuries?year=${year}&include_probabilities=true`,
			{ headers: { 'x-api-key': apiKey! } },
		);
		expect(response.status).toBe(200);
		const body = (await response.json()) as { injuries?: unknown[] };
		expect(Array.isArray(body.injuries)).toBe(true);
	}, 30_000);
});
