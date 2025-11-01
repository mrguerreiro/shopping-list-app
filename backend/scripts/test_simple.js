const http = require('http');

const testarRota = (rota) => {
  return new Promise((resolve, reject) => {
    const request = http.get(`http://localhost:5001${rota}`, (response) => {
      let data = '';
      console.log(`[DEBUG] Recebidos headers para ${rota}:`, response.headers);

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        resolve({ 
          statusCode: response.statusCode, 
          headers: response.headers,
          data 
        });
      });
    });

    request.on('error', (err) => {
      reject(err);
    });

    request.end();
  });
};

const main = async () => {
  try {
    console.log('Testando rotas do servidor...\n');

    // 1. Teste da rota raiz
    console.log('1. Testando rota raiz (/):');
    const rootResult = await testarRota('/');
    console.log(`Status: ${rootResult.statusCode}`);
    console.log('Resposta:', rootResult.data);
    console.log('---\n');

    // 2. Teste da rota de relatórios
    console.log('2. Testando rota de relatórios:');
    const relatorioResult = await testarRota('/api/relatorios/frequencia?itemNome=Tomate');
    console.log(`Status: ${relatorioResult.statusCode}`);
    console.log('Headers:', relatorioResult.headers);
    console.log('Resposta:', relatorioResult.data);
    
  } catch (err) {
    console.error('Erro:', err.message);
  }
};

console.log('Iniciando testes...');
main();