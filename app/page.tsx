import ProductListProps from "@/components/TesteList"; // ou o caminho/nome onde você salvou o componente de produtos

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <ProductListProps
        endpoint="/api/produtos" // Ou a rota da sua API (ex: /api/products)
        title="Todos os Produtos"
      />
    </main>
  );
}