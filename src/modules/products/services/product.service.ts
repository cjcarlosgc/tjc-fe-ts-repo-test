import type { Product } from "../../../shared/types";
import type { Repository } from "../../repositories";
import { DomainError } from "../../../shared/errors";
import {
  assertPositive,
  type Clock,
  type IdGenerator,
} from "../../../shared/utils";

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
    if (!input.sku.trim()) throw new DomainError("SKU es obligatorio");
    if (!input.name.trim()) throw new DomainError("Nombre es obligatorio");
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
    if (!merged.sku.trim()) throw new DomainError("SKU es obligatorio");
    if (!merged.name.trim()) throw new DomainError("Nombre es obligatorio");
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
