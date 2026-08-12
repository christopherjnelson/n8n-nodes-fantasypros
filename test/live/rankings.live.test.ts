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

live('FantasyPros Ranking live smoke tests', () => {
	it('gets individual rankings, consensus rankings, and experts', async () => {
		const rankings = await get(`/nfl/${season}/rankings?week=0`);
		const consensus = await get(
			`/nfl/${season}/consensus-rankings?position=RB&scoring=PPR&experts=show`,
		);
		const experts = await get(`/nfl/${season}/rankings/experts?position=QB&include_overall=true`);

		expect(Array.isArray(rankings.players)).toBe(true);
		expect(Array.isArray(consensus.players)).toBe(true);
		expect(Array.isArray(experts.experts)).toBe(true);
	}, 30_000);
});
