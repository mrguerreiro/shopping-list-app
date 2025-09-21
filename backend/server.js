// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); // Para analisar o corpo das requisições JSON

// Conexão com o MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB conectado")).catch(err => console.error("Erro na conexão com o MongoDB:", err));

// Definição do Schema (Modelo de Dados)
const Schema = mongoose.Schema;

const itemSchema = new Schema({
  nome: { type: String, required: true },
  comprado: { type: Boolean, default: false },
  comprador: { type: String, default: null }
});

const listaSchema = new Schema({
  nome: { type: String, required: true },
  criadoPor: { type: String, required: true },
  itens: [itemSchema],
  dataCriacao: { type: Date, default: Date.now },
  dataConclusao: { type: Date, default: null },
});

const Lista = mongoose.model('Lista', listaSchema);

// Rotas da API
app.get('/', (req, res) => res.send('API de Lista de Compras Online!'));

// Criar nova lista
app.post('/api/listas', async (req, res) => {
  const novaLista = new Lista(req.body);
  try {
    await novaLista.save();
    res.status(201).json(novaLista);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Obter todas as listas
app.get('/api/listas', async (req, res) => {
  try {
    const listas = await Lista.find();
    res.json(listas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar uma lista (adicionar/remover item, marcar como comprado, etc.)
app.put('/api/listas/:id', async (req, res) => {
  try {
    const lista = await Lista.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(lista);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Rota para deletar lista (após ser concluída)
app.delete('/api/listas/:id', async (req, res) => {
  try {
    const lista = await Lista.findById(req.params.id);
    if (!lista) return res.status(404).json({ message: 'Lista não encontrada.' });

    // Antes de apagar, você pode mover para uma coleção de histórico, se necessário.
    await lista.deleteOne();
    res.json({ message: 'Lista apagada com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`);
});