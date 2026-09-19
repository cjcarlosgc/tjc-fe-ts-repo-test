import type { Product } from "../../../shared/types";
export function ProductsPage({ products }: { products: Product[] }) {
  return (
    <section>
      <h2>Productos</h2>
      <p>{products.length} productos registrados</p>
    </section>
  );
}
