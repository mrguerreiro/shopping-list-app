require('dotenv').config();
const mongoose = require('mongoose');
const Lista = require('../models/Lista');
const Historico = require('../models/Historico');

function parseLocalDate(s) {
  // s expected YYYY-MM-DD
  const parts = s.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  return new Date(y, m, d);
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const inicioLocal = parseLocalDate('2025-09-01');
  const fimLocal = new Date(parseLocalDate('2025-10-01').getTime() - 1); // end of Sep 30 local

  console.log('Local bounds:', inicioLocal.toString(), fimLocal.toString());
  console.log('UTC bounds:', inicioLocal.toISOString(), fimLocal.toISOString());

  // Query listas
  const listas = await Lista.find({ 'itens.dataCompra': { $gte: inicioLocal, $lte: fimLocal } }).lean();
  console.log('Found listas with items in range:', listas.length);
  listas.forEach(l => {
    console.log('Lista:', l._id, l.nome);
    l.itens.forEach(item => {
      if (item.dataCompra && new Date(item.dataCompra) >= inicioLocal && new Date(item.dataCompra) <= fimLocal) {
        console.log('  Item:', item.nome, 'comprado:', item.comprado, 'dataCompra:', new Date(item.dataCompra).toISOString());
      }
    });
  });

  // Query historico
  const historicos = await Historico.find({ 'itens.dataCompra': { $gte: inicioLocal, $lte: fimLocal } }).lean();
  console.log('Found historico with items in range:', historicos.length);
  historicos.forEach(h => {
    console.log('Historico:', h._id, h.nome);
    h.itens.forEach(item => {
      if (item.dataCompra && new Date(item.dataCompra) >= inicioLocal && new Date(item.dataCompra) <= fimLocal) {
        console.log('  Item:', item.nome, 'comprado:', item.comprado, 'dataCompra:', new Date(item.dataCompra).toISOString());
      }
    });
  });

  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });

// Busca por listas cujo nome contenha '01/09' para inspecionar o conteúdo citado pelo usuário
async function buscarListaPorNome() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const Lista = require('../models/Lista');
  const regex = /01\/09/;
  const listas = await Lista.find({ nome: regex }).lean();
  console.log('\nListas cujo nome casa com /01\\/09/:', listas.length);
  listas.forEach(l => {
    console.log('Lista:', l._id, l.nome);
    l.itens.forEach(item => {
      console.log('  Item:', item.nome, 'comprado:', item.comprado, 'dataCompra:', item.dataCompra ? new Date(item.dataCompra).toISOString() : null);
    });
  });
  await mongoose.disconnect();
}

if (require.main === module) {
  // já executado acima; não executar buscarListaPorNome automaticamente
}
