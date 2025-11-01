#!/usr/bin/env node
/* eslint-disable no-undef */

/**
 * Script de build do frontend
 * 
 * Valida a configuração da API e faz o build otimizado.
 * Uso: node scripts/build.js
 * 
 * Este script usa Node.js APIs (require, __dirname, process) que não são
 * parte do ambiente ESM do frontend, por isso o eslint-disable no topo.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando build do frontend...\n');

// Verifica se o arquivo .env existe
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath)) {
  console.warn('⚠️  Arquivo .env não encontrado!');
  console.warn('📝 Criando .env a partir do .env.example...\n');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Arquivo .env criado. Configure a VITE_API_URL antes de continuar.\n');
  } else {
    console.error('❌ Arquivo .env.example não encontrado.');
    process.exit(1);
  }
}

// Lê e valida a URL da API
const envContent = fs.readFileSync(envPath, 'utf8');
const apiUrlMatch = envContent.match(/VITE_API_URL=(.+)/);

if (apiUrlMatch && apiUrlMatch[1] && apiUrlMatch[1].trim() !== 'http://localhost:5001') {
  console.log(`✅ URL da API configurada: ${apiUrlMatch[1].trim()}\n`);
} else {
  console.warn('⚠️  VITE_API_URL não configurada ou usando localhost.');
  console.warn('   O app vai funcionar apenas localmente.\n');
}

// Executa o build
try {
  console.log('📦 Executando npm run build...\n');
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('\n✅ Build concluído com sucesso!');
  console.log('📁 Arquivos gerados em: frontend/dist/\n');
} catch (error) {
  console.error('\n❌ Erro durante o build:', error.message);
  process.exit(1);
}
