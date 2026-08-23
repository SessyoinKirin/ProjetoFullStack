// app/historico/page.tsx
"use client";

import { useEffect, useState } from "react";

interface ProductDocument {
  _id: string;
  _product: {
    Name: string;
    Price: number;
    HistoricMoney?: number;
    HistoricDebit?: number;
    HistoricCredit?: number;
    ImageLink: string;
  };
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default function HistoricoPage() {
  const [products, setProducts] = useState<ProductDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProducts() {
      try {
        const response = await fetch("/api/produtos");
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.error("Erro ao buscar histórico:", error);
      } finally {
        setLoading(false);
      }
    }
    getProducts();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-medium">Carregando histórico...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-yellow-900 border-b pb-4">
        Histórico Geral de Vendas
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((item) => {
          const {
            Name,
            Price = 0,
            HistoricMoney = 0,
            HistoricDebit = 0,
            HistoricCredit = 0,
            ImageLink,
          } = item._product || {};

          const totalUnits = HistoricMoney + HistoricDebit + HistoricCredit;
          const totalRevenue = totalUnits * Price;

          return (
            <div
              key={item._id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Imagem do Produto */}
                <div className="aspect-square w-full bg-gray-50 relative overflow-hidden">
                  <img
                    src={ImageLink || "https://via.placeholder.com/300?text=Sem+Imagem"}
                    alt={Name || "Produto"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/300?text=Erro+Imagem";
                    }}
                  />
                </div>

                {/* Nome e Preço */}
                <div className="p-4 text-center border-b">
                  <h2 className="font-bold text-lg text-gray-800 line-clamp-1">{Name || "Sem Nome"}</h2>
                  <p className="text-sm text-gray-500">Unidade: {formatCurrency(Price)}</p>
                </div>
              </div>

              {/* Valores de Histórico */}
              <div className="p-4 space-y-2 bg-gray-50/50">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Dinheiro:</span>
                  <span className="font-semibold text-gray-800">{HistoricMoney} un.</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Débito:</span>
                  <span className="font-semibold text-gray-800">{HistoricDebit} un.</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Crédito:</span>
                  <span className="font-semibold text-gray-800">{HistoricCredit} un.</span>
                </div>

                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700">Total Vendido:</span>
                    <span className="font-bold text-emerald-700">{totalUnits} un.</span>
                  </div>
                  <div className="flex justify-between items-center text-base mt-1">
                    <span className="font-bold text-gray-900">Faturamento:</span>
                    <span className="font-extrabold text-emerald-800">{formatCurrency(totalRevenue)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}