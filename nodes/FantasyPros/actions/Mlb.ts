import {
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
} from 'n8n-workflow';
import {
	fanOutWithContext,
	fantasyProsApiRequest,
	isRecord,
	validateDate,
} from '../GenericFunctions';

const lineupPeriods = new Set(['PRE', 'REG', 'PST']);

export async function executeMlb(
	context: IExecuteFunctions,
	itemIndex: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	if (operation !== 'getLineups') {
		throw new NodeOperationError(context.getNode(), `Unsupported MLB operation: ${operation}`);
	}
	const startDate = context.getNodeParameter('startDate', itemIndex);
	if (typeof startDate !== 'string') {
		throw new NodeOperationError(context.getNode(), 'Start Date must be a date or ISO date-time');
	}
	if (startDate.length > 10 && (startDate[10] !== 'T' || Number.isNaN(Date.parse(startDate)))) {
		throw new NodeOperationError(
			context.getNode(),
			'Start Date must be a valid date or ISO date-time',
		);
	}
	const start = validateDate(startDate.slice(0, 10), context, 'Start Date');
	const period = context.getNodeParameter('period', itemIndex) as string;
	if (!lineupPeriods.has(period)) {
		throw new NodeOperationError(
			context.getNode(),
			'Period must be Preseason, Regular Season, or Postseason',
		);
	}
	const query: IDataObject = { start, period };
	if (context.getNodeParameter('projected', itemIndex) as boolean) query.projected = 'true';

	const returnAll = context.getNodeParameter('returnAll', itemIndex) as boolean;
	const limit = returnAll ? undefined : (context.getNodeParameter('limit', itemIndex) as number);
	if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
		throw new NodeOperationError(context.getNode(), 'Limit must be a positive integer');
	}

	const response = await fantasyProsApiRequest.call(context, 'GET', '/mlb/lineups', query);
	const games = fanOutWithContext(response, 'games', context, 'MLB Get Lineups');
	for (const game of games) {
		if (
			typeof game.game_id !== 'string' ||
			!isRecord(game.teams) ||
			!isRecord(game.hitters) ||
			!isRecord(game.pitchers)
		) {
			throw new NodeOperationError(
				context.getNode(),
				"Unexpected FantasyPros response for MLB Get Lineups: each game must include 'game_id', 'teams', 'hitters', and 'pitchers'",
			);
		}
	}
	const selected = limit === undefined ? games : games.slice(0, limit);
	return selected.map((json) => ({ json, pairedItem: { item: itemIndex } }));
}
