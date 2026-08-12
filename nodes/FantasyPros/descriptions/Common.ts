import type { INodePropertyOptions } from 'n8n-workflow';

export const sportOptions: INodePropertyOptions[] = [
	{ name: 'MLB', value: 'mlb' },
	{ name: 'NBA', value: 'nba' },
	{ name: 'NFL', value: 'nfl' },
	{ name: 'NHL', value: 'nhl' },
];

export const positionOptions: Record<string, INodePropertyOptions[]> = {
	nfl: [
		'ALL',
		'FLX',
		'OP',
		'QB',
		'RB',
		'WR',
		'TE',
		'K',
		'DST',
		'IDP',
		'DL',
		'LB',
		'DB',
		'TK',
		'TQB',
		'TRB',
		'TWR',
		'TTE',
		'TOL',
		'HC',
		'P',
		'RK',
		'OT',
		'OG',
		'IOL',
		'C',
		'IDL',
		'DE',
		'DT',
		'CB',
		'S',
	].map((value) => ({ name: value, value })),
	mlb: ['ALL', 'H', 'P', '1B', '2B', '3B', 'SS', 'C', 'OF', 'SP', 'RP', 'DH', 'LF', 'CF', 'RF'].map(
		(value) => ({ name: value, value }),
	),
	nba: ['ALL', 'PG', 'SG', 'SF', 'PF', 'G', 'F', 'C', 'SGF', 'PFC'].map((value) => ({
		name: value,
		value,
	})),
	nhl: ['ALL', 'C', 'LW', 'RW', 'D', 'G'].map((value) => ({ name: value, value })),
};

export const currentSeason = new Date().getUTCFullYear();

export const rankingTypeOptions: Record<string, INodePropertyOptions[]> = {
	nfl: [
		'WW',
		'WAIVER',
		'ROS',
		'DRAFT',
		'PRESEASON',
		'SLEEPERS',
		'ADP',
		'BEST',
		'PROSPECT',
		'PRO',
		'DEVY',
		'ROOKIES',
		'DYNADP',
		'RKADP',
		'BESTADP',
		'DYNASTY',
		'PRE',
		'DRAFTERS',
		'MOCK',
	].map((value) => ({ name: value, value })),
	mlb: ['DRAFT', 'PRESEASON', 'ROS', 'DK', 'DYN', 'STK', 'PRO', 'PROSPECT', 'ADP', 'WEEKLY'].map(
		(value) => ({ name: value, value }),
	),
	nba: ['ROS', 'DK', 'ADP', 'DRAFT', 'DYNASTY'].map((value) => ({ name: value, value })),
	nhl: ['DRAFT', 'ROS', 'ADP'].map((value) => ({ name: value, value })),
};

export const scoringOptions: Record<string, INodePropertyOptions[]> = {
	nfl: [
		{ name: 'Half PPR', value: 'HALF' },
		{ name: 'PPR', value: 'PPR' },
		{ name: 'Standard', value: 'STD' },
	],
	nba: [
		{ name: 'Points', value: 'PTS' },
		{ name: 'Rotisserie', value: 'ROTO' },
	],
};

export const siteEligibilityOptions: INodePropertyOptions[] = [
	{ name: 'CBS', value: 'C' },
	{ name: 'CBS Sports', value: 'CBSSP' },
	{ name: 'ESPN', value: 'E' },
	{ name: 'Fantrax', value: 'FANSP' },
	{ name: 'Yahoo', value: 'Y' },
	{ name: 'All Options', value: 'AO' },
	{ name: 'Site 1', value: 1 },
	{ name: 'Site 2', value: 2 },
	{ name: 'Site 3', value: 3 },
	{ name: 'Site 103', value: 103 },
	{ name: 'Site 122', value: 122 },
];
