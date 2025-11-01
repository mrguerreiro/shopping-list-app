const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5001;

// Debug middleware
console.log('Inicializando servidor...');
app.use(express.json());
app.use(cors());

// Rota de teste
app.get('/test', (_, res) => res.send('ok'));

// Configuração do MongoDB
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => console.log("MongoDB conectado"))
  .catch((err) => console.error("Erro na conexão com o MongoDB:", err));

// Importação dos modelos
console.log('Carregando modelos...');
const Lista = require('./models/Lista'); 
const Historico = require('./models/Historico'); 

// Rotas
console.log('Carregando rotas de relatórios...');
const relatoriosRoutes = require('./routes/relatorios');
app.use('/api/relatorios', relatoriosRoutes);
console.log('Rotas de relatórios carregadas!');

console.log('Carregando rotas de listas...');
const listasRoutes = require('./routes/listas');
app.use('/api/listas', listasRoutes);
console.log('Rotas de listas carregadas!');

// Rota padrão
app.get("/", (req, res) => res.send("API de Lista de Compras Online!"));

// Rota para mover lista para histórico
app.delete("/api/listas/:id", async (req, res) => {
  try {
    const lista = await Lista.findById(req.params.id);
    if (!lista) {
      return res.status(404).json({ message: "Lista não encontrada." });
    }

    const itensParaHistorico = lista.itens.map(item => ({
        ...item.toObject(), 
        dataCompra: item.dataCompra || null,
    }));

    const listaParaHistorico = new Historico({
      nome: lista.nome,
      criadoPor: lista.criadoPor,
      itens: itensParaHistorico,
      dataCriacao: lista.dataCriacao,
      dataConclusao: Date.now(),
    });

    await listaParaHistorico.save();
    await lista.deleteOne();

    res.json({ message: "Lista movida para histórico e apagada com sucesso." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Inicialização do servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`);
});