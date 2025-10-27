const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Configuração do CORS
app.use(cors({
  origin: 'http://localhost:5173', // URL do frontend Vite
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Conexão com o MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB conectado"))
  .catch((err) => console.error("Erro na conexão com o MongoDB:", err));

// ===========================================
// IMPORTAÇÃO DOS MODELOS (MODULARIZAÇÃO COMPLETA)
// ===========================================
// Assumimos que estes arquivos existem em backend/models/
const Lista = require('./models/Lista'); 
const Historico = require('./models/Historico'); 

// ===========================================
// INCLUSÃO DAS ROTAS DE LISTAS E RELATÓRIOS
// ===========================================
// Assumimos que este arquivo existe em backend/routes/
const listasRoutes = require('./routes/listas'); 
app.use('/api/listas', listasRoutes);

// Rotas da API

app.get("/", (req, res) => res.send("API de Lista de Compras Online!"));

// Rota para mover lista para histórico e depois deletar a original (DELETE /api/listas/:id)
// Esta rota precisa estar aqui pois usa o modelo Historico para criar o registro antes de apagar a Lista
app.delete("/api/listas/:id", async (req, res) => {
  try {
    const lista = await Lista.findById(req.params.id);
    if (!lista) {
      return res.status(404).json({ message: "Lista não encontrada." });
    }

    // Mapeia os itens para garantir que o formato do Histórico seja mantido
    const itensParaHistorico = lista.itens.map(item => ({
        // Usamos .toObject() para garantir que pegamos os dados puros do Mongoose
        ...item.toObject(), 
        dataCompra: item.dataCompra || null, // Garante que dataCompra existe para relatórios
    }));

    const listaParaHistorico = new Historico({
      nome: lista.nome,
      criadoPor: lista.criadoPor,
      itens: itensParaHistorico,
      dataCriacao: lista.dataCriacao,
      dataConclusao: Date.now(),
    });

    await listaParaHistorico.save();

    // Deleta a lista original
    await lista.deleteOne();

    res.json({ message: "Lista movida para histórico e apagada com sucesso." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`);
});
