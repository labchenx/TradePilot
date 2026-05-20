import { Injectable } from '@nestjs/common';
import { CashFlowType, Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { toDecimal, toPlainNumber } from '../dashboard/calculators/dashboard-decimal.util';
import { convertToDashboardCurrency } from '../dashboard/calculators/exchange-rate.util';
import { PrismaService } from '../prisma/prisma.service';

type CashFlowRow = Prisma.CashFlowGetPayload<object>;

export type CashFlowDisplayType = 'Deposit' | 'Withdrawal';

export interface CashFlowSummary {
  totalDeposits: number;
  totalWithdrawals: number;
  cashBalance: number;
  netDeposit: number;
  currency: string;
}

export interface CashFlowItem {
  id: string;
  date: string;
  type: CashFlowDisplayType;
  amount: number;
  currency: string;
  remark?: string;
  source?: string;
}

export interface CashFlowsResponse {
  summary: CashFlowSummary;
  items: CashFlowItem[];
  warnings: string[];
}

const BASE_CURRENCY = 'USD';

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getDisplayType(type: CashFlowType): CashFlowDisplayType {
  return type === CashFlowType.DEPOSIT ? 'Deposit' : 'Withdrawal';
}

function signedAmountByType(row: CashFlowRow) {
  const amount = toDecimal(row.amount).abs();
  return row.type === CashFlowType.DEPOSIT ? amount : amount.negated();
}

function mapCashFlowItem(row: CashFlowRow): CashFlowItem {
  return {
    id: row.id,
    date: dateOnly(row.flowDate),
    type: getDisplayType(row.type),
    amount: toPlainNumber(signedAmountByType(row)),
    currency: row.currency,
    remark: row.remark ?? undefined,
    source: row.source ?? undefined,
  };
}

function addConvertedAmount(
  current: Decimal,
  row: CashFlowRow,
  warnings: Set<string>,
) {
  const converted = convertToDashboardCurrency(
    signedAmountByType(row),
    row.currency,
  );
  converted.warnings.forEach((warning) => warnings.add(warning));
  return current.plus(converted.amount);
}

function buildSummary(rows: CashFlowRow[]) {
  const warnings = new Set<string>();
  let totalDeposits = new Decimal(0);
  let totalWithdrawals = new Decimal(0);
  const currencies = new Set(rows.map((row) => row.currency));

  for (const row of rows) {
    if (row.type === CashFlowType.DEPOSIT) {
      totalDeposits = addConvertedAmount(totalDeposits, row, warnings);
    } else {
      totalWithdrawals = totalWithdrawals.plus(
        addConvertedAmount(new Decimal(0), row, warnings).abs(),
      );
    }
  }

  if (currencies.size > 1 || (currencies.size === 1 && !currencies.has(BASE_CURRENCY))) {
    warnings.add(
      `现金流水包含 ${Array.from(currencies).join(' / ')} 多币种，顶部概览已按本地汇率配置换算为 ${BASE_CURRENCY}。`,
    );
  }

  const netDeposit = totalDeposits.minus(totalWithdrawals);

  return {
    summary: {
      totalDeposits: toPlainNumber(totalDeposits),
      totalWithdrawals: toPlainNumber(totalWithdrawals),
      cashBalance: toPlainNumber(netDeposit),
      netDeposit: toPlainNumber(netDeposit),
      currency: BASE_CURRENCY,
    },
    warnings: Array.from(warnings),
  };
}

@Injectable()
export class PortfolioCashFlowsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 本阶段 Cash Flows 页面只读 cash_flows 表。
   * 这张表是入金/出金的业务事实表；页面不再混入交易、股息、税费、
   * 利息或手续费，避免和交易流水页职责重叠。
   */
  async getCashFlows(): Promise<CashFlowsResponse> {
    const rows = await this.prisma.cashFlow.findMany({
      where: {
        type: { in: [CashFlowType.DEPOSIT, CashFlowType.WITHDRAWAL] },
      },
      orderBy: [{ flowDate: 'desc' }, { createdAt: 'desc' }],
    });
    const { summary, warnings } = buildSummary(rows);

    return {
      summary,
      items: rows.map(mapCashFlowItem),
      warnings,
    };
  }
}
