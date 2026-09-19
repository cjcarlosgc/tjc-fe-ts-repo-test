import type { Product } from "../../../shared/types";
export function ProductTable({ products }: { products: Product[] }) {
  return (
    <table className="table">
      <tbody>
        {products.map((product) => (
          <tr key={product.id}>
            <td>{product.sku}</td>
            <td>{product.name}</td>
            <td>{product.stock}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
