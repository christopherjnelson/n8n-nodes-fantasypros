import { describe, expect, it } from 'vitest';

const apiKey = import.meta.env.FANTASY_PROS_API_KEY ?? import.meta.env.FANTASYPROS_API_KEY;
const enabled = import.meta.env.FANTASYPROS_LIVE_TESTS === '1' && Boolean(apiKey);
const live = enabled ? describe : describe.skip;

live('FantasyPros News live smoke test', () => {
	it('gets representative player news', async () => {
		const response = await fetch(
			'https://api.fantasypros.com/public/v2/json/nfl/news?limit=10&order_by=updated',
			{ headers: { 'x-api-key': apiKey! } },
		);
		expect(response.status).toBe(200);
		const body = (await response.json()) as { items?: unknown[] };
		expect(Array.isArray(body.items)).toBe(true);
		expect(body.items?.length).toBeGreaterThan(0);
	}, 30_000);
});
