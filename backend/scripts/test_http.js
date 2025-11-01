const http = require('http');

const testRoute = () => {
  console.log('Testando rota de relatório...');
  
  const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/relatorios/frequencia?itemNome=Tomate',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Response:', data);
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error);
  });

  req.end();
};

testRoute();