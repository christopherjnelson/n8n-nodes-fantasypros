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

export function projectionParameters(
	operation: string,
	overrides: ParameterMap = {},
): ParameterMap {
	return {
		resource: 'projection',
		operation,
		season: 2026,
		position: 'QB',
		nflProjectionPeriod: 'weekly',
		nflWeek: 1,
		nflOptions: {},
		mlbProjectionType: 'preseason',
		mlbDate: '',
		mlbWeek: 1,
		mlbPosition: '',
		mlbOptions: {},
		nbaProjectionType: 'preseason',
		nbaDate: '',
		nbaPosition: '',
		nbaStatisticsType: 'total',
		nbaPreciseValues: false,
		nbaOptions: {},
		returnAll: true,
		...overrides,
	};
}

export function newsParameters(overrides: ParameterMap = {}): ParameterMap {
	return {
		resource: 'news',
		operation: 'getMany',
		sport: 'nfl',
		returnAll: false,
		limit: 50,
		newsOptions: {},
		...overrides,
	};
}

export function injuryParameters(overrides: ParameterMap = {}): ParameterMap {
	return {
		resource: 'injury',
		operation: 'getMany',
		sport: 'nfl',
		returnAll: false,
		limit: 50,
		injuryOptions: {},
		...overrides,
	};
}

export function nflParameters(overrides: ParameterMap = {}): ParameterMap {
	return {
		resource: 'nfl',
		operation: 'getPlayerPoints',
		season: 2026,
		startWeek: 1,
		endWeek: 18,
		position: 'ALL',
		scoring: 'STD',
		minimalResponse: false,
		returnAll: false,
		limit: 50,
		...overrides,
	};
}

export function mlbParameters(overrides: ParameterMap = {}): ParameterMap {
	return {
		resource: 'mlb',
		operation: 'getLineups',
		startDate: '2026-08-12',
		period: 'REG',
		projected: false,
		returnAll: false,
		limit: 50,
		...overrides,
	};
}

export function rejected(error: IDataObject): IDataObject {
	return { __reject: error };
}
