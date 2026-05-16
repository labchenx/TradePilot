import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';

export function toDecimal(
  value: Prisma.Decimal | Decimal.Value | null | undefined,
) {
  if (value === null || value === undefined) {
    return new Decimal(0);
  }

  return new Decimal(value.toString());
}

export function toPlainNumber(value: Decimal) {
  // API 边界才把 Decimal 转成 number，内部计算始终保留 Decimal 精度。
  return Number(value.toDecimalPlaces(6).toString());
}

export function absDecimal(value: Prisma.Decimal | Decimal.Value | null | undefined) {
  return toDecimal(value).abs();
}
