import {
	NodeConnectionTypes,
	NodeOperationError,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

export class FantasyPros implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FantasyPros',
		name: 'fantasyPros',
		icon: { light: 'file:fantasyPros.svg', dark: 'file:fantasyPros.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] || "Setup"}}',
		description: 'Use the official FantasyPros Public API v2',
		defaults: { name: 'FantasyPros' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'fantasyProsApi', required: true }],
		properties: [
			{
				displayName: 'Scaffold Only',
				name: 'scaffoldNotice',
				type: 'notice',
				default: '',
				description: 'Player operations will replace this temporary scaffold in the next change',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		throw new NodeOperationError(
			this.getNode(),
			'This temporary scaffold does not expose an executable operation yet.',
		);
	}
}
