import Decimal from 'decimal.js-light';
import { BadRequestException } from '@nestjs/common';

export function D(v: string) {
  return new Decimal(v);
}

export function parsePositiveDecimal(input: string, field: string): Decimal {
  let d: Decimal;

  try {
    d = D(input);
  } catch {
    throw new BadRequestException(`Invalid ${field}`);
  }

  const s = d.toString();
  if (s === 'NaN' || s === 'Infinity' || s === '-Infinity') {
    throw new BadRequestException(`Invalid ${field}`);
  }

  if (d.lte(0)) {
    throw new BadRequestException(`${field} must be positive`);
  }

  return d;
}

export function DecimalMin(a: ReturnType<typeof D>, b: ReturnType<typeof D>) {
  return a.lte(b) ? a : b;
}
