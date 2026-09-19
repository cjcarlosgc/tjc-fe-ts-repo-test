/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import users from "./data/users.json";
import productsSeed from "./data/products.json";
import customersSeed from "./data/customers.json";
import type {
  User,
  Product,
  Customer,
  Quotation,
  Receipt,
} from "./shared/types";
import { InMemoryRepository } from "./modules/repositories";
import {
  AuthService,
  ProductService,
  CustomerService,
  QuotationService,
  ReceiptService,
} from "./modules/services";
import { SystemClock, UuidGenerator } from "./shared/utils";
import { Button } from "./shared/ui/Button";
import { Input } from "./shared/ui/Input";
import { Label } from "./shared/ui/Label";
import { Card } from "./shared/ui/Card";
import "./index.css";

function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const auth = useMemo(
    () => new AuthService(new InMemoryRepository(users as User[])),
    [],
  );
  const [email, setEmail] = useState("admin@minierp.local");
  const [password, setPassword] = useState("Admin123*");
  const [error, setError] = useState("");
  return (
    <Card className="login">
      <h1>MiniERP</h1>
      <p className="muted">Gestión comercial</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          try {
            onLogin(auth.login(email, password));
          } catch (err) {
            setError(err instanceof Error ? err.message : "Error");
          }
        }}
      >
        <Label>
          Email
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Label>
        <Label>
          Contraseña
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Label>
        <Button type="submit">Ingresar</Button>
        {error && <p className="danger">{error}</p>}
      </form>
    </Card>
  );
}

