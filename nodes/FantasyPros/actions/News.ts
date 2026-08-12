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
	validateLimit,
} from '../GenericFunctions';

export async function executeNews(
	context: IExecuteFunctions,
	itemIndex: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	if (operation !== 'getMany') {
		throw new NodeOperationError(context.getNode(), `Unsupported News operation: ${operation}`);
	}
	const sport = context.getNodeParameter('sport', itemIndex) as string;
	const returnAll = context.getNodeParameter('returnAll', itemIndex) as boolean;
	const limit = returnAll
		? 100
		: validateLimit(context.getNodeParameter('limit', itemIndex) as number, context, 100);
	const query: IDataObject = { limit };
	const options = context.getNodeParameter('newsOptions', itemIndex, {}) as IDataObject;
	if (typeof options.category === 'string' && options.category) query.category = options.category;
	const playerId = optionalPositiveInteger(options.playerId, context, 'FantasyPros Player ID');
	if (playerId !== undefined) query.fpid = playerId;
	if (sport === 'mlb') {
		const mlbamId = optionalPositiveInteger(options.mlbamId, context, 'MLBAM Player ID');
		if (mlbamId !== undefined) query.MLBAMID = mlbamId;
	}
	if (typeof options.orderBy === 'string' && options.orderBy) query.order_by = options.orderBy;

	const response = await fantasyProsApiRequest.call(context, 'GET', `/${sport}/news`, query);
	const items = fanOutWithContext(response, 'items', context, 'News Get Many').slice(0, limit);
	return items.map((json) => ({ json, pairedItem: { item: itemIndex } }));
}
