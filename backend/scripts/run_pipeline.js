require('dotenv').config();
const mongoose = require('mongoose');
const Lista = require('../models/Lista');
const Historico = require('../models/Historico');

(async function(){
  try{
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const start = new Date('2025-10-26'); start.setHours(0,0,0,0);
    const end = new Date('2025-10-26'); end.setHours(23,59,59,999);
    console.log('start', start.toISOString(), 'end', end.toISOString());

    const pipeline=[
      { $unwind: '$itens' },
      { $match: { 'itens.comprado': true, 'itens.dataCompra': { $gte: start, $lte: end } } },
      { $project: { nome:1, 'item':'$itens' } }
    ];

    const la = await Lista.aggregate(pipeline);
    const lh = await Historico.aggregate(pipeline);

    console.log('listasAtivas', la.length, 'historico', lh.length);
    console.dir(la, { depth: 2 });

    await mongoose.disconnect();
  }catch(err){
    console.error(err);
    process.exit(1);
  }
})();