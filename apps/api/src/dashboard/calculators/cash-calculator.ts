import Decimal from 'decimal.js';
import {
  CashCalculationResult,
  DashboardEventRow,
  DashboardImportFileRow,
} from './dashboard-calculator.types';
import { toDecimal, toPlainNumber } from './dashboard-decimal.util';
import { convertToDashboardCurrency } from './exchange-rate.util';

const REALIZED_NET_INCOME_EVENT_TYPES = [
  'DIVIDEND',
  'PAYMENT_IN_LIEU',
  'WITHHOLDING_TAX',
  'DEBIT_INTEREST',
  'OTHER_FEE',
];

interface ImportSummaryCashReport {
  deposits?: number;
  withdrawals?: number;
  buyCash?: number;
  sellCash?: number;
  dividends?: number;
  paymentInLieu?: number;
  withholdingTax?: number;
  interest?: number;
  commissions?: number;
  fees?: number;
  fxCashPnl?: number;
  otherCashAdjustments?: number;
  accruedDividend?: number;
  cashBalance?: number;
}

interface ImportSummary {
  depositTotal?: number;
  withdrawalTotal?: number;
  netDeposit?: number;
  cashReport?: ImportSummaryCashReport;
}

function toImportSummary(value: unknown): ImportSummary {
  return typeof value === 'object' && value !== null
    ? (value as ImportSummary)
    : {};
}

function createCurrencyBucket() {
  return {
    cashBalance: new Decimal(0),
    netDeposit: new Decimal(0),
    deposit: new Decimal(0),
    withdrawal: new Decimal(0),
    cashBalanceInBaseCurrency: new Decimal(0),
    netDepositInBaseCurrency: new Decimal(0),
  };
}

function decimalFromNumber(value: number | undefined) {
  return new Decimal(value ?? 0);
}

function findLatestCashReport(importFiles: DashboardImportFileRow[]) {
  return [...importFiles]
    .sort((a, b) => {
      const aTime = a.periodEnd?.getTime() ?? a.createdAt.getTime();
      const bTime = b.periodEnd?.getTime() ?? b.createdAt.getTime();
      return bTime - aTime;
    })
    .map((file) => toImportSummary(file.summary).cashReport)
    .find((cashReport) => typeof cashReport?.cashBalance === 'number');
}

function calculateEventCashFallback(events: DashboardEventRow[]) {
  const warnings = new Set<string>();
  const result = {
    cashBalance: new Decimal(0),
    deposits: new Decimal(0),
    withdrawals: new Decimal(0),
    buyCash: new Decimal(0),
    sellCash: new Decimal(0),
    dividends: new Decimal(0),
    paymentInLieu: new Decimal(0),
    withholdingTax: new Decimal(0),
    interest: new Decimal(0),
    commissions: new Decimal(0),
    fees: new Decimal(0),
    fxCashPnl: new Decimal(0),
    otherCashAdjustments: new Decimal(0),
  };

  for (const event of events) {
    const converted = convertToDashboardCurrency(
      toDecimal(event.netAmount),
      event.currency,
    );
    converted.warnings.forEach((warning) => warnings.add(warning));

    // FX_COMPONENT 当前只保留了外汇交易的一边现金腿，不能直接进入 cashBalance，
    // 否则会把换汇支出重复扣掉，造成现金余额被严重低估。
    if (event.eventType !== 'FX_COMPONENT') {
      result.cashBalance = result.cashBalance.plus(converted.amount);
    }

    if (event.eventType === 'DEPOSIT') result.deposits = result.deposits.plus(converted.amount);
    if (event.eventType === 'WITHDRAWAL') result.withdrawals = result.withdrawals.plus(converted.amount);
    if (event.eventType === 'TRADE_BUY') result.buyCash = result.buyCash.plus(converted.amount);
    if (event.eventType === 'TRADE_SELL') result.sellCash = result.sellCash.plus(converted.amount);
    if (event.eventType === 'DIVIDEND') result.dividends = result.dividends.plus(converted.amount);
    if (event.eventType === 'PAYMENT_IN_LIEU') result.paymentInLieu = result.paymentInLieu.plus(converted.amount);
    if (event.eventType === 'WITHHOLDING_TAX') result.withholdingTax = result.withholdingTax.plus(converted.amount);
    if (event.eventType === 'DEBIT_INTEREST') result.interest = result.interest.plus(converted.amount);
    if (event.eventType === 'OTHER_FEE') result.fees = result.fees.plus(converted.amount);
    if (event.eventType === 'FX_COMPONENT') result.fxCashPnl = result.fxCashPnl.plus(converted.amount);

    if (event.eventType === 'TRADE_BUY' || event.eventType === 'TRADE_SELL') {
      const commission = convertToDashboardCurrency(
        toDecimal(event.commission),
        event.currency,
      );
      result.commissions = result.commissions.plus(commission.amount);
    }
  }

  return { ...result, warnings: Array.from(warnings) };
}

