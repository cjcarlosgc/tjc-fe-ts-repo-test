import type { Customer } from "../../../shared/types";
export function CustomersPage({ customers }: { customers: Customer[] }) {
  return (
    <section>
      <h2>Clientes</h2>
      <p>{customers.length} clientes registrados</p>
    </section>
  );
}
