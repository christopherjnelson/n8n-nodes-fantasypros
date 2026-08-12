import {
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
} from 'n8n-workflow';
import {
	fanOutWithContext,
	fantasyProsApiRequest,
	optionalPositiveInteger,
	parseNumericIds,
	validateLimit,
	validateSeason,
	validateWeek,
} from '../GenericFunctions';

export async function executeRankings(
	context: IExecuteFunctions,
	itemIndex: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const sport = context.getNodeParameter('sport', itemIndex) as string;
	const season = validateSeason(context.getNodeParameter('season', itemIndex) as number, context);
	const returnAll = context.getNodeParameter('returnAll', itemIndex) as boolean;
	const limit = returnAll
		? undefined
		: validateLimit(context.getNodeParameter('limit', itemIndex) as number, context);
	const query: IDataObject = {};
	let path: string;
	let field: string;
	let label: string;

	if (operation === 'getRankings') {
		path = `/${sport}/${season}/rankings`;
		field = 'players';
		label = 'Rankings Get Rankings';
		const options = context.getNodeParameter('rankingsOptions', itemIndex, {}) as IDataObject;
		const playerId = optionalPositiveInteger(options.playerId, context, 'Player ID');
		if (playerId !== undefined) query.player = playerId;
		if (typeof options.expertIds === 'string' && options.expertIds) {
			query.filters = parseNumericIds(options.expertIds, ':', context, 'Expert IDs');
		}
		if (options.minimal === true) query.min = 'true';
		if (options.rankRange === true) query.range = 'true';
		if (options.rankStats === true) query.rankstats = 'true';
		if (options.week !== undefined) query.week = validateWeek(Number(options.week), context);
		if (sport === 'nfl' && (context.getNodeParameter('useDraftersType', itemIndex) as boolean)) {
			query.type = 'DRAFTERS';
		}
		if (sport === 'mlb') {
			const eligibility = context.getNodeParameter('siteEligibility', itemIndex) as string | number;
			if (eligibility !== '') query.site_eligibility = eligibility;
		}
	} else if (operation === 'getConsensusRankings') {
		path = `/${sport}/${season}/consensus-rankings`;
		field = 'players';
		label = 'Rankings Get Consensus Rankings';
		query.position = context.getNodeParameter('position', itemIndex) as string;
		const rankingType = context.getNodeParameter('rankingType', itemIndex) as string;
		if (rankingType) query.type = rankingType;
		if (sport === 'nfl' || sport === 'nba') {
			const scoring = context.getNodeParameter('scoring', itemIndex) as string;
			if (scoring) query.scoring = scoring;
		}
		const options = context.getNodeParameter('consensusOptions', itemIndex, {}) as IDataObject;
		if (typeof options.expertIds === 'string' && options.expertIds) {
			query.filters = parseNumericIds(options.expertIds, ':', context, 'Expert IDs');
		}
		if (typeof options.expertDetails === 'string' && options.expertDetails)
			query.experts = options.expertDetails;
		if (sport === 'nfl') {
			if (options.includeIdp === true) query.include_idp = 'true';
			if (options.week !== undefined) query.week = validateWeek(Number(options.week), context);
		}
	} else if (operation === 'getExperts') {
		path = `/${sport}/${season}/rankings/experts`;
		field = 'experts';
		label = 'Rankings Get Experts';
		const position = context.getNodeParameter('position', itemIndex) as string;
		const rankingType = context.getNodeParameter('rankingType', itemIndex) as string;
		if (position) query.position = position;
		if (rankingType) query.type = rankingType;
		if (sport === 'nfl' || sport === 'nba') {
			const scoring = context.getNodeParameter('scoring', itemIndex) as string;
			if (scoring) query.scoring = scoring;
		}
		if (context.getNodeParameter('includeOverall', itemIndex) as boolean)
			query.include_overall = 'true';
	} else {
		throw new NodeOperationError(context.getNode(), `Unsupported Ranking operation: ${operation}`);
	}

	const response = await fantasyProsApiRequest.call(context, 'GET', path, query);
	let entities = fanOutWithContext(response, field, context, label);
	if (limit !== undefined) entities = entities.slice(0, limit);
	return entities.map((json) => ({ json, pairedItem: { item: itemIndex } }));
}
