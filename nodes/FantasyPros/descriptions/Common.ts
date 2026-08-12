import type { INodePropertyOptions } from 'n8n-workflow';

export const sportOptions: INodePropertyOptions[] = [
	{ name: 'MLB', value: 'mlb' },
	{ name: 'NBA', value: 'nba' },
	{ name: 'NFL', value: 'nfl' },
	{ name: 'NHL', value: 'nhl' },
];

export const positionOptions: Record<string, INodePropertyOptions[]> = {
	nfl: ['ALL', 'FLX', 'OP', 'QB', 'RB', 'WR', 'TE', 'K', 'DST', 'IDP', 'DL', 'LB', 'DB'].map(
		(value) => ({ name: value, value }),
	),
	mlb: ['ALL', 'H', 'P', '1B', '2B', '3B', 'SS', 'C', 'OF', 'SP', 'RP', 'DH'].map((value) => ({
		name: value,
		value,
	})),
	nba: ['ALL', 'PG', 'SG', 'SF', 'PF', 'G', 'F', 'C', 'SGF', 'PFC'].map((value) => ({
		name: value,
		value,
	})),
	nhl: ['ALL', 'C', 'LW', 'RW', 'D', 'G'].map((value) => ({ name: value, value })),
};

export const currentSeason = new Date().getUTCFullYear();
