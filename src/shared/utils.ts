import { DomainError } from "./errors";
export interface Clock {
  now(): string;
}
export interface IdGenerator {
  next(): string;
}
export class SystemClock implements Clock {
  now(): string {
    return new Date().toISOString();
  }
}
export class FixedClock implements Clock {
  constructor(private readonly value: string) {}
  now(): string {
    return this.value;
  }
}
export class UuidGenerator implements IdGenerator {
  next(): string {
    return crypto.randomUUID();
  }
}
export class FixedIdGenerator implements IdGenerator {
  private index = 0;
  constructor(private readonly values: string[]) {}
  next(): string {
    const value = this.values[this.index];
    if (!value) throw new DomainError("No hay más IDs configurados");
    this.index += 1;
    return value;
  }
}
export const TAX_RATE = 0.18;
export function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
export function calculateAmounts(
  items: ReadonlyArray<{ quantity: number; unitPrice: number }>,
  discount = 0,
): { subtotal: number; discount: number; tax: number; total: number } {
  const subtotal = money(
    items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
  );
  const normalizedDiscount = money(Math.max(0, discount));
  const taxable = money(Math.max(0, subtotal - normalizedDiscount));
  const tax = money(taxable * TAX_RATE);
  return {
    subtotal,
    discount: normalizedDiscount,
    tax,
    total: money(taxable + tax),
  };
}
export function assertPositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0)
    throw new DomainError(`${label} debe ser mayor que 0`);
}
