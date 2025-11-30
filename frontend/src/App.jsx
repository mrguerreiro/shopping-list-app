import React, { useState, useEffect, useCallback } from "react";

import axios from "axios";

// Evita a tela de aviso do ngrok nos fetches do frontend
axios.defaults.headers.common["ngrok-skip-browser-warning"] = "true";

import "./App.css";

// URL base da API - usa variável de ambiente ou fallback para localhost
// Para produção, configure VITE_API_URL no arquivo .env antes do build
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/listas`
  : "http://localhost:5001/api/listas";

// Base do backend para pings de saúde (ex.: /test)
const BACKEND_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

// ===============================================

// Componente de Menu de Relatórios

// ===============================================

const MenuRelatorios = ({ setView, onBack }) => (
  <div className="lista-detalhes" style={{ textAlign: "center" }}>
    <h2>Menu de Relatórios</h2>

    <button
      type="button"
      onClick={onBack}
      style={{
        marginBottom: "2rem",
        backgroundColor: "#dc3545",
        padding: "0.75rem 1.5rem",
      }}
    >
      Voltar para Listas
    </button>

    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <button
        type="button"
        onClick={() => setView("reports_data")}
        style={{ padding: "1rem", backgroundColor: "#3949ab", color: "white" }}
      >
        1. Compras por Data (O que foi comprado)
      </button>

      <button
        type="button"
        onClick={() => setView("reports_usuario")}
        style={{ padding: "1rem", backgroundColor: "#3949ab", color: "white" }}
      >
        2. Compras por Usuário
      </button>

      <button
        type="button"
        onClick={() => setView("reports_frequencia")}
        style={{ padding: "1rem", backgroundColor: "#3949ab", color: "white" }}
      >
        3. Frequência de Compra (Item)
      </button>
    </div>
  </div>
);

// ===============================================

// 1. Componente para Relatório de Compras por Data

// ===============================================

const RelatorioComprasPorData = ({ onBack }) => {
  const [dataInicio, setDataInicio] = useState("");

  const [dataFim, setDataFim] = useState("");

  const [compras, setCompras] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

  const formatarData = (dataString) => {
    const data = new Date(dataString);

    const dia = String(data.getDate()).padStart(2, "0");

    const mes = String(data.getMonth() + 1).padStart(2, "0");

    const ano = data.getFullYear();

    const horas = String(data.getHours()).padStart(2, "0");

    const minutos = String(data.getMinutes()).padStart(2, "0");

    return `${dia}/${mes}/${ano} às ${horas}:${minutos}`;
  };

  const buscarRelatorio = useCallback(
    async (e) => {
      if (e) e.preventDefault();

      if (!dataInicio || !dataFim) {
        setError("Por favor, selecione as duas datas.");

        setCompras([]);

        return;
      }

      setLoading(true);

      setError(null);

      try {
        const response = await axios.get(`${API_BASE_URL}/relatorio-compras`, {
          params: {
            dataInicio,

            dataFim,
          },
        });

        // Garante que sempre seja um array válido
        setCompras(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Erro ao buscar relatório:", err);

        setError(
          "Erro ao carregar o relatório. Verifique a conexão com a API."
        );

        setCompras([]);
      } finally {
        setLoading(false);
      }
    },
    [dataInicio, dataFim]
  );

  return (
    <div className="lista-detalhes">
      <h2>1. Compras por Data</h2>

      <button
        type="button"
        onClick={onBack}
        style={{ marginBottom: "1rem", backgroundColor: "#dc3545" }}
      >
        Voltar para o Menu de Relatórios
      </button>

      <form
        onSubmit={buscarRelatorio}
        style={{ flexDirection: "column", gap: "1rem" }}
      >
        <div style={{ display: "flex", gap: "1rem" }}>
          <label htmlFor="dataInicio" className="sr-only">Data de Início</label>
          <input
            id="dataInicio"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            required
            placeholder="Data de Início"
            style={{ flex: 1, color: "#333", backgroundColor: "#f0f0f0" }}
          />

          <label htmlFor="dataFim" className="sr-only">Data Final</label>
          <input
            id="dataFim"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            required
            placeholder="Data Final"
            style={{ flex: 1, color: "#333", backgroundColor: "#f0f0f0" }}
          />
        </div>

        <button type="submit" style={{ backgroundColor: "#007bff" }}>
          Gerar Relatório
        </button>
      </form>

      {loading && (
        <p style={{ textAlign: "center" }}>Carregando relatório...</p>
      )}

      {error && (
        <p style={{ color: "#ff5252", textAlign: "center" }}>{error}</p>
      )}

      {compras.length > 0 ? (
        <ul style={{ marginTop: "1rem" }}>
          {compras.map((item, index) => (
            <li
              key={index}
              style={{
                flexDirection: "column",
                alignItems: "flex-start",
                borderBottom: "1px solid #5c6bc0",
              }}
            >
              <div style={{ fontWeight: "bold" }}>{item.nome}</div>

              <div style={{ fontSize: "0.9rem", color: "#b0bec5" }}>
                Comprado por: {item.comprador || "Desconhecido"}
              </div>

              <div style={{ fontSize: "0.8rem", color: "#e0e0e0" }}>
                Lista (Solicitante Implícito): {item.nomeLista}
              </div>

              <div style={{ fontSize: "0.8rem", color: "#b0bec5" }}>
                Data da Compra: {formatarData(item.dataCompra)}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !loading &&
        !error && (
          <p style={{ textAlign: "center", marginTop: "1rem" }}>
            Nenhum item comprado no período selecionado.
          </p>
        )
      )}
    </div>
  );
};

// ===============================================

// 2. Componente para Relatório de Compras por Usuário

// ===============================================

const RelatorioComprasPorUsuario = ({ onBack }) => {
  const [usuario, setUsuario] = useState("");

  const [dataInicio, setDataInicio] = useState("");

  const [dataFim, setDataFim] = useState("");

  const [comprados, setComprados] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

  const formatarData = (dataString) => {
    const data = new Date(dataString);

    return `${String(data.getDate()).padStart(2, "0")}/${String(
      data.getMonth() + 1
    ).padStart(2, "0")}/${data.getFullYear()}`;
  };

  const buscarRelatorio = useCallback(
    async (e) => {
      if (e) e.preventDefault();

      if (!usuario || !dataInicio || !dataFim) {
        setError("Preencha o nome do usuário e as datas.");
        setComprados([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('Buscando relatório para usuário:', usuario);
        console.log('Período:', dataInicio, 'até', dataFim);

          // Busca apenas Itens Comprados pelo usuário
          const responseComprados = await axios.get(
            `${API_BASE_URL}/relatorio-usuario/comprados`,
            { params: { usuario, dataInicio, dataFim } }
          );

          console.log('Dados de compras:', responseComprados.data);

          // Garante que sempre seja um array válido
          setComprados(Array.isArray(responseComprados.data) ? responseComprados.data : []);
      } catch (err) {
        console.error("Erro ao buscar relatório por usuário:", err);
        console.error("Detalhes do erro:", err.response?.data || err.message);
        
        setError(
          "Erro ao carregar o relatório por usuário. Verifique a conexão com a API."
        );
        
  setComprados([]);
      } finally {
        setLoading(false);
      }
    },
    [usuario, dataInicio, dataFim]
  );

  return (
    <div className="lista-detalhes">
  <h2>2. Compras por Usuário</h2>

      <button
        type="button"
        onClick={onBack}
        style={{ marginBottom: "1rem", backgroundColor: "#dc3545" }}
      >
        Voltar para o Menu de Relatórios
      </button>

      <form
        onSubmit={buscarRelatorio}
        style={{ flexDirection: "column", gap: "1rem" }}
      >
        <label htmlFor="usuarioPesquisa" className="sr-only">Nome do Usuário</label>
        <input
          id="usuarioPesquisa"
          type="text"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          placeholder="Nome do Usuário para Pesquisa"
          required
          style={{ color: "#333", backgroundColor: "#f0f0f0" }}
        />

        <div style={{ display: "flex", gap: "1rem" }}>
          <label htmlFor="dataInicioUsuario" className="sr-only">Data de Início</label>
          <input
            id="dataInicioUsuario"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            required
            placeholder="Data de Início"
            style={{ flex: 1, color: "#333", backgroundColor: "#f0f0f0" }}
          />

          <label htmlFor="dataFimUsuario" className="sr-only">Data Final</label>
          <input
            id="dataFimUsuario"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            required
            placeholder="Data Final"
            style={{ flex: 1, color: "#333", backgroundColor: "#f0f0f0" }}
          />
        </div>

        <button type="submit" style={{ backgroundColor: "#007bff" }}>
          Gerar Relatório
        </button>
      </form>

      {loading && (
        <p style={{ textAlign: "center" }}>Carregando relatório...</p>
      )}

      {error && (
        <p style={{ color: "#ff5252", textAlign: "center" }}>{error}</p>
      )}

      {comprados.length > 0 && (
        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            gap: "1rem",
            flexDirection: "column",
          }}
        >
          <div style={{ flex: 1, minWidth: "100%" }}>
            <h3
              style={{
                color: "#FF9800",
                borderBottom: "1px solid #FF9800",
                paddingBottom: "0.5rem",
              }}
            >
              Itens Comprados - {comprados.length}
            </h3>

            {comprados.length > 0 ? (
              <ul
                style={{
                  padding: "0.5rem",
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
                {comprados.map((item, index) => (
                  <li
                    key={index}
                    style={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ fontWeight: "bold" }}>{item.nome}</div>

                    <div style={{ fontSize: "0.8rem", color: "#b0bec5" }}>
                      Data Compra: {formatarData(item.dataCompra)}
                    </div>

                    <div style={{ fontSize: "0.8rem", color: "#e0e0e0" }}>
                      Lista: {item.nomeLista}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: "0.9rem" }}>
                Nenhum item comprado por este nome.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Exibe mensagem se não houver dados, e não estiver carregando/com erro */}

      {!loading && !error && comprados.length === 0 && usuario && (
        <p style={{ textAlign: "center", marginTop: "1rem" }}>
          Nenhum dado encontrado para o usuário "{usuario}" no período
          selecionado.
        </p>
      )}
    </div>
  );
};

// ===============================================

// 3. Componente para Relatório de Frequência de Compra

// ===============================================

const RelatorioFrequenciaDeCompra = ({ onBack }) => {
  const [itemNome, setItemNome] = useState("");

  const [frequencia, setFrequencia] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

  const buscarFrequencia = useCallback(
    async (e) => {
      if (e) e.preventDefault();

      if (!itemNome.trim()) {
        setError("Por favor, digite o nome de um item.");

        setFrequencia(null);

        return;
      }

      setLoading(true);

      setError(null);

      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const response = await axios.get(
          `${baseUrl}/api/relatorios/frequencia`,
          {
            params: { itemNome: itemNome.trim() },
          }
        );

        // O backend deve retornar: { itemNome, numeroTotalDeCompras, frequenciaMediaDias }

        setFrequencia(response.data);
      } catch (err) {
        console.error("Erro ao buscar frequência:", err);

        setError(
          "Erro ao carregar o relatório de frequência. Verifique a conexão com a API."
        );

        setFrequencia(null);
      } finally {
        setLoading(false);
      }
    },
    [itemNome]
  );

  return (
    <div className="lista-detalhes">
      <h2>3. Frequência de Compra (Item)</h2>

      <button
        type="button"
        onClick={onBack}
        style={{ marginBottom: "1rem", backgroundColor: "#dc3545" }}
      >
        Voltar para o Menu de Relatórios
      </button>

      <form
        onSubmit={buscarFrequencia}
        style={{ flexDirection: "column", gap: "1rem" }}
      >
        <label htmlFor="itemNome" className="sr-only">Nome do item</label>
        <input
          id="itemNome"
          type="text"
          value={itemNome}
          onChange={(e) => setItemNome(e.target.value)}
          placeholder="Digite o nome do Item (ex: Leite Integral)"
          required
          style={{ color: "#333", backgroundColor: "#f0f0f0" }}
        />

        <button type="submit" style={{ backgroundColor: "#007bff" }}>
          Calcular Frequência
        </button>
      </form>

      {loading && <p style={{ textAlign: "center" }}>Carregando...</p>}

      {error && (
        <p style={{ color: "#ff5252", textAlign: "center" }}>{error}</p>
      )}

      {frequencia && !loading && !error && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            border: "2px solid #64b5f6",
            borderRadius: "8px",
            backgroundColor: "#3949ab",
          }}
        >
          <h3 style={{ marginBottom: "0.5rem", color: "#ffeb3b" }}>
            Item: {frequencia.itemNome}
          </h3>

          <p style={{ fontSize: "1.1rem", margin: "0.5rem 0" }}>
            Total de Compras Registradas:{" "}
            <strong style={{ color: "#4CAF50" }}>
              {frequencia.numeroTotalDeCompras}
            </strong>
          </p>

          {frequencia.frequenciaMediaDias !== null ? (
            <p style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
              Frequência Média de Compra:{" "}
              <strong style={{ color: "#FFD700" }}>
                {frequencia.frequenciaMediaDias.toFixed(1)} dias
              </strong>
            </p>
          ) : (
            <p style={{ fontSize: "1.1rem" }}>
              A frequência média não pode ser calculada com menos de 2 compras.
            </p>
          )}
        </div>
      )}

      {!loading &&
        !error &&
        frequencia &&
        frequencia.numeroTotalDeCompras === 0 && (
          <p style={{ textAlign: "center", marginTop: "1rem" }}>
            Item "{itemNome}" nunca foi comprado.
          </p>
        )}
    </div>
  );
};

// ===============================================

// 4. Componente de Detalhes da Lista

// ===============================================

const ListaDetalhes = ({
  lista,
  onVoltar,
  onUpdateItem,
  onAddItem,
  onDeleteItem,
}) => {
  const [novoItem, setNovoItem] = useState("");

  // Utiliza o nome salvo no localStorage como o nome do comprador/solicitante

  const userName = localStorage.getItem("userName") || "Usuário Anônimo";

  const handleAddItem = (e) => {
    e.preventDefault();

    if (novoItem.trim()) {
      onAddItem(novoItem);

      setNovoItem("");
    }
  };

  return (
    <div className="lista-detalhes">
      <h2>{lista.nome}</h2>

      <button type="button" onClick={onVoltar} style={{ marginBottom: "1rem" }}>
        Voltar para Listas
      </button>

      <form onSubmit={handleAddItem}>
        <label htmlFor="novoItem" className="sr-only">Adicionar novo item</label>
        <input
          id="novoItem"
          type="text"
          value={novoItem}
          onChange={(e) => setNovoItem(e.target.value)}
          placeholder="Adicionar novo item..."
          required
        />

        <button type="submit">Adicionar</button>
      </form>

      <ul>
        {lista.itens.length > 0 ? (
          lista.itens.map((item) => (
            <li
              key={item._id}
              role="button"
              tabIndex={0}
              onClick={() =>
                onUpdateItem(item._id, {
                  comprado: !item.comprado,

                  comprador: !item.comprado ? userName : null,

                  dataCompra: !item.comprado ? new Date() : null,
                })
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onUpdateItem(item._id, {
                    comprado: !item.comprado,
                    comprador: !item.comprado ? userName : null,
                    dataCompra: !item.comprado ? new Date() : null,
                  });
                }
              }}
            >
              <span className={item.comprado ? "comprado" : ""}>
                {item.nome}
              </span>

              {item.comprado && item.comprador && (
                <span className="comprador-info">
                  Comprado por: {item.comprador}
                </span>
              )}

              <button
                type="button"
                aria-label={`Excluir item ${item.nome}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteItem(item._id);
                }}
                style={{ color: "#ff5252" }}
              >
                X
              </button>
            </li>
          ))
        ) : (
          <li>Nenhum item nesta lista.</li>
        )}
      </ul>
    </div>
  );
};

