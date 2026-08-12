import {
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import {
	fantasyProsApiRequest,
	optionalPositiveInteger,
	parseNumericIds,
	requireArrayField,
	requireRecord,
	validateDate,
	validateLimit,
	validateSeason,
	validateWeek,
} from './GenericFunctions';
import {
	injuryDescription,
	mlbDescription,
	newsDescription,
	nflDescription,
	playerDescription,
	projectionDescription,
	rankingsDescription,
} from './descriptions';
import { executeRankings } from './actions/Rankings';
import { executeProjection } from './actions/Projection';
import { executeNews } from './actions/News';
import { executeInjury } from './actions/Injury';
import { executeNfl } from './actions/Nfl';
import { executeMlb } from './actions/Mlb';

export class FantasyPros implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FantasyPros',
		name: 'fantasyPros',
		icon: { light: 'file:fantasyPros.svg', dark: 'file:fantasyPros.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Use the official FantasyPros Public API v2',
		defaults: { name: 'FantasyPros' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'fantasyProsApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Injury', value: 'injury' },
					{ name: 'MLB', value: 'mlb' },
					{ name: 'News', value: 'news' },
					{ name: 'NFL', value: 'nfl' },
					{ name: 'Player', value: 'player' },
					{ name: 'Projection', value: 'projection' },
					{ name: 'Ranking', value: 'rankings' },
				],
				default: 'player',
			},
			...playerDescription,
			...injuryDescription,
			...mlbDescription,
			...newsDescription,
			...nflDescription,
			...projectionDescription,
			...rankingsDescription,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const output: INodeExecutionData[] = [];
		const inputItems = this.getInputData();

		for (let itemIndex = 0; itemIndex < inputItems.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as string;
				const operation = this.getNodeParameter('operation', itemIndex) as string;
				if (resource === 'mlb') {
					output.push(...(await executeMlb(this, itemIndex, operation)));
					continue;
				}
				if (resource === 'injury') {
					output.push(...(await executeInjury(this, itemIndex, operation)));
					continue;
				}
				if (resource === 'news') {
					output.push(...(await executeNews(this, itemIndex, operation)));
					continue;
				}
				if (resource === 'nfl') {
					output.push(...(await executeNfl(this, itemIndex, operation)));
					continue;
				}
				if (resource === 'projection') {
					output.push(...(await executeProjection(this, itemIndex, operation)));
					continue;
				}
				if (resource === 'rankings') {
					output.push(...(await executeRankings(this, itemIndex, operation)));
					continue;
				}
				if (resource !== 'player') {
					throw new NodeOperationError(this.getNode(), `Unsupported resource: ${resource}`);
				}

				if (operation === 'getMany') {
					const sport = this.getNodeParameter('sport', itemIndex) as string;
					const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
					const limit = returnAll
						? undefined
						: validateLimit(this.getNodeParameter('limit', itemIndex) as number, this);
					const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;
					const query: IDataObject = {};
					const playerId = optionalPositiveInteger(options.playerId, this, 'Player ID');
					if (playerId !== undefined) query.player = playerId;
					if (typeof options.updatedSince === 'string' && options.updatedSince) {
						query.update = validateDate(options.updatedSince.slice(0, 10), this, 'Updated Since');
					}
					if (typeof options.ecr === 'string' && options.ecr) query.ecr = options.ecr;
					if (Array.isArray(options.externalIds) && options.externalIds.length) {
						query.external_ids = options.externalIds.join(':');
					}
					if (options.showPositionalRank === true) query.show = 'pos_rank';

					const response = await fantasyProsApiRequest.call(
						this,
						'GET',
						`/${sport}/players`,
						query,
					);
					let players = requireArrayField(response, 'players', this, 'Player Get Many');
					if (limit !== undefined) players = players.slice(0, limit);
					output.push(...players.map((json) => ({ json, pairedItem: { item: itemIndex } })));
					continue;
				}

				if (operation === 'compare') {
					const sport = this.getNodeParameter('sport', itemIndex) as string;
					const players = parseNumericIds(
						this.getNodeParameter('playerIds', itemIndex) as string,
						':',
						this,
						'Player IDs',
						{ min: 2, max: 4 },
					);
					const season = validateSeason(this.getNodeParameter('season', itemIndex) as number, this);
					const query: IDataObject = {
						players,
						position: this.getNodeParameter('position', itemIndex) as string,
						year: season,
					};
					if (sport === 'nfl')
						query.week = validateWeek(this.getNodeParameter('week', itemIndex) as number, this);
					const options = this.getNodeParameter('compareOptions', itemIndex, {}) as IDataObject;
					if (typeof options.expertIds === 'string' && options.expertIds) {
						query.experts = parseNumericIds(options.expertIds, ':', this, 'Expert IDs');
					}
					if (typeof options.rankingType === 'string' && options.rankingType)
						query.ranking_type = options.rankingType;
					if (typeof options.details === 'string' && options.details)
						query.details = options.details;

					const response = await fantasyProsApiRequest.call(
						this,
						'GET',
						`/${sport}/compare-players`,
						query,
					);
					output.push({
						json: requireRecord(response, this, 'Player Compare'),
						pairedItem: { item: itemIndex },
					});
					continue;
				}

				throw new NodeOperationError(this.getNode(), `Unsupported Player operation: ${operation}`);
			} catch (error) {
				if (!this.continueOnFail()) {
					throw new NodeOperationError(
						this.getNode(),
						error instanceof Error ? error : new Error(String(error)),
					);
				}
				output.push({
					json: { error: error instanceof Error ? error.message : String(error) },
					pairedItem: { item: itemIndex },
				});
			}
		}

		return [output];
	}
}
