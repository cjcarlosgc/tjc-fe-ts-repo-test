import type { Customer } from "../../../shared/types";
export function CustomerTable({ customers }: { customers: Customer[] }) {
  return (
    <table className="table">
      <tbody>
        {customers.map((customer) => (
          <tr key={customer.id}>
            <td>{customer.documentNumber}</td>
            <td>{customer.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
