import type { IDataObject, IExecuteFunctions, IHttpRequestMethods } from 'n8n-workflow';

export const FANTASYPROS_API_BASE_URL = 'https://api.fantasypros.com/public/v2/json';

export async function fantasyProsApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	path: string,
	query: IDataObject = {},
): Promise<unknown> {
	return await this.helpers.httpRequestWithAuthentication.call(this, 'fantasyProsApi', {
		method,
		url: `${FANTASYPROS_API_BASE_URL}${path}`,
		qs: query,
		json: true,
	});
}
