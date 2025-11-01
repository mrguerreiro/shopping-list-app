const mongoose = require('mongoose');
const Lista = require('../models/Lista');
const Historico = require('../models/Historico');
require('dotenv').config();

const item = process.argv[2] || 'Tomate';

const regex = new RegExp(item, 'i');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Mongo conectado');

    const pipeline = [
      { $unwind: '$itens' },
      { $match: { 'itens.comprado': true, 'itens.nome': { $regex: regex } } },
      { $project: { nomeLista: '$nome', nomeItem: '$itens.nome', comprador: '$itens.comprador', dataCompra: '$itens.dataCompra' } }
    ];

    const ativas = await Lista.aggregate(pipeline).allowDiskUse(true);
    const hist = await Historico.aggregate(pipeline).allowDiskUse(true);

    console.log('Compras em Listas Ativas:', ativas.length);
    ativas.forEach(a => console.log(a.nomeLista, '|', a.nomeItem, '|', a.comprador, '|', a.dataCompra));

    console.log('\nCompras em Historico:', hist.length);
    hist.forEach(a => console.log(a.nomeLista, '|', a.nomeItem, '|', a.comprador, '|', a.dataCompra));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Erro:', err);
    process.exit(2);
  }
})();
