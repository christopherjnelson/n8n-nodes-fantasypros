import { vi } from 'vitest';
import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

type ParameterMap = Record<string, unknown | unknown[]>;

export function createExecuteContext(
	parameters: ParameterMap,
	responses: unknown[] = [],
	options: { inputCount?: number; continueOnFail?: boolean } = {},
): IExecuteFunctions & { request: ReturnType<typeof vi.fn> } {
	const request = vi.fn();
	for (const response of responses) {
		if (
			response instanceof Error ||
			(typeof response === 'object' && response !== null && '__reject' in response)
		) {
			request.mockRejectedValueOnce(response instanceof Error ? response : response.__reject);
		} else {
			request.mockResolvedValueOnce(response);
		}
	}
	const inputCount = options.inputCount ?? 1;
	const context = {
		getInputData: () =>
			Array.from({ length: inputCount }, (_, index) => ({
				json: { index },
			})) as INodeExecutionData[],
		getNodeParameter: (name: string, itemIndex: number, fallback?: unknown) => {
			const value = parameters[name];
			if (value === undefined) return fallback;
			return Array.isArray(value) && !['externalIds'].includes(name) ? value[itemIndex] : value;
		},
		getNode: () => ({
			name: 'FantasyPros',
			type: 'n8n-nodes-fantasypros.fantasyPros',
			typeVersion: 1,
			position: [0, 0],
		}),
		continueOnFail: () => options.continueOnFail ?? false,
		helpers: { httpRequestWithAuthentication: request },
		request,
	};
	return context as unknown as IExecuteFunctions & { request: ReturnType<typeof vi.fn> };
}

export function playerGetManyParameters(overrides: ParameterMap = {}): ParameterMap {
	return {
		resource: 'player',
		operation: 'getMany',
		sport: 'nfl',
		returnAll: true,
		options: {},
		...overrides,
	};
}

export function playerCompareParameters(overrides: ParameterMap = {}): ParameterMap {
	return {
		resource: 'player',
		operation: 'compare',
		sport: 'nfl',
		playerIds: '10:20',
		position: 'RB',
		season: 2026,
		week: 1,
		compareOptions: {},
		...overrides,
	};
}

export function rankingsParameters(operation: string, overrides: ParameterMap = {}): ParameterMap {
	return {
		resource: 'rankings',
		operation,
		sport: 'nfl',
		season: 2026,
		position: operation === 'getConsensusRankings' ? 'RB' : '',
		rankingType: '',
		scoring: '',
		returnAll: true,
		rankingsOptions: {},
		useDraftersType: false,
		siteEligibility: '',
		consensusOptions: {},
		includeOverall: false,
		...overrides,
	};
}

export function rejected(error: IDataObject): IDataObject {
	return { __reject: error };
}
