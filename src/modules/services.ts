import type {
  Product,
  Customer,
  Quotation,
  QuotationItem,
  Receipt,
  ReceiptItem,
  User,
  DocumentType,
  QuotationStatus,
} from "../shared/types";
import type { Repository } from "./repositories";
import { DomainError } from "../shared/errors";
import {
  assertPositive,
  calculateAmounts,
  type Clock,
  type IdGenerator,
} from "../shared/utils";

function required(value: string, label: string): string {
  if (!value.trim()) throw new DomainError(`${label} es obligatorio`);
  return value.trim();
}
function documentValid(type: DocumentType, number: string): boolean {
  return type === "DNI" ? /^\d{8}$/.test(number) : /^\d{11}$/.test(number);
}
function emailValid(email?: string): boolean {
  return (
    email === undefined ||
    email === "" ||
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
  );
}

export class AuthService {
  private current?: User;
  constructor(private readonly users: Repository<User>) {}
  login(email: string, password: string): User {
    const user = this.users
      .list()
      .find((item) => item.email === email && item.password === password);
    if (!user) throw new DomainError("Credenciales inválidas");
    this.current = user;
    return { ...user };
  }
  logout(): void {
    this.current = undefined;
  }
  session(): User | undefined {
    return this.current ? { ...this.current } : undefined;
  }
}
export class ProductService {
  constructor(
    private readonly repo: Repository<Product>,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly hasReferences: (id: string) => boolean,
  ) {}
  list(): Product[] {
    return this.repo.list();
  }
  get(id: string): Product {
    const item = this.repo.get(id);
    if (!item) throw new DomainError("Producto no encontrado");
    return item;
  }
  create(
    input: Omit<Product, "id" | "createdAt" | "updatedAt" | "active"> & {
      active?: boolean;
    },
  ): Product {
    required(input.sku, "SKU");
    required(input.name, "Nombre");
    assertPositive(input.price, "Precio");
    if (!Number.isInteger(input.stock) || input.stock < 0)
      throw new DomainError("Stock inválido");
    if (this.repo.list().some((item) => item.sku === input.sku))
      throw new DomainError("SKU duplicado");
    const now = this.clock.now();
    return this.repo.create({
      ...input,
      id: this.ids.next(),
      active: input.active ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }
  update(
    id: string,
    input: Partial<
      Pick<Product, "sku" | "name" | "description" | "price" | "stock">
    >,
  ): Product {
    const old = this.get(id);
    const merged = { ...old, ...input };
    required(merged.sku, "SKU");
    required(merged.name, "Nombre");
    assertPositive(merged.price, "Precio");
    if (!Number.isInteger(merged.stock) || merged.stock < 0)
      throw new DomainError("Stock inválido");
    if (
      this.repo.list().some((item) => item.sku === merged.sku && item.id !== id)
    )
      throw new DomainError("SKU duplicado");
    return this.repo.update(id, { ...merged, updatedAt: this.clock.now() });
  }
  deactivate(id: string): Product {
    const item = this.get(id);
    return this.repo.update(id, {
      ...item,
      active: false,
      updatedAt: this.clock.now(),
    });
  }
  remove(id: string): void {
    if (this.hasReferences(id)) {
      this.deactivate(id);
      return;
    }
    this.repo.delete(id);
  }
  adjustStock(id: string, delta: number): Product {
    const item = this.get(id);
    if (item.stock + delta < 0) throw new DomainError("Stock insuficiente");
    return this.repo.update(id, {
      ...item,
      stock: item.stock + delta,
      updatedAt: this.clock.now(),
    });
  }
}
export class CustomerService {
  constructor(
    private readonly repo: Repository<Customer>,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly hasReferences: (id: string) => boolean,
  ) {}
  list(): Customer[] {
    return this.repo.list();
  }
  get(id: string): Customer {
    const item = this.repo.get(id);
    if (!item) throw new DomainError("Cliente no encontrado");
    return item;
  }
  create(
    input: Omit<Customer, "id" | "createdAt" | "updatedAt" | "active"> & {
      active?: boolean;
    },
  ): Customer {
    required(input.documentNumber, "Documento");
    if (!documentValid(input.documentType, input.documentNumber))
      throw new DomainError("Documento inválido");
    required(input.name, "Nombre");
    if (!emailValid(input.email)) throw new DomainError("Email inválido");
    if (
      this.repo
        .list()
        .some((item) => item.documentNumber === input.documentNumber)
    )
      throw new DomainError("Documento duplicado");
    const now = this.clock.now();
    return this.repo.create({
      ...input,
      id: this.ids.next(),
      active: input.active ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }
  update(
    id: string,
    input: Partial<
      Pick<
        Customer,
        | "documentType"
        | "documentNumber"
        | "name"
        | "email"
        | "phone"
        | "address"
      >
    >,
  ): Customer {
    const old = this.get(id);
    const merged = { ...old, ...input };
    if (!documentValid(merged.documentType, merged.documentNumber))
      throw new DomainError("Documento inválido");
    required(merged.name, "Nombre");
    if (!emailValid(merged.email)) throw new DomainError("Email inválido");
    if (
      this.repo
        .list()
        .some(
          (item) =>
            item.documentNumber === merged.documentNumber && item.id !== id,
        )
    )
      throw new DomainError("Documento duplicado");
    return this.repo.update(id, { ...merged, updatedAt: this.clock.now() });
  }
  deactivate(id: string): Customer {
    const item = this.get(id);
    return this.repo.update(id, {
      ...item,
      active: false,
      updatedAt: this.clock.now(),
    });
  }
  remove(id: string): void {
    if (this.hasReferences(id)) {
      this.deactivate(id);
      return;
    }
    this.repo.delete(id);
  }
}
const transitions: Record<QuotationStatus, QuotationStatus[]> = {
  DRAFT: ["ISSUED"],
  ISSUED: ["ACCEPTED", "REJECTED", "EXPIRED"],
  ACCEPTED: [],
  REJECTED: [],
  EXPIRED: [],
};
export class QuotationService {
  constructor(
    private readonly repo: Repository<Quotation>,
    private readonly products: Repository<Product>,
    private readonly customers: Repository<Customer>,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}
  list(): Quotation[] {
    return this.repo.list();
  }
  get(id: string): Quotation {
    const item = this.repo.get(id);
    if (!item) throw new DomainError("Cotización no encontrada");
    return item;
  }
  create(input: {
    number: string;
    customerId: string;
    items: Array<{ productId: string; quantity: number }>;
    discount?: number;
    validUntil: string;
  }): Quotation {
    required(input.number, "Número");
    if (this.repo.list().some((item) => item.number === input.number))
      throw new DomainError("Número duplicado");
    const customer = this.customers.get(input.customerId);
    if (!customer) throw new DomainError("Cliente no encontrado");
    if (!customer.active) throw new DomainError("Cliente inactivo");
    const items = this.buildItems(input.items);
    const amounts = calculateAmounts(items, input.discount);
    const now = this.clock.now();
    return this.repo.create({
      id: this.ids.next(),
      number: input.number,
      customerId: input.customerId,
      items,
      status: "DRAFT",
      ...amounts,
      validUntil: input.validUntil,
      createdAt: now,
      updatedAt: now,
    });
  }
  private buildItems(
    inputs: Array<{ productId: string; quantity: number }>,
  ): QuotationItem[] {
    return inputs.map((input) => {
      const product = this.products.get(input.productId);
      if (!product) throw new DomainError("Producto no encontrado");
      if (!product.active) throw new DomainError("Producto inactivo");
      assertPositive(input.quantity, "Cantidad");
      return {
        productId: product.id,
        quantity: input.quantity,
        unitPrice: product.price,
        subtotal: input.quantity * product.price,
      };
    });
  }
  transition(id: string, status: QuotationStatus): Quotation {
    const item = this.get(id);
    if (!transitions[item.status].includes(status))
      throw new DomainError("Transición inválida");
    if (status === "ACCEPTED" && this.clock.now() > item.validUntil)
      throw new DomainError("Cotización vencida");
    return this.repo.update(id, {
      ...item,
      status,
      updatedAt: this.clock.now(),
    });
  }
  update(
    id: string,
    input: {
      items?: Array<{ productId: string; quantity: number }>;
      discount?: number;
    },
  ): Quotation {
    const item = this.get(id);
    if (item.status !== "DRAFT")
      throw new DomainError("Cotización no editable");
    const items = input.items ? this.buildItems(input.items) : item.items;
    const amounts = calculateAmounts(items, input.discount ?? item.discount);
    return this.repo.update(id, {
      ...item,
      items,
      ...amounts,
      updatedAt: this.clock.now(),
    });
  }
}
export class ReceiptService {
  constructor(
    private readonly repo: Repository<Receipt>,
    private readonly products: ProductService,
    private readonly customers: Repository<Customer>,
    private readonly quotations: Repository<Quotation>,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}
  list(): Receipt[] {
    return this.repo.list();
  }
  get(id: string): Receipt {
    const item = this.repo.get(id);
    if (!item) throw new DomainError("Boleta no encontrada");
    return item;
  }
  create(input: {
    number: string;
    customerId: string;
    quotationId?: string;
    items: Array<{ productId: string; quantity: number; unitPrice?: number }>;
  }): Receipt {
    if (this.repo.list().some((item) => item.number === input.number))
      throw new DomainError("Número duplicado");
    const customer = this.customers.get(input.customerId);
    if (!customer) throw new DomainError("Cliente no encontrado");
    if (!customer.active) throw new DomainError("Cliente inactivo");
    if (input.quotationId) {
      const quotation = this.quotations.get(input.quotationId);
      if (!quotation || quotation.status !== "ACCEPTED")
        throw new DomainError("La cotización no está aceptada");
      if (
        this.repo.list().some((item) => item.quotationId === input.quotationId)
      )
        throw new DomainError("Cotización ya facturada");
    }
    const items: ReceiptItem[] = input.items.map((entry) => {
      const product = this.products.get(entry.productId);
      assertPositive(entry.quantity, "Cantidad");
      return {
        productId: product.id,
        quantity: entry.quantity,
        unitPrice: entry.unitPrice ?? product.price,
        subtotal: entry.quantity * (entry.unitPrice ?? product.price),
      };
    });
    const amounts = calculateAmounts(items);
    const now = this.clock.now();
    return this.repo.create({
      id: this.ids.next(),
      number: input.number,
      customerId: input.customerId,
      quotationId: input.quotationId,
      items,
      ...amounts,
      status: "DRAFT",
      createdAt: now,
    });
  }
  emit(id: string): Receipt {
    const receipt = this.get(id);
    if (receipt.status !== "DRAFT") throw new DomainError("Boleta no emitible");
    if (receipt.items.length === 0)
      throw new DomainError("La boleta requiere items");
    const products = receipt.items.map((item) =>
      this.products.get(item.productId),
    );
    receipt.items.forEach((item, i) => {
      if (products[i].stock < item.quantity)
        throw new DomainError("Stock insuficiente");
    });
    receipt.items.forEach((item) =>
      this.products.adjustStock(item.productId, -item.quantity),
    );
    return this.repo.update(id, {
      ...receipt,
      status: "ISSUED",
      issuedAt: this.clock.now(),
    });
  }
  cancel(id: string): Receipt {
    const receipt = this.get(id);
    if (receipt.status !== "ISSUED")
      throw new DomainError("Solo una boleta emitida puede anularse");
    return this.repo.update(id, { ...receipt, status: "CANCELLED" });
  }
}
