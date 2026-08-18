import { describe, expect, it } from 'vitest';
import { FantasyProsApi } from '../credentials/FantasyProsApi.credentials';
import { FantasyPros } from '../nodes/FantasyPros/FantasyPros.node';
import codex from '../nodes/FantasyPros/FantasyPros.node.json';

describe('FantasyPros scaffold', () => {
	it('registers the final node and credential identities', () => {
		const node = new FantasyPros();
		const credential = new FantasyProsApi();

		expect(node.description.name).toBe('fantasyPros');
		expect(node.description.displayName).toBe('FantasyPros');
		expect(credential.name).toBe('fantasyProsApi');
		expect(codex.node).toBe('n8n-nodes-fantasypros.fantasyPros');
	});

	it('injects credentials only through the x-api-key header', () => {
		const credential = new FantasyProsApi();
		expect(credential.authenticate.properties.headers).toEqual({
			'x-api-key': '={{$credentials.apiKey}}',
		});
	});

	it('configures credential test and links it via testedBy on the node', () => {
		const node = new FantasyPros();
		const credential = new FantasyProsApi();

		expect(credential.test).toBeDefined();
		expect(credential.test?.request?.baseURL).toBe('https://api.fantasypros.com/public/v2/json');
		expect(credential.test?.request?.url).toBe('/nfl/players');

		expect(node.description.credentials).toEqual([
			{
				name: 'fantasyProsApi',
				required: true,
				testedBy: 'fantasyProsApi',
			},
		]);
	});
});
