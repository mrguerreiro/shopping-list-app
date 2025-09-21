const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Conexão com o MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB conectado"))
  .catch((err) => console.error("Erro na conexão com o MongoDB:", err));

// Definição dos Schemas (Modelos de Dados)
const Schema = mongoose.Schema;

const itemSchema = new Schema({
  nome: { type: String, required: true },
  comprado: { type: Boolean, default: false },
  comprador: { type: String, default: null },
});

const listaSchema = new Schema({
  nome: { type: String, required: true },
  criadoPor: { type: String, required: true },
  itens: [itemSchema],
  dataCriacao: { type: Date, default: Date.now },
});

const historicoSchema = new Schema({
  nome: { type: String, required: true },
  criadoPor: { type: String, required: true },
  itens: [
    {
      nome: { type: String, required: true },
      comprado: { type: Boolean, default: false },
      comprador: { type: String, default: null },
    },
  ],
  dataCriacao: { type: Date, required: true },
  dataConclusao: { type: Date, default: Date.now },
});

const Lista = mongoose.model("Lista", listaSchema);
const Historico = mongoose.model("Historico", historicoSchema);

// Rotas da API
app.get("/", (req, res) => res.send("API de Lista de Compras Online!"));

// Criar nova lista
app.post("/api/listas", async (req, res) => {
  const novaLista = new Lista(req.body);
  try {
    await novaLista.save();
    res.status(201).json(novaLista);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Obter todas as listas
app.get("/api/listas", async (req, res) => {
  try {
    const listas = await Lista.find();
    res.json(listas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar uma lista (adicionar/remover item, marcar como comprado, etc.)
app.put("/api/listas/:id", async (req, res) => {
  try {
    const lista = await Lista.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(lista);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Rota para mover lista para histórico e depois deletar a original
app.delete("/api/listas/:id", async (req, res) => {
  try {
    const lista = await Lista.findById(req.params.id);
    if (!lista) {
      return res.status(404).json({ message: "Lista não encontrada." });
    }

    const listaParaHistorico = new Historico({
      nome: lista.nome,
      criadoPor: lista.criadoPor,
      itens: lista.itens,
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

// Rota de Relatórios: O que foi comprado e quando
app.get("/api/relatorios/comprados-por-data", async (req, res) => {
  try {
    const dadosRelatorio = await Historico.aggregate([
      { $unwind: "$itens" },
      { $match: { "itens.comprado": true } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$dataConclusao" },
          },
          totalComprado: { $sum: 1 },
          itens: {
            $push: {
              nome: "$itens.nome",
              compradoPor: "$itens.comprador",
            },
          },
        },
      },
      { $sort: { _id: -1 } },
    ]);
    res.json(dadosRelatorio);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota de Relatórios: Frequência de compra por item
app.get("/api/relatorios/frequencia-item", async (req, res) => {
  try {
    const dadosRelatorio = await Historico.aggregate([
      { $unwind: "$itens" },
      { $match: { "itens.comprado": true } },
      {
        $group: {
          _id: "$itens.nome",
          contagem: { $sum: 1 },
          compradoPor: { $push: "$itens.comprador" },
        },
      },
      { $sort: { contagem: -1 } },
    ]);
    res.json(dadosRelatorio);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`);
});
