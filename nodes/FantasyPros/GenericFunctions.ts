import {
	NodeApiError,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestMethods,
	type JsonObject,
} from 'n8n-workflow';

export const FANTASYPROS_API_BASE_URL = 'https://api.fantasypros.com/public/v2/json';

export async function fantasyProsApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	path: string,
	query: IDataObject = {},
): Promise<unknown> {
	try {
		return await this.helpers.httpRequestWithAuthentication.call(this, 'fantasyProsApi', {
			method,
			url: `${FANTASYPROS_API_BASE_URL}${path}`,
			qs: query,
			json: true,
		});
	} catch (error) {
		throw createFantasyProsApiError.call(this, error);
	}
}

export function createFantasyProsApiError(this: IExecuteFunctions, error: unknown): NodeApiError {
	const details = isRecord(error) ? error : {};
	const response = isRecord(details.response) ? details.response : {};
	const status = Number(details.statusCode ?? details.httpCode ?? response.status ?? 0);
	const responseBody = isRecord(response.body) ? response.body : {};
	const apiMessage = firstString(
		responseBody.message,
		responseBody.error,
		details.message,
		'FantasyPros API request failed',
	);
	const retryAfter = firstString(
		isRecord(response.headers) ? response.headers['retry-after'] : undefined,
		isRecord(details.headers) ? details.headers['retry-after'] : undefined,
	);

	const messages: Record<number, string> = {
		400: `FantasyPros rejected the request: ${apiMessage}`,
		401: 'FantasyPros rejected the API key. Check the FantasyPros API credential.',
		403: `FantasyPros denied this request. Check the API plan and endpoint entitlement: ${apiMessage}`,
		404: `FantasyPros could not find the requested resource: ${apiMessage}`,
		429: `FantasyPros rate limit exceeded${retryAfter ? `. Retry after ${retryAfter} seconds` : ''}.`,
	};
	const message =
		messages[status] ??
		(status >= 500
			? `FantasyPros is temporarily unavailable (${status}): ${apiMessage}`
			: apiMessage);

	return new NodeApiError(this.getNode(), details as JsonObject, { message });
}

export function requireRecord(
	value: unknown,
	context: IExecuteFunctions,
	label: string,
): IDataObject {
	if (!isRecord(value)) {
		throw new NodeOperationError(
			context.getNode(),
			`Unexpected FantasyPros response for ${label}: expected an object`,
		);
	}
	return value;
}

export function requireArrayField(
	value: unknown,
	field: string,
	context: IExecuteFunctions,
	label: string,
): IDataObject[] {
	const record = requireRecord(value, context, label);
	const collection = record[field];
	if (collection === null && Number(record.count) === 0) return [];
	if (!Array.isArray(collection) || !collection.every(isRecord)) {
		throw new NodeOperationError(
			context.getNode(),
			`Unexpected FantasyPros response for ${label}: expected '${field}' to be an array`,
		);
	}
	return collection as IDataObject[];
}

export function fanOutWithContext(
	value: unknown,
	field: string,
	context: IExecuteFunctions,
	label: string,
): IDataObject[] {
	const record = requireRecord(value, context, label);
	const collection = requireArrayField(record, field, context, label);
	const responseContext = Object.fromEntries(
		Object.entries(record).filter(([key]) => key !== field),
	);
	return collection.map((entity) => ({ ...entity, _fantasyPros: responseContext }));
}

export function parseNumericIds(
	value: string,
	delimiter: ':' | ',',
	context: IExecuteFunctions,
	label: string,
	constraints: { min?: number; max?: number } = {},
): string {
	const ids = value
		.split(/[,:\s]+/)
		.map((id) => id.trim())
		.filter(Boolean);
	if (!ids.length || ids.some((id) => !/^\d+$/.test(id))) {
		throw new NodeOperationError(context.getNode(), `${label} must contain only numeric IDs`);
	}
	if (constraints.min !== undefined && ids.length < constraints.min) {
		throw new NodeOperationError(
			context.getNode(),
			`${label} must contain at least ${constraints.min} IDs`,
		);
	}
	if (constraints.max !== undefined && ids.length > constraints.max) {
		throw new NodeOperationError(
			context.getNode(),
			`${label} must contain no more than ${constraints.max} IDs`,
		);
	}
	return ids.join(delimiter);
}

export function validateDate(value: string, context: IExecuteFunctions, label: string): string {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		throw new NodeOperationError(context.getNode(), `${label} must use YYYY-MM-DD format`);
	}
	const date = new Date(`${value}T00:00:00Z`);
	if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
		throw new NodeOperationError(context.getNode(), `${label} must be a valid calendar date`);
	}
	return value;
}

export function validateSeason(value: number, context: IExecuteFunctions): number {
	if (!Number.isInteger(value) || value < 2012 || value > 9999) {
		throw new NodeOperationError(
			context.getNode(),
			'Season must be a four-digit year from 2012 onward',
		);
	}
	return value;
}

export function validateWeek(value: number, context: IExecuteFunctions): number {
	if (!Number.isInteger(value) || value < 0 || value > 22) {
		throw new NodeOperationError(context.getNode(), 'Week must be an integer from 0 through 22');
	}
	return value;
}

export function validateLimit(value: number, context: IExecuteFunctions, maximum?: number): number {
	if (!Number.isInteger(value) || value < 1 || (maximum !== undefined && value > maximum)) {
		const range =
			maximum === undefined ? 'a positive integer' : `an integer from 1 through ${maximum}`;
		throw new NodeOperationError(context.getNode(), `Limit must be ${range}`);
	}
	return value;
}

export function optionalPositiveInteger(
	value: unknown,
	context: IExecuteFunctions,
	label: string,
): number | undefined {
	if (value === undefined || value === '' || value === 0 || value === '0') return undefined;
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 1) {
		throw new NodeOperationError(context.getNode(), `${label} must be a positive integer`);
	}
	return parsed;
}

export function isRecord(value: unknown): value is IDataObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function firstString(...values: unknown[]): string {
	for (const value of values) {
		if (typeof value === 'string' && value.trim()) return value.trim();
	}
	return '';
}
