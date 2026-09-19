import { describe, expect, it } from "vitest";
import { InMemoryRepository } from "./repositories";
import {
  AuthService,
  CustomerService,
  ProductService,
  QuotationService,
  ReceiptService,
} from "./services";
import {
  FixedClock,
  FixedIdGenerator,
  SystemClock,
  UuidGenerator,
  assertPositive,
  calculateAmounts,
  money,
} from "../shared/utils";
import type {
  Product,
  Customer,
  User,
  Quotation,
  Receipt,
} from "../shared/types";

const clock = () => new FixedClock("2025-01-01T00:00:00.000Z");
const product = (id = "p1", stock = 10, active = true): Product => ({
  id,
  sku: id,
  name: `Product ${id}`,
  description: "",
  price: 100,
  stock,
  active,
  createdAt: "x",
  updatedAt: "x",
});
const customer = (id = "c1", active = true): Customer => ({
  id,
  documentType: "DNI",
  documentNumber: id === "c1" ? "12345678" : "87654321",
  name: "Customer",
  active,
  createdAt: "x",
  updatedAt: "x",
});
const ids = (...x: string[]) => new FixedIdGenerator(x);
function setup() {
  const pr = new InMemoryRepository([product()]);
  const cr = new InMemoryRepository([customer()]);
  const qr = new InMemoryRepository<Quotation>();
  const rr = new InMemoryRepository<Receipt>();
  const ps = new ProductService(pr, clock(), ids("p2"), () => false);
  const qs = new QuotationService(qr, pr, cr, clock(), ids("q1"));
  const rs = new ReceiptService(rr, ps, cr, qr, clock(), ids("r1"));
  return { pr, cr, qr, rr, ps, qs, rs };
}

