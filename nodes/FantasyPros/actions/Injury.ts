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
	validateSeason,
	validateWeek,
} from '../GenericFunctions';

function parseTeamIds(value: string, context: IExecuteFunctions): string {
	const ids = value
		.split(/[:,\s]+/)
		.map((id) => id.trim())
		.filter(Boolean);
	if (!ids.length || ids.some((id) => !/^\w+$/.test(id))) {
		throw new NodeOperationError(
			context.getNode(),
			'Team IDs must contain only letters, numbers, and underscores',
		);
	}
	return ids.join(':');
}

export async function executeInjury(
	context: IExecuteFunctions,
	itemIndex: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	if (operation !== 'getMany') {
		throw new NodeOperationError(context.getNode(), `Unsupported Injury operation: ${operation}`);
	}
	const sport = context.getNodeParameter('sport', itemIndex) as string;
	const returnAll = context.getNodeParameter('returnAll', itemIndex) as boolean;
	const limit = returnAll ? undefined : (context.getNodeParameter('limit', itemIndex) as number);
	if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
		throw new NodeOperationError(context.getNode(), 'Limit must be a positive integer');
	}

	const query: IDataObject = {};
	const options = context.getNodeParameter('injuryOptions', itemIndex, {}) as IDataObject;
	if (options.year !== undefined && options.year !== '') {
		query.year = validateSeason(Number(options.year), context);
	}
	if (sport === 'nfl' && options.week !== undefined) {
		query.week = validateWeek(Number(options.week), context);
	}
	if (sport === 'nfl' && options.includeProbabilities === true) {
		query.include_probabilities = 'true';
	}
	if (sport === 'mlb' && options.includeMinors === true) query.include_minors = 'true';
	if (typeof options.teamIds === 'string' && options.teamIds.trim()) {
		query.team_id = parseTeamIds(options.teamIds, context);
	}
	if (typeof options.playerIds === 'string' && options.playerIds.trim()) {
		query.player_ids = parseNumericIds(options.playerIds, ':', context, 'Player IDs');
	}

	const response = await fantasyProsApiRequest.call(context, 'GET', `/${sport}/injuries`, query);
	const injuries = fanOutWithContext(response, 'injuries', context, 'Injury Get Many');
	const selected = limit === undefined ? injuries : injuries.slice(0, limit);
	return selected.map((json) => ({ json, pairedItem: { item: itemIndex } }));
}
