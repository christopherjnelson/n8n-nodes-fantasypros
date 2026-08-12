import {
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
} from 'n8n-workflow';
import { fanOutWithContext, fantasyProsApiRequest } from '../GenericFunctions';

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
	const limit = returnAll ? 100 : (context.getNodeParameter('limit', itemIndex) as number);
	if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
		throw new NodeOperationError(context.getNode(), 'Limit must be an integer from 1 through 100');
	}
	const query: IDataObject = { limit };
	const options = context.getNodeParameter('newsOptions', itemIndex, {}) as IDataObject;
	if (typeof options.category === 'string' && options.category) query.category = options.category;
	if (Number(options.playerId) > 0) query.fpid = Number(options.playerId);
	if (sport === 'mlb' && Number(options.mlbamId) > 0) query.MLBAMID = Number(options.mlbamId);
	if (typeof options.orderBy === 'string' && options.orderBy) query.order_by = options.orderBy;

	const response = await fantasyProsApiRequest.call(context, 'GET', `/${sport}/news`, query);
	const items = fanOutWithContext(response, 'items', context, 'News Get Many').slice(0, limit);
	return items.map((json) => ({ json, pairedItem: { item: itemIndex } }));
}
