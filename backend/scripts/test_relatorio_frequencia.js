const axios = require('axios');
const itemNome = process.argv[2] || 'Leite';

(async () => {
  console.error('Iniciando teste de frequência para item:', itemNome);
  try {
    const url = `http://localhost:5001/api/listas/relatorio-frequencia?itemNome=${encodeURIComponent(itemNome)}`;
    console.error('URL:', url);
    const res = await axios.get(url);
    const text = res.data;
    console.error('STATUS:', res.status);
    console.error('DATA:', JSON.stringify(text, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('ERR', err.message || err);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
    process.exit(1);
  }
})();
