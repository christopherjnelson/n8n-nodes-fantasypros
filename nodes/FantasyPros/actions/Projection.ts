import {
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
} from 'n8n-workflow';
import {
	fanOutWithContext,
	fantasyProsApiRequest,
	parseNumericIds,
	validateDate,
	validateSeason,
	validateWeek,
} from '../GenericFunctions';

function addExpertFilter(
	query: IDataObject,
	options: IDataObject,
	context: IExecuteFunctions,
): void {
	if (typeof options.expertIds === 'string' && options.expertIds) {
		query.filters = parseNumericIds(options.expertIds, ':', context, 'Expert IDs');
	}
}

function validateMlbWeek(value: number, context: IExecuteFunctions): number {
	if (!Number.isInteger(value) || value < 0) {
		throw new NodeOperationError(context.getNode(), 'MLB Week must be a non-negative integer');
	}
	return value;
}

function validateProjectionType(value: string, context: IExecuteFunctions): string {
	if (!['daily', 'preseason', 'ros', 'weekly'].includes(value)) {
		throw new NodeOperationError(context.getNode(), `Unsupported projection type: ${value}`);
	}
	return value;
}

function validateLeagueKey(value: string, context: IExecuteFunctions): string {
	if (
		!/^(mlb|nfl|nba)~[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
	) {
		throw new NodeOperationError(
			context.getNode(),
			'League Key must contain a supported sport, a tilde, and a UUID',
		);
	}
	return value;
}

export async function executeProjection(
	context: IExecuteFunctions,
	itemIndex: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const season = validateSeason(context.getNodeParameter('season', itemIndex) as number, context);
	const query: IDataObject = {};
	let path: string;
	let field: 'players' | 'player';
	let label: string;

	if (operation === 'getNfl') {
		path = `/nfl/${season}/projections`;
		field = 'players';
		label = 'Projection Get NFL';
		query.position = context.getNodeParameter('position', itemIndex) as string;
		const period = context.getNodeParameter('nflProjectionPeriod', itemIndex) as string;
		if (!['preseason', 'ros', 'weekly'].includes(period)) {
			throw new NodeOperationError(
				context.getNode(),
				`Unsupported NFL projection period: ${period}`,
			);
		}
		if (period === 'preseason') query.week = 0;
		if (period === 'weekly') {
			query.week = validateWeek(context.getNodeParameter('nflWeek', itemIndex) as number, context);
		}
		if (period === 'ros') query.ros = true;
		const options = context.getNodeParameter('nflOptions', itemIndex, {}) as IDataObject;
		addExpertFilter(query, options, context);
		if (typeof options.playerIds === 'string' && options.playerIds) {
			query.players = parseNumericIds(options.playerIds, ':', context, 'Player IDs');
		}
		if (Array.isArray(options.positions) && options.positions.length) {
			query.positions = options.positions.join(':');
		}
	} else if (operation === 'getMlb') {
		path = `/mlb/${season}/projections`;
		field = 'player';
		label = 'Projection Get MLB';
		const type = validateProjectionType(
			context.getNodeParameter('mlbProjectionType', itemIndex) as string,
			context,
		);
		query.type = type;
		if (type === 'daily') {
			query.date = validateDate(
				context.getNodeParameter('mlbDate', itemIndex) as string,
				context,
				'Date',
			);
		}
		if (type === 'weekly') {
			query.week = validateMlbWeek(
				context.getNodeParameter('mlbWeek', itemIndex) as number,
				context,
			);
		}
		const position = context.getNodeParameter('mlbPosition', itemIndex) as string;
		if (position) query.position = position;
		const options = context.getNodeParameter('mlbOptions', itemIndex, {}) as IDataObject;
		addExpertFilter(query, options, context);
		if (typeof options.playerIds === 'string' && options.playerIds) {
			query.fpIds = parseNumericIds(options.playerIds, ',', context, 'Player IDs');
		}
		if (
			typeof options.siteEligibility === 'string' ||
			typeof options.siteEligibility === 'number'
		) {
			query.site_eligibility = options.siteEligibility;
		}
		if (typeof options.leagueKey === 'string' && options.leagueKey) {
			query.league_key = validateLeagueKey(options.leagueKey, context);
		}
	} else if (operation === 'getNba') {
		path = `/nba/${season}/projections`;
		field = 'player';
		label = 'Projection Get NBA';
		const type = validateProjectionType(
			context.getNodeParameter('nbaProjectionType', itemIndex) as string,
			context,
		);
		query.type = type;
		if (type === 'daily') {
			query.date = validateDate(
				context.getNodeParameter('nbaDate', itemIndex) as string,
				context,
				'Date',
			);
		}
		const position = context.getNodeParameter('nbaPosition', itemIndex) as string;
		if (position) query.position = position;
		query.stype = context.getNodeParameter('nbaStatisticsType', itemIndex) as string;
		if (context.getNodeParameter('nbaPreciseValues', itemIndex) as boolean) {
			query.stat_values = 'precise';
		}
		const options = context.getNodeParameter('nbaOptions', itemIndex, {}) as IDataObject;
		addExpertFilter(query, options, context);
		if (typeof options.playerIds === 'string' && options.playerIds) {
			query.fpIds = parseNumericIds(options.playerIds, ',', context, 'Player IDs');
		}
		if (typeof options.teamIds === 'string' && options.teamIds) {
			query.team_id = parseNumericIds(options.teamIds, ',', context, 'Team IDs');
		}
	} else {
		throw new NodeOperationError(
			context.getNode(),
			`Unsupported Projection operation: ${operation}`,
		);
	}

	const response = await fantasyProsApiRequest.call(context, 'GET', path, query);
	let entities = fanOutWithContext(response, field, context, label);
	if (!(context.getNodeParameter('returnAll', itemIndex) as boolean)) {
		entities = entities.slice(0, context.getNodeParameter('limit', itemIndex) as number);
	}
	return entities.map((json) => ({ json, pairedItem: { item: itemIndex } }));
}
