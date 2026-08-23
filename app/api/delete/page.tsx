"use client";

import { useEffect, useState } from "react";

interface ProductDocument {
  _id: string;
  _product: {
    Name: string;
    Price: number;
    ImageLink: string;
  };
}

export default function DeletarProdutosPage() {
  const [products, setProducts] = useState<ProductDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingProduct, setDeletingProduct] = useState<ProductDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Busca os produtos
  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/produtos");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Abre o modal de confirmação de exclusão
  const handleDeleteClick = (product: ProductDocument) => {
    setDeletingProduct(product);
  };

  // Executa a requisição DELETE
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/produtos?id=${deletingProduct._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Produto deletado com sucesso!");
        setDeletingProduct(null);
        fetchProducts(); // Recarrega a lista sem atualizar a página
      } else {
        alert("Erro ao deletar o produto.");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro de conexão com o servidor.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-white">Carregando...</div>;

  return (
    <div className="container mx-auto p-7">
      <h1 className="text-3xl font-bold mb-8 text-red-900 border-b pb-4">
        Deletar Produtos
      </h1>

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((item) => (
          <div
            key={item._id}
            className="bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="aspect-square w-full bg-gray-100 overflow-hidden">
                <img
                  src={
                    item._product?.ImageLink ||
                    "https://via.placeholder.com/300?text=Sem+Imagem"
                  }
                  alt={item._product?.Name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-800">
                  {item._product?.Name}
                </h3>
              </div>
            </div>

            {/* Botão para abrir o modal de exclusão */}
            <div className="p-4 pt-0">
              <button
                onClick={() => handleDeleteClick(item)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition-colors"
              >
                Deletar Produto
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE DELEÇÃO */}
      {deletingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-2 text-gray-800">
              Confirmar Exclusão
            </h2>

            <p className="text-gray-600 mb-6">
              Tem certeza que deseja deletar o produto{" "}
              <strong className="text-gray-900">
                "{deletingProduct._product?.Name}"
              </strong>
              ? Esta ação não poderá ser desfeita.
            </p>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                {isDeleting ? "Deletando..." : "Confirmar Deleção"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}