import {
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
} from 'n8n-workflow';
import { fanOutWithContext, fantasyProsApiRequest, validateSeason } from '../GenericFunctions';

function validatePlayerPointsWeek(
	value: number,
	context: IExecuteFunctions,
	label: string,
): number {
	if (!Number.isInteger(value) || value < 1 || value > 22) {
		throw new NodeOperationError(
			context.getNode(),
			`${label} must be an integer from 1 through 22`,
		);
	}
	return value;
}

export async function executeNfl(
	context: IExecuteFunctions,
	itemIndex: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	if (operation !== 'getPlayerPoints') {
		throw new NodeOperationError(context.getNode(), `Unsupported NFL operation: ${operation}`);
	}
	const season = validateSeason(Number(context.getNodeParameter('season', itemIndex)), context);
	const start = validatePlayerPointsWeek(
		Number(context.getNodeParameter('startWeek', itemIndex)),
		context,
		'Start Week',
	);
	const end = validatePlayerPointsWeek(
		Number(context.getNodeParameter('endWeek', itemIndex)),
		context,
		'End Week',
	);
	if (end < start) {
		throw new NodeOperationError(context.getNode(), 'End Week must not be earlier than Start Week');
	}
	const query: IDataObject = {
		start,
		end,
		position: context.getNodeParameter('position', itemIndex) as string,
		scoring: context.getNodeParameter('scoring', itemIndex) as string,
	};
	if (context.getNodeParameter('minimalResponse', itemIndex) as boolean) query.min = 'true';

	const returnAll = context.getNodeParameter('returnAll', itemIndex) as boolean;
	const limit = returnAll ? undefined : (context.getNodeParameter('limit', itemIndex) as number);
	if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
		throw new NodeOperationError(context.getNode(), 'Limit must be a positive integer');
	}

	const response = await fantasyProsApiRequest.call(
		context,
		'GET',
		`/nfl/${season}/player-points`,
		query,
	);
	const players = fanOutWithContext(response, 'players', context, 'NFL Get Player Points');
	const selected = limit === undefined ? players : players.slice(0, limit);
	return selected.map((json) => ({ json, pairedItem: { item: itemIndex } }));
}