function ProductPage({
  service,
  refresh,
}: {
  service: ProductService;
  refresh: () => void;
}) {
  const [form, setForm] = useState<{
    sku: string;
    name: string;
    description: string;
    price: string;
    stock: string;
  }>({
    sku: "",
    name: "",
    description: "",
    price: "",
    stock: "",
  });
  const [error, setError] = useState("");
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    try {
      service.create({
        sku: form.sku,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
      });
      setForm({ sku: "", name: "", description: "", price: "", stock: "" });
      setError("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };
  return (
    <>
      <h2>Productos</h2>
      <div className="split">
        <Card>
          <h3>Nuevo producto</h3>
          <form onSubmit={save}>
            <Label>
              SKU
              <Input
                value={form.sku}
                onChange={(e) =>
                  setForm({ ...form, sku: e.target.value.toUpperCase() })
                }
                required
              />
            </Label>
            <Label>
              Nombre
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Label>
            <Label>
              Descripción
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </Label>
            <Label>
              Precio
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </Label>
            <Label>
              Stock inicial
              <Input
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                required
              />
            </Label>
            <Button type="submit">Crear producto</Button>
            {error && <p className="danger">{error}</p>}
          </form>
        </Card>
        <Card>
          <h3>Catálogo</h3>
          <table className="table">
            <tbody>
              {service.list().map((product) => (
                <tr key={product.id}>
                  <td>
                    {product.sku}
                    <br />
                    <small>{product.name}</small>
                  </td>
                  <td>S/ {product.price.toFixed(2)}</td>
                  <td>{product.stock}</td>
                  <td>{product.active ? "Activo" : "Inactivo"}</td>
                  <td>
                    {product.active && (
                      <Button
                        onClick={() => {
                          service.deactivate(product.id);
                          refresh();
                        }}
                      >
                        Desactivar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}

function CustomerPage({
  service,
  refresh,
}: {
  service: CustomerService;
  refresh: () => void;
}) {
  const [form, setForm] = useState<{
    documentType: "DNI" | "RUC";
    documentNumber: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  }>({
    documentType: "DNI" as const,
    documentNumber: "",
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [error, setError] = useState("");
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    try {
      service.create(form);
      setForm({
        documentType: "DNI",
        documentNumber: "",
        name: "",
        email: "",
        phone: "",
        address: "",
      });
      setError("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };
  return (
    <>
      <h2>Clientes</h2>
      <div className="split">
        <Card>
          <h3>Nuevo cliente</h3>
          <form onSubmit={save}>
            <Label>
              Tipo
              <select
                value={form.documentType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    documentType: e.target.value as "DNI" | "RUC",
                  })
                }
              >
                <option>DNI</option>
                <option>RUC</option>
              </select>
            </Label>
            <Label>
              Documento
              <Input
                value={form.documentNumber}
                onChange={(e) =>
                  setForm({
                    ...form,
                    documentNumber: e.target.value.replace(/\D/g, ""),
                  })
                }
                required
              />
            </Label>
            <Label>
              Nombre
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Label>
            <Label>
              Email
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Label>
            <Label>
              Teléfono
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Label>
            <Label>
              Dirección
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Label>
            <Button type="submit">Crear cliente</Button>
            {error && <p className="danger">{error}</p>}
          </form>
        </Card>
        <Card>
          <h3>Directorio</h3>
          <table className="table">
            <tbody>
              {service.list().map((customer) => (
                <tr key={customer.id}>
                  <td>
                    {customer.documentType} {customer.documentNumber}
                  </td>
                  <td>
                    {customer.name}
                    <br />
                    <small>{customer.email}</small>
                  </td>
                  <td>{customer.active ? "Activo" : "Inactivo"}</td>
                  <td>
                    {customer.active && (
                      <Button
                        onClick={() => {
                          service.deactivate(customer.id);
                          refresh();
                        }}
                      >
                        Desactivar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}

function QuotationsPage({
  service,
  customers,
  products,
  refresh,
}: {
  service: QuotationService;
  customers: Customer[];
  products: Product[];
  refresh: () => void;
}) {
  const [number, setNumber] = useState("COT-001");
  const [customerId, setCustomerId] = useState(
    customers.find((c) => c.active)?.id ?? "",
  );
  const [productId, setProductId] = useState(
    products.find((p) => p.active)?.id ?? "",
  );
  const [quantity, setQuantity] = useState("1");
  const [discount, setDiscount] = useState("0");
  const [validUntil, setValidUntil] = useState("2026-12-31");
  const [error, setError] = useState("");
  const create = (event: React.FormEvent) => {
    event.preventDefault();
    try {
      service.create({
        number,
        customerId,
        items: [{ productId, quantity: Number(quantity) }],
        discount: Number(discount),
        validUntil,
      });
      setError("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };
  return (
    <>
      <h2>Cotizaciones</h2>
      <Card>
        <form className="inline-form" onSubmit={create}>
          <Label>
            Número
            <Input value={number} onChange={(e) => setNumber(e.target.value)} />
          </Label>
          <Label>
            Cliente
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              {customers
                .filter((c) => c.active)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </Label>
          <Label>
            Producto
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              {products
                .filter((p) => p.active)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </Label>
          <Label>
            Cantidad
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </Label>
          <Label>
            Descuento
            <Input
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </Label>
          <Label>
            Válida hasta
            <Input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </Label>
          <Button type="submit">Crear borrador</Button>
        </form>
        {error && <p className="danger">{error}</p>}
      </Card>
      <Card>
        <table className="table">
          <tbody>
            {service.list().map((quotation) => (
              <tr key={quotation.id}>
                <td>{quotation.number}</td>
                <td>{quotation.status}</td>
                <td>S/ {quotation.total.toFixed(2)}</td>
                <td>
                  {quotation.status === "DRAFT" && (
                    <Button
                      onClick={() => {
                        service.transition(quotation.id, "ISSUED");
                        refresh();
                      }}
                    >
                      Emitir
                    </Button>
                  )}
                  {quotation.status === "ISSUED" && (
                    <>
                      <Button
                        onClick={() => {
                          service.transition(quotation.id, "ACCEPTED");
                          refresh();
                        }}
                      >
                        Aceptar
                      </Button>
                      <Button
                        onClick={() => {
                          service.transition(quotation.id, "REJECTED");
                          refresh();
                        }}
                      >
                        Rechazar
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function ReceiptsPage({
  service,
  quotations,
  refresh,
}: {
  service: ReceiptService;
  quotations: Quotation[];
  refresh: () => void;
}) {
  const [number, setNumber] = useState("BOL-001");
  const [quotationId, setQuotationId] = useState(
    quotations.find((q) => q.status === "ACCEPTED")?.id ?? "",
  );
  const [error, setError] = useState("");
  const create = (event: React.FormEvent) => {
    event.preventDefault();
    const quotation = quotations.find((q) => q.id === quotationId);
    if (!quotation) return;
    try {
      service.create({
        number,
        customerId: quotation.customerId,
        quotationId,
        items: quotation.items,
      });
      setError("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };
  return (
    <>
      <h2>Boletas</h2>
      <Card>
        <form className="inline-form" onSubmit={create}>
          <Label>
            Número
            <Input value={number} onChange={(e) => setNumber(e.target.value)} />
          </Label>
          <Label>
            Cotización aceptada
            <select
              value={quotationId}
              onChange={(e) => setQuotationId(e.target.value)}
            >
              {quotations
                .filter((q) => q.status === "ACCEPTED")
                .map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.number}
                  </option>
                ))}
            </select>
          </Label>
          <Button type="submit">Crear boleta</Button>
        </form>
        {error && <p className="danger">{error}</p>}
      </Card>
      <Card>
        <table className="table">
          <tbody>
            {service.list().map((receipt) => (
              <tr key={receipt.id}>
                <td>{receipt.number}</td>
                <td>{receipt.status}</td>
                <td>S/ {receipt.total.toFixed(2)}</td>
                <td>
                  {receipt.status === "DRAFT" && (
                    <Button
                      onClick={() => {
                        service.emit(receipt.id);
                        refresh();
                      }}
                    >
                      Emitir
                    </Button>
                  )}
                  {receipt.status === "ISSUED" && (
                    <Button
                      onClick={() => {
                        service.cancel(receipt.id);
                        refresh();
                      }}
                    >
                      Anular
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function App({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [, update] = useState(0);
  const refresh = () => update((value) => value + 1);
  const productsRepo = useMemo(
    () => new InMemoryRepository(productsSeed as Product[]),
    [],
  );
  const customersRepo = useMemo(
    () => new InMemoryRepository(customersSeed as Customer[]),
    [],
  );
  const quotationsRepo = useMemo(() => new InMemoryRepository<Quotation>(), []);
  const receiptsRepo = useMemo(() => new InMemoryRepository<Receipt>(), []);
  const clock = useMemo(() => new SystemClock(), []);
  const ids = useMemo(() => new UuidGenerator(), []);
  const productService = useMemo(
    () =>
      new ProductService(productsRepo, clock, ids, (id) =>
        quotationsRepo
          .list()
          .some((q) => q.items.some((item) => item.productId === id)),
      ),
    [productsRepo, clock, ids, quotationsRepo],
  );
  const customerService = useMemo(
    () =>
      new CustomerService(customersRepo, clock, ids, (id) =>
        quotationsRepo.list().some((q) => q.customerId === id),
      ),
    [customersRepo, clock, ids, quotationsRepo],
  );
  const quotationService = useMemo(
    () =>
      new QuotationService(
        quotationsRepo,
        productsRepo,
        customersRepo,
        clock,
        ids,
      ),
    [quotationsRepo, productsRepo, customersRepo, clock, ids],
  );
  const receiptService = useMemo(
    () =>
      new ReceiptService(
        receiptsRepo,
        productService,
        customersRepo,
        quotationsRepo,
        clock,
        ids,
      ),
    [receiptsRepo, productService, customersRepo, quotationsRepo, clock, ids],
  );
  const [page, setPage] = useState("Dashboard");
  const products = productService.list();
  const customers = customerService.list();
  return (
    <div className="shell">
      <aside className="sidebar">
        <h1>MiniERP</h1>
        <p className="muted">{user.name}</p>
        {["Dashboard", "Productos", "Clientes", "Cotizaciones", "Boletas"].map(
          (item) => (
            <Button key={item} onClick={() => setPage(item)}>
              {item}
            </Button>
          ),
        )}
        <Button onClick={onLogout}>Cerrar sesión</Button>
      </aside>
      <main className="main">
        {page === "Dashboard" && (
          <>
            <h2>Dashboard</h2>
            <div className="grid">
              <Card>
                <h3>Productos</h3>
                <strong>{products.length}</strong>
              </Card>
              <Card>
                <h3>Clientes</h3>
                <strong>{customers.length}</strong>
              </Card>
              <Card>
                <h3>Cotizaciones</h3>
                <strong>{quotationService.list().length}</strong>
              </Card>
              <Card>
                <h3>Boletas emitidas</h3>
                <strong>
                  {
                    receiptService.list().filter((r) => r.status === "ISSUED")
                      .length
                  }
                </strong>
              </Card>
            </div>
          </>
        )}
        {page === "Productos" && (
          <ProductPage service={productService} refresh={refresh} />
        )}
        {page === "Clientes" && (
          <CustomerPage service={customerService} refresh={refresh} />
        )}
        {page === "Cotizaciones" && (
          <QuotationsPage
            service={quotationService}
            customers={customers}
            products={products}
            refresh={refresh}
          />
        )}
        {page === "Boletas" && (
          <ReceiptsPage
            service={receiptService}
            quotations={quotationService.list()}
            refresh={refresh}
          />
        )}
      </main>
    </div>
  );
}
function Root() {
  const [user, setUser] = useState<User>();
  return user ? (
    <App user={user} onLogout={() => setUser(undefined)} />
  ) : (
    <Login onLogin={setUser} />
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