function calculateNetDepositFromImportSummaries(
  importFiles: DashboardImportFileRow[],
) {
  let deposits = new Decimal(0);
  let withdrawals = new Decimal(0);
  let hasSummary = false;

  for (const file of importFiles) {
    const summary = toImportSummary(file.summary);

    if (
      typeof summary.depositTotal === 'number' ||
      typeof summary.withdrawalTotal === 'number'
    ) {
      hasSummary = true;
      deposits = deposits.plus(summary.depositTotal ?? 0);
      withdrawals = withdrawals.plus(summary.withdrawalTotal ?? 0);
    }
  }

  return hasSummary
    ? {
        deposits,
        withdrawals,
        netDeposit: deposits.plus(withdrawals),
      }
    : null;
}

function calculateCurrencyBreakdown(events: DashboardEventRow[]) {
  const breakdown = new Map<string, ReturnType<typeof createCurrencyBucket>>();
  const warnings = new Set<string>();

  for (const event of events) {
    const currency = event.currency ?? 'UNKNOWN';
    const item = breakdown.get(currency) ?? createCurrencyBucket();
    breakdown.set(currency, item);

    const netAmount = toDecimal(event.netAmount);
    const convertedNetAmount = convertToDashboardCurrency(
      netAmount,
      event.currency,
    );
    convertedNetAmount.warnings.forEach((warning) => warnings.add(warning));

    if (event.eventType !== 'FX_COMPONENT') {
      item.cashBalance = item.cashBalance.plus(netAmount);
      item.cashBalanceInBaseCurrency = item.cashBalanceInBaseCurrency.plus(
        convertedNetAmount.amount,
      );
    }

    if (event.eventType === 'DEPOSIT' || event.eventType === 'WITHDRAWAL') {
      item.netDeposit = item.netDeposit.plus(netAmount);
      item.netDepositInBaseCurrency = item.netDepositInBaseCurrency.plus(
        convertedNetAmount.amount,
      );

      if (event.eventType === 'DEPOSIT') item.deposit = item.deposit.plus(netAmount);
      else item.withdrawal = item.withdrawal.plus(netAmount);
    }
  }

  return {
    items: Array.from(breakdown.entries())
      .map(([currency, item]) => ({
        currency,
        cashBalance: toPlainNumber(item.cashBalance),
        netDeposit: toPlainNumber(item.netDeposit),
        deposit: toPlainNumber(item.deposit),
        withdrawal: toPlainNumber(item.withdrawal),
        cashBalanceInBaseCurrency: toPlainNumber(
          item.cashBalanceInBaseCurrency,
        ),
        netDepositInBaseCurrency: toPlainNumber(
          item.netDepositInBaseCurrency,
        ),
      }))
      .filter(
        (item) =>
          item.cashBalance !== 0 ||
          item.netDeposit !== 0 ||
          item.deposit !== 0 ||
          item.withdrawal !== 0,
      )
      .sort((a, b) => a.currency.localeCompare(b.currency)),
    warnings: Array.from(warnings),
  };
}

/**
 * 现金计算器。
 *
 * 优先使用 IBKR 现金报告里的“基础货币总结”，因为它已经处理了外汇换算、
 * 期初现金、交易现金流和现金外汇换算收益/损失。当前 transaction_events 里的
 * FX_COMPONENT 只有外汇交易的一边现金腿，不能直接用来重建现金余额。
 */
