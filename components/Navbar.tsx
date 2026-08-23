"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  
  // Controle do menu mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modal de Relatório
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({ Name: "", Price: "", ImageLink: "" });
  const [userData, setUserData] = useState({ email: "", password: "" });

  // Pega a data atual no formato YYYY-MM-DD para bloquear datas futuras no input date
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      setIsAuthenticated(res.ok);
    } catch {
      setIsAuthenticated(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setIsAuthenticated(false);
        setIsLogoutModalOpen(false);
        setIsMobileMenuOpen(false);
        router.push("/");
        router.refresh();
      } else {
        alert("Erro ao encerrar a sessão.");
      }
    } catch {
      alert("Erro ao conectar com o servidor.");
    }
  };

  const handleResetStock = async () => {
    if (!window.confirm("Tem certeza que deseja zerar o estoque de TODOS os produtos?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/produtos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_stock" }),
      });
      if (res.ok) {
        alert("Estoque zerado com sucesso!");
        window.location.reload();
      } else {
        alert("Erro ao zerar o estoque.");
      }
    } catch {
      alert("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetHistory = async () => {
    if (!window.confirm("Tem certeza que deseja arquivar as estatísticas (com vendas) e zerar o histórico de TODOS os produtos?")) return;
    setLoading(true);

    try {
      const resProdutos = await fetch("/api/produtos");
      if (!resProdutos.ok) throw new Error("Erro ao buscar produtos.");
      
      const documentos = await resProdutos.json();

      if (!Array.isArray(documentos) || documentos.length === 0) {
        alert("Nenhum produto encontrado.");
        setLoading(false);
        return;
      }

      let sucessos = 0;
      let itensComMovimentacao = 0;

      for (const doc of documentos) {
        const prod = doc._product;
        if (!prod || !prod.Name) continue;

        const money = prod.HistoricMoney || 0;
        const debit = prod.HistoricDebit || 0;
        const credit = prod.HistoricCredit || 0;

        if (money === 0 && debit === 0 && credit === 0) continue;

        itensComMovimentacao++;

        const resEstatistica = await fetch("/api/estatistica", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: doc._id ? String(doc._id) : null,
            Name: prod.Name,
            Price: prod.Price || 0,
            HistoricMoney: money,
            HistoricDebit: debit,
            HistoricCredit: credit,
          }),
        });

        if (resEstatistica.ok) {
          sucessos++;
        } else {
          const errJson = await resEstatistica.json();
          console.error(`Erro ao salvar estatística de ${prod.Name}:`, errJson);
        }
      }

      if (itensComMovimentacao > 0 && sucessos === 0) {
        alert("Falha ao salvar estatísticas no MongoDB! O histórico NÃO foi zerado.");
        setLoading(false);
        return;
      }

      const resReset = await fetch("/api/produtos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_history" }),
      });

      if (resReset.ok) {
        alert(`${sucessos} produto(s) com movimentação arquivado(s). Histórico zerado com sucesso!`);
        window.location.reload();
      } else {
        alert("Estatísticas salvas, mas ocorreu um erro ao zerar os contadores.");
      }
    } catch (error) {
      console.error("Erro no fluxo de reset:", error);
      alert("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert("Por favor, selecione as datas de início e fim.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/relatorio?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error("Erro ao buscar dados do relatório.");

      const dados = await res.json();

      if (!Array.isArray(dados) || dados.length === 0) {
        alert("Não existem informações gravadas no banco de dados dentro deste intervalo de datas.");
        setLoading(false);
        return;
      }

      const agrupadoPorDia: { [key: string]: typeof dados } = {};

      dados.forEach((item) => {
        const dataFormatada = item.zeradoEm
          ? item.zeradoEm.split(",")[0]
          : new Date(item.zeradoEmIso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
        
        if (!agrupadoPorDia[dataFormatada]) {
          agrupadoPorDia[dataFormatada] = [];
        }
        agrupadoPorDia[dataFormatada].push(item);
      });

      const excelRows: any[] = [];

      Object.keys(agrupadoPorDia).forEach((dia) => {
        const registrosDoDia = agrupadoPorDia[dia];

        const produtosConsolidados: {
          [chave: string]: {
            Name: string;
            Price: number;
            HistoricMoney: number;
            HistoricDebit: number;
            HistoricCredit: number;
          };
        } = {};

        registrosDoDia.forEach((item) => {
          const chave = item.productId || item.Name;

          if (!produtosConsolidados[chave]) {
            produtosConsolidados[chave] = {
              Name: item.Name,
              Price: item.Price || 0,
              HistoricMoney: 0,
              HistoricDebit: 0,
              HistoricCredit: 0,
            };
          }

          produtosConsolidados[chave].HistoricMoney += item.HistoricMoney || 0;
          produtosConsolidados[chave].HistoricDebit += item.HistoricDebit || 0;
          produtosConsolidados[chave].HistoricCredit += item.HistoricCredit || 0;
        });

        const listaProdutosDia = Object.values(produtosConsolidados);
        let faturamentoTotalDia = 0;

        listaProdutosDia.forEach((prod, index) => {
          const faturamentoProduto =
            (prod.HistoricMoney * prod.Price) +
            (prod.HistoricDebit * prod.Price) +
            (prod.HistoricCredit * prod.Price);

          faturamentoTotalDia += faturamentoProduto;

          excelRows.push({
            "Data": index === 0 ? dia : "",
            "Nome do Produto": prod.Name,
            "Preço (R$)": prod.Price,
            "Dinheiro (Qtd)": prod.HistoricMoney,
            "Débito (Qtd)": prod.HistoricDebit,
            "Crédito (Qtd)": prod.HistoricCredit,
            "Faturamento Total do Dia (R$)": "",
          });
        });

        const primeiraLinhaDoDiaIndex = excelRows.length - listaProdutosDia.length;
        excelRows[primeiraLinhaDoDiaIndex]["Faturamento Total do Dia (R$)"] = faturamentoTotalDia;
      });

      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório de Vendas");

      XLSX.writeFile(workbook, `Relatorio_Vendas_${startDate}_ate_${endDate}.xlsx`);
      setIsReportModalOpen(false);

    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert("Erro ao processar e gerar o arquivo de relatório.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Name: formData.Name,
          Price: Number(formData.Price) || 0,
          ImageLink: formData.ImageLink,
        }),
      });

      if (response.ok) {
        alert("Produto adicionado com sucesso!");
        setFormData({ Name: "", Price: "", ImageLink: "" });
        setIsOpen(false);
        window.location.reload();
      } else {
        alert("Erro ao adicionar o produto.");
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const result = await response.json();
      if (response.ok) {
        alert("Usuário cadastrado com sucesso! Agora faça o login.");
        setUserData({ email: "", password: "" });
        setIsUserModalOpen(false);
        setIsLoginModalOpen(true);
      } else {
        alert(result.error || "Erro ao cadastrar usuário.");
      }
    } catch {
      alert("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setIsLoginModalOpen(false);
        setUserData({ email: "", password: "" });
      } else {
        const result = await response.json();
        alert(result.error || "Erro ao realizar login.");
      }
    } catch {
      alert("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <nav className="bg-gray-800 p-4 relative z-40">
        <div className="container mx-auto flex justify-between items-center min-h-[40px]">
          {isAuthenticated ? (
            <>
              {/* LADO ESQUERDO: Mantido intocado */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsOpen(true)}
                  className="border border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors px-4 py-2 rounded font-medium"
                >
                  Adicionar Produtos
                </button>
              </div>

              {/* LADO DIREITO: Desktop (Links em linha) */}
              <div className="hidden lg:flex items-center space-x-4">
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                  Gerar Relatório
                </button>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                  Página Inicial
                </Link>
                <Link href="/api/historico" className="text-gray-300 hover:text-white transition-colors">
                  Histórico
                </Link>
                <Link href="/api/update" className="text-gray-300 hover:text-white transition-colors">
                  Atualizar Produtos
                </Link>
                <Link href="/api/delete" className="text-gray-300 hover:text-white transition-colors">
                  Deletar Produtos
                </Link>
                <button
                  onClick={() => setIsResetModalOpen(true)}
                  className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                  Opções de Zerar
                </button>

                <button
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-full transition-colors flex items-center justify-center ml-2"
                  title="Encerrar Sessão"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </button>
              </div>

              {/* LADO DIREITO: Botão Hambúrguer (Apenas telas menores) */}
              <div className="flex lg:hidden items-center">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none"
                  aria-label="Abrir Menu"
                >
                  {!isMobileMenuOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex justify-between w-full items-center">
              <span className="text-gray-300 font-bold text-lg">Sistema de Produtos</span>
              <div className="space-x-3">
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="border border-gray-500 text-gray-200 hover:border-white hover:text-white transition-colors px-4 py-2 rounded font-medium"
                >
                  Login
                </button>
              </div>
            </div>
          )}
        </div>

        {/* DROPDOWN MENU MOBILE */}
        {isAuthenticated && isMobileMenuOpen && (
          <div className="lg:hidden bg-gray-900 border-t border-gray-700 px-4 pt-3 pb-4 space-y-2 mt-4 rounded-b-lg">
            <button
              onClick={() => { setIsReportModalOpen(true); setIsMobileMenuOpen(false); }}
              className="block w-full text-left px-3 py-2 rounded text-base text-gray-300 hover:text-white hover:bg-gray-800"
            >
              Gerar Relatório
            </button>
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded text-base text-gray-300 hover:text-white hover:bg-gray-800"
            >
              Página Inicial
            </Link>
            <Link
              href="/api/historico"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded text-base text-gray-300 hover:text-white hover:bg-gray-800"
            >
              Histórico
            </Link>
            <Link
              href="/api/update"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded text-base text-gray-300 hover:text-white hover:bg-gray-800"
            >
              Atualizar Produtos
            </Link>
            <Link
              href="/api/delete"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded text-base text-gray-300 hover:text-white hover:bg-gray-800"
            >
              Deletar Produtos
            </Link>
            <button
              onClick={() => { setIsResetModalOpen(true); setIsMobileMenuOpen(false); }}
              className="block w-full text-left px-3 py-2 rounded text-base text-gray-300 hover:text-white hover:bg-gray-800"
            >
              Opções de Zerar
            </button>
            <button
              onClick={() => { setIsLogoutModalOpen(true); setIsMobileMenuOpen(false); }}
              className="flex items-center gap-2 w-full text-left px-3 py-2 rounded text-base text-red-400 hover:bg-gray-800"
            >
              Sair
            </button>
          </div>
        )}
      </nav>

      {/* MODAL DE SELEÇÃO DE DATA PARA RELATÓRIO */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Gerar Relatório de Vendas</h2>
            <form onSubmit={handleGenerateReport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Data Inicial</label>
                <input
                  type="date"
                  required
                  max={today}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Data Final</label>
                <input
                  type="date"
                  required
                  max={today}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:bg-emerald-300 font-medium"
                >
                  {loading ? "Exportando..." : "Baixar Excel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEMAIS MODAIS MANTIDOS */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Entrar na Conta</h2>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">E-mail</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="seu@email.com"
                  value={userData.email}
                  onChange={handleUserChange}
                  className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  value={userData.password}
                  onChange={handleUserChange}
                  className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 relative text-center">
            <h2 className="text-xl font-bold mb-2 text-gray-800">Encerrar Sessão</h2>
            <p className="text-sm text-gray-600 mb-6">Deseja realmente encerrar a sua sessão?</p>
            <div className="flex justify-center space-x-3">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Cadastrar Novo Produto</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome do Produto</label>
                <input
                  type="text"
                  name="Name"
                  required
                  value={formData.Name}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Preço (Ex: 29.90)</label>
                <input
                  type="number"
                  step="0.01"
                  name="Price"
                  required
                  value={formData.Price}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Link da Imagem</label>
                <input
                  type="url"
                  name="ImageLink"
                  value={formData.ImageLink}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {loading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 relative text-center">
            <h2 className="text-xl font-bold mb-2 text-gray-800">Opções de Zerar</h2>
            <p className="text-sm text-gray-600 mb-6">
              Escolha qual informação deseja redefinir no sistema:
            </p>
            <div className="space-y-3">
              <button
                disabled={loading}
                onClick={handleResetStock}
                className="w-full py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded transition-colors disabled:opacity-50"
              >
                Zerar Quantidades (Estoque)
              </button>
              <button
                disabled={loading}
                onClick={handleResetHistory}
                className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded transition-colors disabled:opacity-50"
              >
                Zerar Históricos
              </button>
            </div>
            <div className="mt-6 border-t pt-4">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="w-full py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
