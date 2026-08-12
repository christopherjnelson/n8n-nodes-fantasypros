import type { IAuthenticateGeneric, ICredentialType, INodeProperties } from 'n8n-workflow';

export class FantasyProsApi implements ICredentialType {
	name = 'fantasyProsApi';
	displayName = 'FantasyPros API';
	icon = 'file:../nodes/FantasyPros/fantasyPros.svg' as const;
	documentationUrl = 'https://api.fantasypros.com/public/v2/docs/';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your FantasyPros Public API key',
		},
	];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-api-key': '={{$credentials.apiKey}}',
			},
		},
	};
	test = {
		request: {
			baseURL: 'https://api.fantasypros.com/public/v2/json',
			url: '/nfl/players',
		},
	};
}
