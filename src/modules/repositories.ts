import type {
  Product,
  Customer,
  Quotation,
  Receipt,
  User,
} from "../shared/types";
import { DomainError } from "../shared/errors";
export interface Repository<T extends { id: string }> {
  list(): T[];
  get(id: string): T | undefined;
  create(entity: T): T;
  update(id: string, entity: T): T;
  delete(id: string): void;
}
export class InMemoryRepository<
  T extends { id: string },
> implements Repository<T> {
  private readonly data: T[];
  constructor(seed: T[] = []) {
    this.data = seed.map((item) => ({ ...item }));
  }
  list(): T[] {
    return this.data.map((item) => ({ ...item }));
  }
  get(id: string): T | undefined {
    const item = this.data.find((entry) => entry.id === id);
    return item ? { ...item } : undefined;
  }
  create(entity: T): T {
    if (this.data.some((item) => item.id === entity.id))
      throw new DomainError("ID duplicado");
    this.data.push({ ...entity });
    return { ...entity };
  }
  update(id: string, entity: T): T {
    const index = this.data.findIndex((item) => item.id === id);
    if (index < 0) throw new DomainError("Registro no encontrado");
    this.data[index] = { ...entity, id };
    return { ...this.data[index] };
  }
  delete(id: string): void {
    const index = this.data.findIndex((item) => item.id === id);
    if (index < 0) throw new DomainError("Registro no encontrado");
    this.data.splice(index, 1);
  }
}
export type ProductRepository = Repository<Product>;
export type CustomerRepository = Repository<Customer>;
export type QuotationRepository = Repository<Quotation>;
export type ReceiptRepository = Repository<Receipt>;
export type UserRepository = Repository<User>;
