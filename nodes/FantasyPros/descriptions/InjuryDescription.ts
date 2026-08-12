import type { INodeProperties } from 'n8n-workflow';
import { currentSeason, sportOptions } from './Common';

const show = { resource: ['injury'], operation: ['getMany'] };

export const injuryDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['injury'] } },
		options: [
			{
				name: 'Get Many',
				value: 'getMany',
				action: 'Get many injuries',
				description: 'Get many player injuries',
			},
		],
		default: 'getMany',
	},
	{
		displayName: 'Sport',
		name: 'sport',
		type: 'options',
		noDataExpression: true,
		options: sportOptions,
		default: 'nfl',
		displayOptions: { show },
		description: 'Sport to query',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: { show },
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 50,
		displayOptions: { show: { ...show, returnAll: [false] } },
		description: 'Max number of results to return',
	},
	{
		displayName: 'Options',
		name: 'injuryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Include Minor League Players',
				name: 'includeMinors',
				type: 'boolean',
				default: false,
				displayOptions: { show: { '/sport': ['mlb'] } },
				description: 'Whether to include MLB minor-league players with injury statuses',
			},
			{
				displayName: 'Include Probabilities',
				name: 'includeProbabilities',
				type: 'boolean',
				default: false,
				displayOptions: { show: { '/sport': ['nfl'] } },
				description:
					'Whether to include NFL players on the practice report who may not have an injury status',
			},
			{
				displayName: 'Player IDs',
				name: 'playerIds',
				type: 'string',
				default: '',
				placeholder: '7354:6880',
				description: 'FantasyPros player IDs, separated by colons',
			},
			{
				displayName: 'Team IDs',
				name: 'teamIds',
				type: 'string',
				default: '',
				placeholder: 'SF:MIN',
				description: 'Team IDs, separated by colons',
			},
			{
				displayName: 'Week',
				name: 'week',
				type: 'number',
				typeOptions: { minValue: 0, maxValue: 22 },
				default: 0,
				displayOptions: { show: { '/sport': ['nfl'] } },
				description: 'NFL week, where 0 represents the preseason',
			},
			{
				displayName: 'Year',
				name: 'year',
				type: 'number',
				typeOptions: { minValue: 2012, maxValue: 9999 },
				default: currentSeason,
				description: 'Season year to request',
			},
		],
	},
];
