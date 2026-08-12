import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['mlb'], operation: ['getLineups'] };
const currentDate = new Date().toISOString();

export const mlbDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['mlb'] } },
		options: [
			{
				name: 'Get Lineups',
				value: 'getLineups',
				action: 'Get MLB lineups',
				description: 'Get MLB game lineups',
			},
		],
		default: 'getLineups',
	},
	{
		displayName: 'Start Date',
		name: 'startDate',
		type: 'dateTime',
		default: currentDate,
		required: true,
		displayOptions: { show },
		description: 'Date to return lineups for',
	},
	{
		displayName: 'Season Period',
		name: 'period',
		type: 'options',
		options: [
			{ name: 'Postseason', value: 'PST' },
			{ name: 'Preseason', value: 'PRE' },
			{ name: 'Regular Season', value: 'REG' },
		],
		default: 'REG',
		displayOptions: { show },
		description: 'Part of the MLB season to query',
	},
	{
		displayName: 'Projected Lineups',
		name: 'projected',
		type: 'boolean',
		default: false,
		displayOptions: { show },
		description: 'Whether to return projected lineups for the selected date',
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
];