// ===============================================

// 5. Componente Principal App

// ===============================================

const App = () => {
  const [listas, setListas] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [warmingUp, setWarmingUp] = useState(false);

  const [nomeUsuario, setNomeUsuario] = useState(
    localStorage.getItem("userName") || ""
  );

  const [novaListaNome, setNovaListaNome] = useState("");

  const [listaSelecionada, setListaSelecionada] = useState(null);

  // Estado para gerenciar a view: 'main', 'details', 'reports_menu', 'reports_data', 'reports_usuario', 'reports_frequencia'

  const [view, setView] = useState("main");

  useEffect(() => {
    if (nomeUsuario) {
      localStorage.setItem("userName", nomeUsuario);
    } else {
      localStorage.removeItem("userName");
    }
  }, [nomeUsuario]);

  const fetchListas = useCallback(async () => {
    try {
      const response = await axios.get(API_BASE_URL, { timeout: 20000 });

      // Garante que sempre seja um array válido
      setListas(Array.isArray(response.data) ? response.data : []);
      if (!isOnline) setIsOnline(true);
    } catch (error) {
      console.error("Erro ao buscar listas:", error);
      // Não limpa as listas em caso de falha (ex.: cold start no Render)
      // Mantém o último estado e tenta novamente no próximo ciclo
      setIsOnline(false);
    }
  }, [isOnline]);

  // Faz ping no backend com tentativas exponenciais (acorda instância no Render)
  const warmupBackend = useCallback(async () => {
    setWarmingUp(true);
    const maxTries = 5;
    let delay = 1000; // 1s, 2s, 4s, 8s, 16s
    for (let i = 0; i < maxTries; i++) {
      try {
        await axios.get(`${BACKEND_BASE_URL}/test`, { timeout: 20000 });
        setIsOnline(true);
        setWarmingUp(false);
        return true;
      } catch (e) {
        console.warn(`Warm-up tentativa ${i + 1} falhou; tentando em ${delay}ms`, e?.message || e);
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
      }
    }
    setWarmingUp(false);
    setIsOnline(false);
    return false;
  }, []);

  useEffect(() => {
    // Aquece o backend (Render pode estar "adormecido") e busca listas
    (async () => {
      await warmupBackend();
      await fetchListas();
    })();

    // Polling contínuo (mantém dados atualizados quando online)
    const interval = setInterval(fetchListas, 5000);
    return () => clearInterval(interval);
  }, [fetchListas, warmupBackend]);

  const handleCriarLista = async (e) => {
    e.preventDefault();

    if (!novaListaNome.trim()) return;

    try {
      const novaLista = {
        nome: novaListaNome,
        criadoPor: nomeUsuario || "Usuário Anônimo",
        itens: [],
        dataCriacao: new Date()
      };

      const response = await axios.post(API_BASE_URL, novaLista);

      setListas([...listas, response.data]);

      setNovaListaNome("");
    } catch (error) {
      console.error("Erro ao criar lista:", error);
      alert("Erro ao criar a lista. Por favor, tente novamente.");
    }
  };

  const handleExcluirLista = async (id, e) => {
    e.stopPropagation();

    // Confirmação antes de excluir
    const confirmacao = window.confirm("Deseja realmente excluir essa lista?");
    if (!confirmacao) return;

    try {
      await axios.delete(`${API_BASE_URL}/${id}`);

      setListas(listas.filter((l) => l._id !== id));

      if (listaSelecionada && listaSelecionada._id === id) {
        setListaSelecionada(null);

        setView("main");
      }
    } catch (error) {
      console.error("Erro ao excluir lista:", error);
    }
  };

  const handleSelecionarLista = (lista) => {
    setListaSelecionada(lista);

    setView("details");
  };

  const handleVoltarParaListas = () => {
    setListaSelecionada(null);

    setView("main");

    fetchListas(); // Recarrega as listas ao voltar
  };

  const handleUpdateItem = async (itemId, updateData) => {
    try {
      console.log('Atualizando item:', itemId, 'com dados:', updateData);
      
      const updatedLista = await axios.put(
        `${API_BASE_URL}/${listaSelecionada._id}/itens/${itemId}`,
        updateData
      );

      console.log('Resposta do servidor:', updatedLista.data);

      setListaSelecionada(updatedLista.data);

      // Atualiza a lista geral também
      setListas(
        listas.map((l) =>
          l._id === listaSelecionada._id ? updatedLista.data : l
        )
      );
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
      alert("Erro ao atualizar o item. Por favor, tente novamente.");
    }
  };

  const handleAddItem = async (nomeItem) => {
    try {
      if (!listaSelecionada || !listaSelecionada._id) {
        console.error("Nenhuma lista selecionada");
        return;
      }

      console.log("Adicionando item:", nomeItem, "à lista:", listaSelecionada._id);

      const updatedLista = await axios.post(
        `${API_BASE_URL}/${listaSelecionada._id}/itens`,
        { nome: nomeItem }
      );

      console.log("Resposta do servidor:", updatedLista.data);

      setListaSelecionada(updatedLista.data);

      setListas(
        listas.map((l) =>
          l._id === listaSelecionada._id ? updatedLista.data : l
        )
      );
    } catch (error) {
      console.error("Erro ao adicionar item:", error);
      alert("Erro ao adicionar item. Por favor, tente novamente.");
    }
  };

  const handleDeleteItem = async (itemId) => {
    // Confirmação antes de excluir
    const confirmacao = window.confirm("Deseja realmente excluir esse item da lista?");
    if (!confirmacao) return;

    try {
      console.log('Requisitando exclusão do item', itemId, 'na lista', listaSelecionada?._id);
      const response = await axios.delete(
        `${API_BASE_URL}/${listaSelecionada._id}/itens/${itemId}`
      );

      console.log('Resposta delete item:', response.status, response.data);

      const updatedLista = response.data;

      setListaSelecionada(updatedLista);

      setListas(
        listas.map((l) => (l._id === listaSelecionada._id ? updatedLista : l))
      );
    } catch (error) {
      console.error("Erro ao deletar item:", error);
      console.error('Erro detalhe response:', error.response?.status, error.response?.data);
      alert('Erro ao deletar item: ' + (error.response?.data?.message || error.message));
    }
  };

  // Renderiza a view correta

  const renderView = () => {
    switch (view) {
      case "reports_menu":
        return (
          <MenuRelatorios setView={setView} onBack={handleVoltarParaListas} />
        );

      case "reports_data":
        return (
          <RelatorioComprasPorData onBack={() => setView("reports_menu")} />
        );

      case "reports_usuario":
        return (
          <RelatorioComprasPorUsuario onBack={() => setView("reports_menu")} />
        );

      case "reports_frequencia":
        return (
          <RelatorioFrequenciaDeCompra onBack={() => setView("reports_menu")} />
        );

      case "details":
        return (
          <ListaDetalhes
            lista={listaSelecionada}
            onVoltar={handleVoltarParaListas}
            onUpdateItem={handleUpdateItem}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
          />
        );

      case "main":
        return (
          <>
            <div className="listas-existentes">
              <h2>Listas Ativas</h2>

              <form onSubmit={handleCriarLista}>
                  <label htmlFor="novaListaNome" className="sr-only">Nome da nova lista</label>
                  <input
                    id="novaListaNome"
                    type="text"
                    value={novaListaNome}
                    onChange={(e) => setNovaListaNome(e.target.value)}
                    placeholder="Nome da nova lista"
                    required
                  />

                  <button type="submit">Criar</button>
              </form>

              <ul>
                {listas.length > 0 ? (
                  listas.map((lista) => (
                    <li
                      key={lista._id}
                      onClick={() => handleSelecionarLista(lista)}
                    >
                      <button type="button" aria-label={`Abrir lista ${lista.nome}`} onClick={() => handleSelecionarLista(lista)}>{lista.nome}</button>

                      <button
                        type="button"
                        aria-label={`Excluir lista ${lista.nome}`}
                        onClick={(e) => handleExcluirLista(lista._id, e)}
                        style={{ color: "#ff5252" }}
                      >
                        X
                      </button>
                    </li>
                  ))
                ) : (
                  <li>Nenhuma lista ativa. Crie a primeira!</li>
                )}
              </ul>
            </div>

            <div
              className="lista-detalhes"
              style={{ justifyContent: "center", alignItems: "center" }}
            >
              <h2 style={{ textAlign: "center" }}>Opções</h2>

              <button
                type="button"
                onClick={() => setView("reports_menu")}
                style={{
                  padding: "1rem 2rem",
                  backgroundColor: "#3949ab",
                  color: "white",
                }}
              >
                Abrir Menu de Relatórios
              </button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Lista de Compras</h1>
        {!isOnline && (
          <p style={{
            background: "#ffc107",
            color: "#1a1a1a",
            padding: "0.5rem 0.75rem",
            borderRadius: 8,
            margin: "0.5rem auto",
            maxWidth: 600,
          }}>
            Reconectando à API... {warmingUp ? "(iniciando servidor)" : "(nova tentativa em alguns segundos)"}
          </p>
        )}
        <label htmlFor="userName" className="sr-only">Seu nome</label>
        <input
          id="userName"
          type="text"
          value={nomeUsuario}
          onChange={(e) => setNomeUsuario(e.target.value)}
          placeholder="Seu nome"
          aria-label="Seu nome"
        />
      </header>

      <main>{renderView()}</main>
    </div>
  );
};

export default App;
