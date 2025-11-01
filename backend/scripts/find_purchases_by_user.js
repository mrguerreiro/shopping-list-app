const mongoose = require('mongoose');
const Lista = require('../models/Lista');
require('dotenv').config();

const usuario = process.argv[2] || 'Mariana';
const dataInicio = process.argv[3] || '2025-10-01';
const dataFim = process.argv[4] || '2025-11-01';

const parseLocalDate = (s) => {
  const parts = String(s).split('-').map(Number);
  if (parts.length !== 3) return new Date(NaN);
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
};

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Mongo conectado para pesquisa');

    const inicio = parseLocalDate(dataInicio);
    const fim = parseLocalDate(dataFim);
    inicio.setHours(0,0,0,0);
    fim.setHours(23,59,59,999);

    const regex = new RegExp(usuario, 'i');

    const results = await Lista.aggregate([
      { $unwind: '$itens' },
      { $match: {
          'itens.comprado': true,
          'itens.comprador': { $regex: regex },
          'itens.dataCompra': { $gte: inicio, $lte: fim }
      }},
      { $project: {
          nomeLista: '$nome',
          nomeItem: '$itens.nome',
          comprador: '$itens.comprador',
          dataCompra: '$itens.dataCompra'
      }}
    ]).allowDiskUse(true);

    console.log(`Encontrados ${results.length} itens comprados por '${usuario}' entre ${dataInicio} e ${dataFim}`);
    for (const r of results) {
      console.log('-', r.nomeLista, '|', r.nomeItem, '|', r.comprador, '|', r.dataCompra);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Erro na pesquisa:', err);
    process.exit(2);
  }
})();