export function calculateCashMetrics(
  events: DashboardEventRow[],
  importFiles: DashboardImportFileRow[] = [],
): CashCalculationResult {
  const warnings = new Set<string>();
  const eventCash = calculateEventCashFallback(events);
  eventCash.warnings.forEach((warning) => warnings.add(warning));

  const latestCashReport = findLatestCashReport(importFiles);
  const cashBalance =
    typeof latestCashReport?.cashBalance === 'number'
      ? decimalFromNumber(latestCashReport.cashBalance)
      : eventCash.cashBalance;
  const netDepositFromSummary =
    calculateNetDepositFromImportSummaries(importFiles);
  const netDeposit =
    netDepositFromSummary?.netDeposit ??
    eventCash.deposits.plus(eventCash.withdrawals);

  if (!latestCashReport) {
    warnings.add(
      'ImportFile.summary 中没有 IBKR 现金报告，cashBalance 已退回到 transaction_events 估算，并已排除 FX_COMPONENT。',
    );
  }

  const realizedNetIncomeAdjustments = events.reduce((sum, event) => {
    if (!REALIZED_NET_INCOME_EVENT_TYPES.includes(event.eventType)) {
      return sum;
    }

    const converted = convertToDashboardCurrency(
      toDecimal(event.netAmount),
      event.currency,
    );
    converted.warnings.forEach((warning) => warnings.add(warning));
    return sum.plus(converted.amount);
  }, new Decimal(0));
  const currencyBreakdownResult = calculateCurrencyBreakdown(events);
  currencyBreakdownResult.warnings.forEach((warning) => warnings.add(warning));

  return {
    cashBalance,
    netDeposit,
    dividends: eventCash.dividends,
    paymentInLieu: eventCash.paymentInLieu,
    withholdingTax: eventCash.withholdingTax,
    debitInterest: eventCash.interest,
    otherFee: eventCash.fees,
    realizedNetIncomeAdjustments,
    cashDebug: {
      deposits: toPlainNumber(
        latestCashReport
          ? decimalFromNumber(latestCashReport.deposits)
          : eventCash.deposits,
      ),
      withdrawals: toPlainNumber(
        latestCashReport
          ? decimalFromNumber(latestCashReport.withdrawals)
          : eventCash.withdrawals,
      ),
      buyCash: toPlainNumber(
        latestCashReport
          ? decimalFromNumber(latestCashReport.buyCash)
          : eventCash.buyCash,
      ),
      sellCash: toPlainNumber(
        latestCashReport
          ? decimalFromNumber(latestCashReport.sellCash)
          : eventCash.sellCash,
      ),
      dividends: toPlainNumber(
        latestCashReport
          ? decimalFromNumber(latestCashReport.dividends)
          : eventCash.dividends,
      ),
      paymentInLieu: toPlainNumber(
        latestCashReport
          ? decimalFromNumber(latestCashReport.paymentInLieu)
          : eventCash.paymentInLieu,
      ),
      withholdingTax: toPlainNumber(
        latestCashReport
          ? decimalFromNumber(latestCashReport.withholdingTax)
          : eventCash.withholdingTax,
      ),
      interest: toPlainNumber(
        latestCashReport
          ? decimalFromNumber(latestCashReport.interest)
          : eventCash.interest,
      ),
      commissions: toPlainNumber(
        latestCashReport
          ? decimalFromNumber(latestCashReport.commissions)
          : eventCash.commissions,
      ),
      fees: toPlainNumber(
        latestCashReport
          ? decimalFromNumber(latestCashReport.fees)
          : eventCash.fees,
      ),
      fxCashPnl: toPlainNumber(
        latestCashReport
          ? decimalFromNumber(latestCashReport.fxCashPnl)
          : eventCash.fxCashPnl,
      ),
      otherCashAdjustments: toPlainNumber(
        latestCashReport
          ? decimalFromNumber(latestCashReport.otherCashAdjustments)
          : eventCash.otherCashAdjustments,
      ),
      accruedDividend: toPlainNumber(
        decimalFromNumber(latestCashReport?.accruedDividend),
      ),
      cashBalance: toPlainNumber(cashBalance),
      source: latestCashReport
        ? 'IBKR_CASH_REPORT'
        : 'TRANSACTION_EVENTS_FALLBACK',
    },
    netDepositDebug: {
      deposits: toPlainNumber(netDepositFromSummary?.deposits ?? eventCash.deposits),
      withdrawals: toPlainNumber(
        netDepositFromSummary?.withdrawals ?? eventCash.withdrawals,
      ),
      netDeposit: toPlainNumber(netDeposit),
      source: netDepositFromSummary
        ? 'IBKR_IMPORT_SUMMARY'
        : 'TRANSACTION_EVENTS_FALLBACK',
    },
    currencyBreakdown: currencyBreakdownResult.items,
    warnings: Array.from(warnings),
  };
}

