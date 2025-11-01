// script para testar a rota de relatório de frequência
const fetch = require('node-fetch');

const testRoute = async () => {
  try {
    // Testa a rota raiz primeiro
    console.log('Testando rota raiz...');
    let response = await fetch('http://localhost:5001/');
    let text = await response.text();
    console.log('Rota raiz - Status:', response.status);
    console.log('Rota raiz - Response:', text);

    console.log('\nTestando rota de relatório...');
    console.log('Fazendo requisição GET para http://localhost:5001/api/relatorios/frequencia?itemNome=Tomate');
    response = await fetch('http://localhost:5001/api/relatorios/frequencia?itemNome=Tomate');
    text = await response.text();
    console.log('Relatório - Status:', response.status);
    console.log('Relatório - Response:', text);
  } catch (err) {
    console.error('Error:', err.message || err);
    if (err.cause) {
      console.error('Cause:', err.cause);
    }
  }
}

testRoute();