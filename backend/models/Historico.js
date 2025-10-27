const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// O Schema do Item deve ser definido aqui também, se for importado separadamente
const itemSchema = new Schema({
    nome: { type: String, required: true },
    comprado: { type: Boolean, default: false },
    comprador: { type: String, default: null },
    dataCompra: { type: Date, default: null },
});

// Schema do Histórico (Cópia do server.js)
const historicoSchema = new Schema({
    nome: { type: String, required: true },
    criadoPor: { type: String, required: true },
    itens: [itemSchema],
    dataCriacao: { type: Date, default: Date.now },
    dataConclusao: { type: Date, default: Date.now }
}, { 
    // Adiciona opções para garantir que as datas sejam sempre objetos Date
    timestamps: true,
    toJSON: { 
        getters: true,
        virtuals: true,
        transform: function(doc, ret) {
            if (ret.dataCriacao) ret.dataCriacao = new Date(ret.dataCriacao);
            if (ret.dataConclusao) ret.dataConclusao = new Date(ret.dataConclusao);
            return ret;
        }
    }
});

module.exports = mongoose.model("Historico", historicoSchema);
