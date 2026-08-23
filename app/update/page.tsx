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

export default function AtualizarProdutosPage() {
  const [products, setProducts] = useState<ProductDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<ProductDocument | null>(null);
  const [formData, setFormData] = useState({
    Name: "",
    Price: "",
    ImageLink: "",
  });

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

  // Abre o modal e preenche com os dados atuais do produto
  const handleEditClick = (product: ProductDocument) => {
    setEditingProduct(product);
    setFormData({
      Name: product._product?.Name || "",
      Price: String(product._product?.Price || 0),
      ImageLink: product._product?.ImageLink || "",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Envia as alterações para a rota PUT (/api/browse)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const res = await fetch("/api/produtos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingProduct._id,
          Name: formData.Name,
          Price: Number(formData.Price),
          ImageLink: formData.ImageLink,
        }),
      });

      if (res.ok) {
        alert("Produto atualizado com sucesso!");
        setEditingProduct(null);
        fetchProducts(); // Recarrega a lista sem atualizar a página
      } else {
        alert("Erro ao atualizar o produto.");
      }
    } catch (error) {
      console.error("Erro:", error);
    }
  };

  if (loading) return <div className="p-6 text-center">Carregando...</div>;

  return (
    <div className="container mx-auto p-7">
      <h1 className="text-3xl font-bold mb-8 text-cyan-900 border-b pb-4">
        Atualizar Produtos
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
                  src={item._product?.ImageLink || "https://via.placeholder.com/300?text=Sem+Imagem"}
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

            {/* Botão para abrir o modal de edição */}
            <div className="p-4 pt-0">
              <button
                onClick={() => handleEditClick(item)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 rounded-lg transition-colors"
              >
                Editar Produto
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE EDIÇÃO */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Editar Produto
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  name="Name"
                  value={formData.Name}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full p-2 border rounded text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Preço</label>
                <div className="relative mt-1">
                  {/* Símbolo R$ Fixo */}
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 font-semibold pointer-events-none select-none">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    name="Price"
                    placeholder="0,00"
                    value={formData.Price}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-3 py-2 border rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Link da Imagem</label>
                <input
                  type="url"
                  name="ImageLink"
                  value={formData.ImageLink}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border rounded text-black"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}