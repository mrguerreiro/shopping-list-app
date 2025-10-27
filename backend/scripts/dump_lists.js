require('dotenv').config();
const mongoose = require('mongoose');
const Lista = require('../models/Lista');
const Historico = require('../models/Historico');

async function main(){
  try{
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Mongo conectado para dump');

    const listas = await Lista.find().lean();
    const historicos = await Historico.find().lean();

    console.log('\n=== Listas (count=' + listas.length + ') ===');
    for(const l of listas){
      console.log('Lista', l._id, '-', l.nome, 'criadoPor:', l.criadoPor, 'dataCriacao:', l.dataCriacao);
      if(Array.isArray(l.itens)){
        for(const it of l.itens){
          console.log('  ITEM', it._id, '| nome:', it.nome, '| comprado:', it.comprado, '| dataCompra:', it.dataCompra, '| typeof:', typeof it.dataCompra);
          if(it.dataCompra && it.dataCompra instanceof Date){
            console.log('    toISOString:', it.dataCompra.toISOString());
          }
        }
      }
    }

    console.log('\n=== Historico (count=' + historicos.length + ') ===');
    for(const h of historicos){
      console.log('Historico', h._id, '-', h.nome, 'criadoPor:', h.criadoPor, 'dataCriacao:', h.dataCriacao);
      if(Array.isArray(h.itens)){
        for(const it of h.itens){
          console.log('  ITEM', it._id, '| nome:', it.nome, '| comprado:', it.comprado, '| dataCompra:', it.dataCompra, '| typeof:', typeof it.dataCompra);
          if(it.dataCompra){
            try{ console.log('    asDate:', new Date(it.dataCompra).toISOString()); }catch(e){}
          }
        }
      }
    }

    await mongoose.disconnect();
    console.log('\nDone');
  }catch(err){
    console.error('Erro dump:', err);
    process.exit(1);
  }
}

main();