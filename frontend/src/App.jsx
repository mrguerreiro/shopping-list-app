import { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'http://localhost:5000/api/listas'; // URL da sua API

function App() {
  const [listas, setListas] = useState([]);
  const [novaListaNome, setNovaListaNome] = useState('');
  const [novoItemNome, setNovoItemNome] = useState('');
  const [listaSelecionada, setListaSelecionada] = useState(null);
  const [nomeUsuario, setNomeUsuario] = useState('');

  useEffect(() => {
  fetchListas();
  }, []);

  const fetchListas = async () => {
  const response = await fetch(API_URL);
  const data = await response.json();
  setListas(data);
  };
  const handleCriarLista = async (e) => {
  e.preventDefault();
  if (!novaListaNome || !nomeUsuario) return;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: novaListaNome, criadoPor: nomeUsuario, itens: [] }),
  });

  const data = await response.json();
  setListas([...listas, data]);
  setNovaListaNome('');
  };

  const handleAdicionarItem = async (e) => {
  e.preventDefault();
  if (!novoItemNome || !listaSelecionada) return;

  const listaAtualizada = { ...listaSelecionada };
  listaAtualizada.itens.push({ nome: novoItemNome });

  const response = await fetch(`${API_URL}/${listaSelecionada._id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(listaAtualizada),
});

const data = await response.json();
setListas(listas.map(l => (l._id === data._id ? data : l)));
setListaSelecionada(data);
setNovoItemNome('');
};

  const handleMarcarComprado = async (itemIndex) => {
  if (!listaSelecionada) return;
  const listaAtualizada = { ...listaSelecionada };
  const item = listaAtualizada.itens[itemIndex];
  item.comprado = !item.comprado;
  item.comprador = item.comprado ? nomeUsuario : null;

  const response = await fetch(`${API_URL}/${listaSelecionada._id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(listaAtualizada),
  });

  const data = await response.json();
    setListas(listas.map(l => (l._id === data._id ? data : l)));
    setListaSelecionada(data);
    };

const handleExcluirLista = async (id) => {
  await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  setListas(listas.filter(l => l._id !== id));
  setListaSelecionada(null);
  };
  return (
  <div className="container">
  <header>
  <h1 aria-label="Aplicativo de Lista de Compras Colaborativa">Lista de Compras</h1>
  <input 
  type="text" 
  placeholder="Seu nome" 
  value={nomeUsuario}
  onChange={(e) => setNomeUsuario(e.target.value)}
  aria-label="Digite seu nome para identificar suas ações"  
  />
  </header>

  <main>
  <section className="listas-existentes">
  <h2>Listas Ativas</h2>
  <form onSubmit={handleCriarLista}>
  <input
  type="text"
  placeholder="Nome da nova lista"
  value={novaListaNome}
  onChange={(e) => setNovaListaNome(e.target.value)}
  aria-label="Digite o nome da nova lista de compras"
  />
  <button type="submit" aria-label="Criar nova lista">Criar</button>
  </form>
  <ul>
  {listas.map(lista => (
  <li key={lista._id}>
  <button onClick={() => setListaSelecionada(lista)}>
      {lista.nome}
        </button>
          <button onClick={() => handleExcluirLista(lista._id)} aria-label={`Excluir lista ${lista.nome}`}>
          X
          </button>
            </li>
  ))}
      </ul>
</section>

  {listaSelecionada && (
  <section className="lista-detalhes">
  <h2 aria-label={`Detalhes da lista: ${listaSelecionada.nome}`}>{listaSelecionada.nome}</h2>
  <form onSubmit={handleAdicionarItem}>
  <input
    type="text"
    placeholder="Adicionar item"
    value={novoItemNome}
    onChange={(e) => setNovoItemNome(e.target.value)}
    aria-label="Digite o nome do item a ser adicionado"
    />
  <button type="submit">Adicionar</button>
  </form>

  <ul aria-label="Itens da lista de compras">
  {listaSelecionada.itens.map((item, index) => (
  <li key={index} className={item.comprado ? 'comprado' : ''}>
  <span onClick={() => handleMarcarComprado(index)} role="button" aria-pressed={item.comprado}>
  {item.nome}
  </span>
  {item.comprado && item.comprador && (
    <span className="comprador-info" aria-label={`Item comprado por ${item.comprador}`}>
        ({item.comprador})
      </span>
  )} 
    </li>
  ))}
  </ul>
</section>
  )}
</main>
</div>
  );
}

export default App;
