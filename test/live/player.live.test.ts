import { describe, expect, it } from 'vitest';

const apiKey = import.meta.env.FANTASY_PROS_API_KEY ?? import.meta.env.FANTASYPROS_API_KEY;
const enabled = import.meta.env.FANTASYPROS_LIVE_TESTS === '1' && Boolean(apiKey);
const live = enabled ? describe : describe.skip;
const baseUrl = 'https://api.fantasypros.com/public/v2/json';

live('FantasyPros Player live smoke tests', () => {
	it('gets current players and compares two discovered IDs', async () => {
		const playersResponse = await fetch(`${baseUrl}/nfl/players?ecr=included&show=pos_rank`, {
			headers: { 'x-api-key': apiKey! },
		});
		expect(playersResponse.status).toBe(200);
		const playersBody = (await playersResponse.json()) as {
			players?: Array<{
				player_id?: number;
				fpid?: number;
				player_position_id?: string;
				position_id?: string;
			}>;
		};
		const players =
			playersBody.players?.map((player) => ({
				id: player.player_id ?? player.fpid,
				position: player.player_position_id ?? player.position_id,
			})) ?? [];
		const grouped = Object.groupBy(
			players.filter((player) => player.id && player.position),
			(player) => player.position!,
		);
		const comparable = Object.values(grouped).find((players) => (players?.length ?? 0) >= 2);
		expect(comparable?.length).toBeGreaterThanOrEqual(2);

		const [first, second] = comparable!;
		const query = new URLSearchParams({
			players: `${first.id}:${second.id}`,
			position: first.position!,
			year: String(new Date().getUTCFullYear()),
			week: '0',
			ranking_type: 'draft',
			details: 'all',
		});
		const compareResponse = await fetch(`${baseUrl}/nfl/compare-players?${query}`, {
			headers: { 'x-api-key': apiKey! },
		});
		expect(compareResponse.status).toBe(200);
		const compareBody = (await compareResponse.json()) as {
			rankings?: object;
			players?: object;
		};
		expect(compareBody.rankings).toBeTypeOf('object');
		expect(Object.keys(compareBody.players ?? {})).toHaveLength(2);
	}, 30_000);
});
