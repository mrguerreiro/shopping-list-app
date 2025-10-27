require('dotenv').config();
const mongoose = require('mongoose');
const Lista = require('../models/Lista');

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const regex = new RegExp('01/09');
  const listas = await Lista.find({ nome: regex }).lean();
  console.log('Found', listas.length, 'lists matching 01/09');
  listas.forEach(l => {
    console.log(l._id, l.nome);
    l.itens.forEach(i => console.log('  ', i.nome, i.comprado, i.dataCompra ? new Date(i.dataCompra).toISOString() : null));
  });
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
