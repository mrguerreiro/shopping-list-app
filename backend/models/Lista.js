const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 1. Schema do Item (como está no seu server.js)
const itemSchema = new Schema({
    nome: { type: String, required: true },
    comprado: { type: Boolean, default: false },
    comprador: { type: String, default: null },
    dataCompra: { type: Date, default: null },
});

// 2. Schema da Lista (como está no seu server.js)
const listaSchema = new Schema({
    nome: { type: String, required: true },
    criadoPor: { type: String, required: false },
    itens: [itemSchema],
    dataCriacao: { type: Date, default: Date.now },
});

// 3. Exporta o Modelo
module.exports = mongoose.model('Lista', listaSchema);
