import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import {
	currentSeason,
	positionOptions,
	rankingTypeOptions,
	scoringOptions,
	siteEligibilityOptions,
	sportOptions,
} from './Common';

const resourceShow = { resource: ['rankings'] };
const rankingsShow = { ...resourceShow, operation: ['getRankings'] };
const consensusShow = { ...resourceShow, operation: ['getConsensusRankings'] };
const expertsShow = { ...resourceShow, operation: ['getExperts'] };

function sportSpecificOptions(
	name: string,
	displayName: string,
	optionsBySport: Record<string, INodePropertyOptions[]>,
	operations: string[],
	required = false,
	allowUnset = false,
): INodeProperties[] {
	return Object.entries(optionsBySport).map(
		// Every generated property has a static default derived from its first option.
		// eslint-disable-next-line n8n-nodes-base/node-param-default-missing
		([sport, options]): INodeProperties => ({
			displayName,
			name,
			type: 'options',
			options: allowUnset ? [{ name: 'Not Set', value: '' }, ...options] : options,
			default: allowUnset ? '' : options[0].value,
			required,
			displayOptions: { show: { resource: ['rankings'], operation: operations, sport: [sport] } },
			description: `${displayName} supported for the selected sport`,
		}),
	);
}

const sharedCollectionControls: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: { show: resourceShow },
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 50,
		displayOptions: { show: { ...resourceShow, returnAll: [false] } },
		description: 'Max number of results to return',
	},
];

export const rankingsDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: resourceShow },
		options: [
			{
				name: 'Get Consensus Rankings',
				value: 'getConsensusRankings',
				action: 'Get consensus rankings',
				description: 'Get expert consensus rankings',
			},
			{
				name: 'Get Experts',
				value: 'getExperts',
				action: 'Get ranking experts',
				description: 'Get experts available for ranking sets',
			},
			{
				name: 'Get Rankings',
				value: 'getRankings',
				action: 'Get player rankings',
				description: 'Get individual expert player rankings',
			},
		],
		default: 'getRankings',
	},
	{
		displayName: 'Sport',
		name: 'sport',
		type: 'options',
		noDataExpression: true,
		options: sportOptions,
		default: 'nfl',
		displayOptions: { show: resourceShow },
		description: 'Sport to query',
	},
	{
		displayName: 'Season',
		name: 'season',
		type: 'number',
		typeOptions: { minValue: 2012, numberStepSize: 1 },
		default: currentSeason,
		displayOptions: { show: resourceShow },
		description: 'Four-digit season year',
	},
	...sportSpecificOptions('position', 'Position', positionOptions, ['getConsensusRankings'], true),
	...sportSpecificOptions('position', 'Position', positionOptions, ['getExperts'], false, true),
	...sportSpecificOptions(
		'rankingType',
		'Ranking Type',
		rankingTypeOptions,
		['getConsensusRankings', 'getExperts'],
		false,
		true,
	),
	...sportSpecificOptions(
		'scoring',
		'Scoring',
		scoringOptions,
		['getConsensusRankings', 'getExperts'],
		false,
		true,
	),
	...sharedCollectionControls,
	{
		displayName: 'Options',
		name: 'rankingsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: rankingsShow },
		options: [
			{
				displayName: 'Expert IDs',
				name: 'expertIds',
				type: 'string',
				default: '',
				placeholder: 'e.g. 345:332:12',
				description:
					'Expert IDs to filter by, serialized with colons as required by the OpenAPI schema',
			},
			{
				displayName: 'Minimal Response',
				name: 'minimal',
				type: 'boolean',
				default: false,
				description: 'Whether to return reduced player detail',
			},
			{
				displayName: 'Player ID',
				name: 'playerId',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 0,
				description: 'FantasyPros player ID to filter on',
			},
			{
				displayName: 'Rank Range',
				name: 'rankRange',
				type: 'boolean',
				default: false,
				description: 'Whether to include minimum and maximum rank',
			},
			{
				displayName: 'Ranking Statistics',
				name: 'rankStats',
				type: 'boolean',
				default: false,
				description: 'Whether to include average and standard deviation',
			},
			{
				displayName: 'Week',
				name: 'week',
				type: 'number',
				typeOptions: { minValue: 0, maxValue: 22, numberStepSize: 1 },
				default: 0,
				description: 'Week to request, where 0 represents preseason',
			},
		],
	},
	{
		displayName: 'Include Drafters Ranking Type',
		name: 'useDraftersType',
		type: 'boolean',
		default: false,
		displayOptions: { show: { ...rankingsShow, sport: ['nfl'] } },
		description: 'Whether to request the NFL Drafters ranking type',
	},
	{
		displayName: 'MLB Site Eligibility',
		name: 'siteEligibility',
		type: 'options',
		options: [{ name: 'Not Set', value: '' }, ...siteEligibilityOptions],
		default: '',
		displayOptions: { show: { ...rankingsShow, sport: ['mlb'] } },
		description: 'Fantasy site position eligibility to apply',
	},
	{
		displayName: 'Options',
		name: 'consensusOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: consensusShow },
		options: [
			{
				displayName: 'Expert Detail Mode',
				name: 'expertDetails',
				type: 'options',
				options: [
					{ name: 'Available', value: 'available' },
					{ name: 'Show', value: 'show' },
				],
				default: 'show',
				description: 'Expert details to include in the response',
			},
			{
				displayName: 'Expert IDs',
				name: 'expertIds',
				type: 'string',
				default: '',
				placeholder: 'e.g. 345:332:12',
				description: 'Expert IDs to filter by, serialized with colons',
			},
			{
				displayName: 'Include IDP',
				name: 'includeIdp',
				type: 'boolean',
				default: false,
				displayOptions: { show: { '/sport': ['nfl'] } },
				description: 'Whether to include individual defensive players for NFL',
			},
			{
				displayName: 'Week',
				name: 'week',
				type: 'number',
				typeOptions: { minValue: 0, maxValue: 22, numberStepSize: 1 },
				default: 0,
				displayOptions: { show: { '/sport': ['nfl'] } },
				description: 'NFL week, where 0 represents preseason',
			},
		],
	},
	{
		displayName: 'Include Overall Ranking Accuracy',
		name: 'includeOverall',
		type: 'boolean',
		default: false,
		displayOptions: { show: expertsShow },
		description: 'Whether to include overall ranking accuracy in the expert response',
	},
];
