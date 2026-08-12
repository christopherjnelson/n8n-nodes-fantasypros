import type { INodeProperties } from 'n8n-workflow';
import { sportOptions } from './Common';

const show = { resource: ['news'], operation: ['getMany'] };

export const newsDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['news'] } },
		options: [
			{
				name: 'Get Many',
				value: 'getMany',
				action: 'Get many news items',
				description: 'Get many player news items',
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
		typeOptions: { minValue: 1, maxValue: 100 },
		default: 50,
		displayOptions: { show: { ...show, returnAll: [false] } },
		description: 'Max number of results to return',
	},
	{
		displayName: 'Options',
		name: 'newsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Category',
				name: 'category',
				type: 'options',
				options: [
					{ name: 'Breaking', value: 'breaking' },
					{ name: 'Injury', value: 'injury' },
					{ name: 'Recap', value: 'recap' },
					{ name: 'Rumor', value: 'rumor' },
					{ name: 'Transaction', value: 'transaction' },
				],
				default: 'breaking',
				description: 'News category to filter by',
			},
			{
				displayName: 'FantasyPros Player ID',
				name: 'playerId',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 0,
				description: 'FantasyPros player ID to filter by',
			},
			{
				displayName: 'MLBAM Player ID',
				name: 'mlbamId',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 0,
				displayOptions: { show: { '/sport': ['mlb'] } },
				description: 'MLB Advanced Media player ID; used only for MLB',
			},
			{
				displayName: 'Order By',
				name: 'orderBy',
				type: 'options',
				options: [
					{ name: 'Created', value: 'created' },
					{ name: 'Updated', value: 'updated' },
				],
				default: 'created',
				description: 'Timestamp used to order news items',
			},
		],
	},
];
