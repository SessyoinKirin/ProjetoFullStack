"use client";

import { useEffect, useState } from "react";

interface ProductDocument {
  _id: string;
  _product: {
    Name: string;
    Price: number;
    MoneyQuantity?: number;
    DebitQuantity?: number;
    CreditQuantity?: number;
    HistoricMoney?: number;
    HistoricDebit?: number;
    HistoricCredit?: number;
    ImageLink: string;
  };
}

interface ProductProps {
  product: ProductDocument;
}

// Função auxiliar para formatar moeda (R$)
const formatCurrency = (value: number | undefined) => {
  if (value === undefined || isNaN(value)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// Componente individual do Card
const ProductCard = ({ product }: ProductProps) => {
  const {
    Name,
    Price,
    MoneyQuantity = 0,
    DebitQuantity = 0,
    CreditQuantity = 0,
    HistoricMoney = 0,
    HistoricDebit = 0,
    HistoricCredit = 0,
    ImageLink,
  } = product._product || {};

  // Estados locais para cada tipo de pagamento
  const [moneyQty, setMoneyQty] = useState(MoneyQuantity);
  const [debitQty, setDebitQty] = useState(DebitQuantity);
  const [creditQty, setCreditQty] = useState(CreditQuantity);
  const [historicMoneyQty, setHistoricMoneyQty] = useState(HistoricMoney);
  const [historicDebitQty, setHistoricDebitQty] = useState(HistoricDebit);
  const [historicCreditQty, setHistoricCreditQty] = useState(HistoricCredit);

  const [loading, setLoading] = useState(false);

  // Sincroniza o estado caso as props mudem
  useEffect(() => {
    setMoneyQty(MoneyQuantity ?? 0);
    setDebitQty(DebitQuantity ?? 0);
    setCreditQty(CreditQuantity ?? 0);
    setHistoricMoneyQty(HistoricMoney ?? 0);
    setHistoricDebitQty(HistoricDebit ?? 0);
    setHistoricCreditQty(HistoricCredit ?? 0);
  }, [MoneyQuantity, DebitQuantity, CreditQuantity, HistoricMoney, HistoricDebit, HistoricCredit]);

  // Função única para atualizar quantidade e histórico juntos de uma vez só
  const handlePaymentChange = async (
    type: "Money" | "Debit" | "Credit",
    delta: number
  ) => {
    let newMoney = moneyQty;
    let newDebit = debitQty;
    let newCredit = creditQty;
    let newHistMoney = historicMoneyQty;
    let newHistDebit = historicDebitQty;
    let newHistCredit = historicCreditQty;

    if (type === "Money") {
      newMoney = Math.max(0, moneyQty + delta);
      newHistMoney = Math.max(0, historicMoneyQty + delta);
    } else if (type === "Debit") {
      newDebit = Math.max(0, debitQty + delta);
      newHistDebit = Math.max(0, historicDebitQty + delta);
    } else if (type === "Credit") {
      newCredit = Math.max(0, creditQty + delta);
      newHistCredit = Math.max(0, historicCreditQty + delta);
    }

    // Atualização otimista do estado local
    setMoneyQty(newMoney);
    setDebitQty(newDebit);
    setCreditQty(newCredit);
    setHistoricMoneyQty(newHistMoney);
    setHistoricDebitQty(newHistDebit);
    setHistoricCreditQty(newHistCredit);

    setLoading(true);

    try {
      const response = await fetch("/api/produtos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product._id,
          Name,
          Price,
          MoneyQuantity: newMoney,
          DebitQuantity: newDebit,
          CreditQuantity: newCredit,
          HistoricMoney: newHistMoney,
          HistoricDebit: newHistDebit,
          HistoricCredit: newHistCredit,
          ImageLink,
        }),
      });

      if (!response.ok) {
        // Reverte se falhar
        setMoneyQty(moneyQty);
        setDebitQty(debitQty);
        setCreditQty(creditQty);
        setHistoricMoneyQty(historicMoneyQty);
        setHistoricDebitQty(historicDebitQty);
        setHistoricCreditQty(historicCreditQty);
        console.error("Erro ao atualizar no servidor");
      }
    } catch (error) {
      setMoneyQty(moneyQty);
      setDebitQty(debitQty);
      setCreditQty(creditQty);
      setHistoricMoneyQty(historicMoneyQty);
      setHistoricDebitQty(historicDebitQty);
      setHistoricCreditQty(historicCreditQty);
      console.error("Erro na requisição:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        {/* Imagem Quadrada em cima */}
        <div className="aspect-square w-full bg-gray-100 relative overflow-hidden">
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

        {/* Nome e Preço CENTRALIZADOS */}
        <div className="p-4 text-center">
          <h4 className="font-semibold text-lg text-gray-800 line-clamp-1">
            {Name || "Sem Nome"}
          </h4>
        </div>
      </div>

      {/* Seções de Botões e Quantidades */}
      <div className="p-4 pt-0 space-y-3">
        {/* --- DINHEIRO --- */}
        <div className="border-t pt-2">
          <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
            <span>Dinheiro:</span>
            <span className="font-semibold text-gray-800">{moneyQty} un.</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePaymentChange("Money", -1)}
              disabled={loading || moneyQty <= 0}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-1 rounded text-sm transition-colors text-center"
            >
              -1
            </button>
            <button
              onClick={() => handlePaymentChange("Money", 1)}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold py-1 rounded text-sm transition-colors text-center"
            >
              +1
            </button>
          </div>
        </div>

        {/* --- DÉBITO --- */}
        <div className="border-t pt-2">
          <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
            <span>Débito:</span>
            <span className="font-semibold text-gray-800">{debitQty} un.</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePaymentChange("Debit", -1)}
              disabled={loading || debitQty <= 0}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-1 rounded text-sm transition-colors text-center"
            >
              -1
            </button>
            <button
              onClick={() => handlePaymentChange("Debit", 1)}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold py-1 rounded text-sm transition-colors text-center"
            >
              +1
            </button>
          </div>
        </div>

        {/* --- CRÉDITO --- */}
        <div className="border-t pt-2">
          <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
            <span>Crédito:</span>
            <span className="font-semibold text-gray-800">{creditQty} un.</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePaymentChange("Credit", -1)}
              disabled={loading || creditQty <= 0}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-1 rounded text-sm transition-colors text-center"
            >
              -1
            </button>
            <button
              onClick={() => handlePaymentChange("Credit", 1)}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold py-1 rounded text-sm transition-colors text-center"
            >
              +1
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ProductListProps {
  endpoint: string;
  title: string;
}

export default function ProductList({ endpoint, title }: ProductListProps) {
  const [products, setProducts] = useState<ProductDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProducts() {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          console.error(`An error occurred: ${response.statusText}`);
          return;
        }
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    }
    getProducts();
  }, [endpoint]);

  if (loading) {
    return <div className="p-4 text-center">Carregando produtos...</div>;
  }

  return (
    <div className="container pt-1 p-7">
      <h1 className="text-3xl font-bold mb-8 text-emerald-900 border-b pb-4">{title}</h1>

      {/* Grid Responsivo de Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((item) => (
          <ProductCard product={item} key={item._id} />
        ))}
      </div>
    </div>
  );
}