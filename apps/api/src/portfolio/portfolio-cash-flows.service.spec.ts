import { CashFlowType, Prisma } from '@prisma/client';
import { PortfolioCashFlowsService } from './portfolio-cash-flows.service';

function cashFlow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cash-1',
    accountId: 'U123',
    type: CashFlowType.DEPOSIT,
    amount: new Prisma.Decimal(1000),
    currency: 'USD',
    flowDate: new Date('2026-01-01T00:00:00.000Z'),
    source: 'manual',
    sourceHash: 'cash-hash-1',
    rawData: {},
    remark: 'Initial deposit',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('PortfolioCashFlowsService', () => {
  it('returns only deposit and withdrawal rows from cash_flows with summary metrics', async () => {
    const rows = [
      cashFlow({
        id: 'deposit-1',
        amount: new Prisma.Decimal(1000),
      }),
      cashFlow({
        id: 'withdrawal-1',
        type: CashFlowType.WITHDRAWAL,
        amount: new Prisma.Decimal(-250),
        remark: 'Transfer out',
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      }),
    ];
    const prisma = {
      cashFlow: {
        findMany: jest.fn().mockResolvedValue(rows),
      },
    };
    const service = new PortfolioCashFlowsService(prisma as never);

    const result = await service.getCashFlows();

    expect(prisma.cashFlow.findMany).toHaveBeenCalledWith({
      where: {
        type: { in: [CashFlowType.DEPOSIT, CashFlowType.WITHDRAWAL] },
      },
      orderBy: [{ flowDate: 'desc' }, { createdAt: 'desc' }],
    });
    expect(result.summary).toMatchObject({
      totalDeposits: 1000,
      totalWithdrawals: 250,
      cashBalance: 750,
      netDeposit: 750,
      currency: 'USD',
    });
    expect(result.items).toEqual([
      expect.objectContaining({
        id: 'deposit-1',
        type: 'Deposit',
        amount: 1000,
      }),
      expect.objectContaining({
        id: 'withdrawal-1',
        type: 'Withdrawal',
        amount: -250,
      }),
    ]);
  });

  it('normalizes positive withdrawal amounts and warns when summary uses FX conversion', async () => {
    const prisma = {
      cashFlow: {
        findMany: jest.fn().mockResolvedValue([
          cashFlow({
            id: 'hkd-deposit',
            currency: 'HKD',
            amount: new Prisma.Decimal(7830.049),
          }),
          cashFlow({
            id: 'hkd-withdrawal',
            type: CashFlowType.WITHDRAWAL,
            currency: 'HKD',
            amount: new Prisma.Decimal(783.0049),
          }),
        ]),
      },
    };
    const service = new PortfolioCashFlowsService(prisma as never);

    const result = await service.getCashFlows();

    expect(result.summary).toMatchObject({
      totalDeposits: 1000,
      totalWithdrawals: 100,
      netDeposit: 900,
      cashBalance: 900,
    });
    expect(result.items[1]).toMatchObject({
      type: 'Withdrawal',
      amount: -783.0049,
      currency: 'HKD',
    });
    expect(result.warnings.join('\n')).toContain('顶部概览已按本地汇率配置换算为 USD');
  });
});
