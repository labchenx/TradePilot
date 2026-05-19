import type {
  Holding,
  HoldingsData,
  HoldingsResponseApiDto,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4100';

const holdingColors = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#6366f1',
  '#ef4444',
  '#14b8a6',
  '#64748b',
];

async function requestApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Holdings API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function mapHoldingsResponse(response: HoldingsResponseApiDto): HoldingsData {
  const holdings: Holding[] = response.holdings.map((holding, index) => ({
    ...holding,
    id: holding.symbol,
    color: holdingColors[index % holdingColors.length],
  }));
  const colorsBySymbol = new Map(
    holdings.map((holding) => [holding.symbol, holding.color]),
  );

  return {
    summary: response.summary,
    holdings,
    allocation: response.allocation.map((item) => ({
      ...item,
      color: colorsBySymbol.get(item.symbol) ?? '#64748b',
    })),
    pnlBySymbol: response.pnlBySymbol,
    updatedAt: response.updatedAt,
    warnings: Array.from(
      new Set([
        ...(response.warnings ?? []),
        ...(response.summary.warnings ?? []),
        ...holdings.flatMap((holding) => holding.warnings ?? []),
      ]),
    ),
  };
}

export const holdingService = {
  async listHoldings() {
    const response =
      await requestApi<HoldingsResponseApiDto>('/portfolio/positions');
    return mapHoldingsResponse(response);
  },
};