describe("utilities and repositories", () => {
  it("rounds and calculates", () => {
    expect(money(1.005)).toBe(1.01);
    expect(calculateAmounts([{ quantity: 2, unitPrice: 10 }], 3)).toEqual({
      subtotal: 20,
      discount: 3,
      tax: 3.06,
      total: 20.06,
    });
    expect(calculateAmounts([], -2)).toEqual({
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
    });
    expect(() => assertPositive(0, "x")).toThrow();
    expect(() => assertPositive(Number.NaN, "x")).toThrow();
    expect(new FixedClock("x").now()).toBe("x");
    expect(new SystemClock().now()).toMatch(/T/);
    expect(new UuidGenerator().next()).toMatch(/-/);
    const f = new FixedIdGenerator(["x"]);
    expect(f.next()).toBe("x");
    expect(() => f.next()).toThrow();
  });
  it("repository CRUD and errors", () => {
    const r = new InMemoryRepository([{ id: "1", v: 1 }]);
    expect(r.list()).toHaveLength(1);
    expect(r.get("x")).toBeUndefined();
    expect(r.update("1", { id: "x", v: 2 })).toEqual({ id: "1", v: 2 });
    expect(() => r.create({ id: "1", v: 3 })).toThrow();
    expect(() => r.update("z", { id: "z", v: 1 })).toThrow();
    expect(() => r.delete("z")).toThrow();
    r.delete("1");
    expect(r.list()).toHaveLength(0);
  });
});
describe("auth", () => {
  it("logs in and out", () => {
    const a = new AuthService(
      new InMemoryRepository<User>([
        { id: "u", email: "a", password: "b", name: "A" },
      ]),
    );
    expect(a.login("a", "b").name).toBe("A");
    expect(a.session()?.email).toBe("a");
    a.logout();
    expect(a.session()).toBeUndefined();
    expect(() => a.login("a", "x")).toThrow();
    expect(() => a.login("x", "b")).toThrow();
  });
});
describe("products", () => {
  it("validates, creates, updates and deactivates", () => {
    const { ps } = setup();
    expect(() =>
      ps.create({ sku: "", name: "x", description: "", price: 1, stock: 1 }),
    ).toThrow();
    expect(() =>
      ps.create({ sku: "x", name: "", description: "", price: 1, stock: 1 }),
    ).toThrow();
    expect(() =>
      ps.create({ sku: "x", name: "x", description: "", price: 0, stock: 1 }),
    ).toThrow();
    expect(() =>
      ps.create({ sku: "x", name: "x", description: "", price: 1, stock: -1 }),
    ).toThrow();
    const p = ps.create({
      sku: "x",
      name: "x",
      description: "",
      price: 1,
      stock: 1,
    });
    expect(ps.update(p.id, { name: "y" }).name).toBe("y");
    expect(() => ps.update(p.id, { sku: "p1" })).toThrow();
    expect(ps.deactivate(p.id).active).toBe(false);
    expect(() => ps.adjustStock(p.id, -2)).toThrow();
    ps.remove(p.id);
    expect(() => ps.get(p.id)).toThrow();
  });
});
describe("customers", () => {
  it("validates and manages customers", () => {
    const { cs } = (() => {
      const r = new InMemoryRepository([customer()]);
      return { cs: new CustomerService(r, clock(), ids("c2"), () => false) };
    })();
    expect(() =>
      cs.create({ documentType: "DNI", documentNumber: "1", name: "x" }),
    ).toThrow();
    expect(() =>
      cs.create({
        documentType: "RUC",
        documentNumber: "12345678901",
        name: "x",
        email: "bad",
      }),
    ).toThrow();
    expect(() =>
      cs.create({ documentType: "DNI", documentNumber: "12345678", name: "x" }),
    ).toThrow();
    const c = cs.create({
      documentType: "RUC",
      documentNumber: "20123456789",
      name: "X",
      email: "x@y.com",
    });
    expect(cs.update(c.id, { name: "Y" }).name).toBe("Y");
    expect(cs.deactivate(c.id).active).toBe(false);
    cs.remove(c.id);
  });
});
describe("quotations and receipts", () => {
  it("enforces workflow and atomic stock", () => {
    const { qs, rs } = setup();
    expect(() =>
      qs.create({
        number: "Q1",
        customerId: "x",
        items: [],
        validUntil: "2026",
      }),
    ).toThrow();
    expect(() =>
      qs.create({
        number: "Q1",
        customerId: "c1",
        items: [{ productId: "x", quantity: 1 }],
        validUntil: "2026",
      }),
    ).toThrow();
    expect(() =>
      qs.create({
        number: "Q1",
        customerId: "c1",
        items: [{ productId: "p1", quantity: 0 }],
        validUntil: "2026",
      }),
    ).toThrow();
    const q = qs.create({
      number: "Q1",
      customerId: "c1",
      items: [{ productId: "p1", quantity: 2 }],
      discount: 5,
      validUntil: "2026",
    });
    expect(q.total).toBe(230.1);
    expect(() => qs.transition(q.id, "ACCEPTED")).toThrow();
    expect(qs.transition(q.id, "ISSUED").status).toBe("ISSUED");
    expect(qs.transition(q.id, "ACCEPTED").status).toBe("ACCEPTED");
    expect(() => qs.update(q.id, { discount: 1 })).toThrow();
    const r = rs.create({
      number: "R1",
      customerId: "c1",
      quotationId: q.id,
      items: q.items,
    });
    expect(() =>
      rs.create({
        number: "R2",
        customerId: "c1",
        quotationId: q.id,
        items: q.items,
      }),
    ).toThrow();
    expect(rs.emit(r.id).status).toBe("ISSUED");
    expect(rs.cancel(r.id).status).toBe("CANCELLED");
    expect(() => rs.emit(r.id)).toThrow();
    expect(() => rs.cancel(r.id)).toThrow();
  });
  it("rejects invalid receipts and insufficient stock", () => {
    const { rs } = setup();
    expect(() =>
      rs.create({
        number: "R1",
        customerId: "c1",
        items: [{ productId: "p1", quantity: 20 }],
      }),
    ).not.toThrow();
    expect(() => rs.emit("r1")).toThrow();
    expect(() =>
      rs.create({ number: "R1", customerId: "c1", items: [] }),
    ).toThrow();
  });
});
