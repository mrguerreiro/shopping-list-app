(async () => {
  const base = 'http://127.0.0.1:5001';
  const log = console.log;
  try {
    log('Iniciando teste integrado (simulação frontend)...');
    const now = Date.now();
    // 1. Criar lista
    const listaNome = `TEST_INTEGRATION_${now}`;
    let res = await fetch(`${base}/api/listas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: listaNome, criadoPor: 'IntegrationTester' })
    });
    if (!res.ok) throw new Error(`POST /api/listas falhou: ${res.status}`);
    const lista = await res.json();
    log('Lista criada:', lista._id, lista.nome);

    // 2. Adicionar item
    res = await fetch(`${base}/api/listas/${lista._id}/itens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'item-integ-1' })
    });
    if (!res.ok) throw new Error(`POST /api/listas/:id/itens falhou: ${res.status}`);
    const listaAtualizada = await res.json();
    log('Item adicionado — itens agora:', listaAtualizada.itens.length);
    const novoItem = listaAtualizada.itens.find(i => String(i.nome) === 'item-integ-1');
    if (!novoItem) throw new Error('Não achei o item recém-adicionado');

    // 3. Marcar como comprado
    const itemId = novoItem._id || novoItem.id;
  // Use a mid-day ISO timestamp to avoid timezone edge cases
  const compraData = '2025-11-01T12:00:00';
    res = await fetch(`${base}/api/listas/${lista._id}/itens/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comprado: true, comprador: 'IntegrationTester', dataCompra: compraData })
    });
    if (!res.ok) throw new Error(`PUT /api/listas/:id/itens/:itemId falhou: ${res.status}`);
    const afterPut = await res.json();
    log('Item atualizado (comprado).');

    // 4. Consultar relatório para 2025-11-01
    res = await fetch(`${base}/api/listas/relatorio-compras?dataInicio=2025-11-01&dataFim=2025-11-01`);
    if (!res.ok) throw new Error(`GET relatorio-compras falhou: ${res.status}`);
    const rel = await res.json();
    const found = rel.find(r => r.nome === 'item-integ-1' && r.nomeLista === listaNome);
    log('Relatório encontrou o item antes de deletar?', !!found);

    // 5. Deletar a lista (rota em server.js que move para Historico)
    res = await fetch(`${base}/api/listas/${lista._id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`DELETE /api/listas/:id falhou: ${res.status}`);
    const delRes = await res.json();
    log('Lista deletada (movida para Historico):', delRes.message || JSON.stringify(delRes));

    // 6. Reconsultar relatório para 2025-11-01 — NÃO deve encontrar o item (relatório ignora Historico)
    res = await fetch(`${base}/api/listas/relatorio-compras?dataInicio=2025-11-01&dataFim=2025-11-01`);
    if (!res.ok) throw new Error(`GET relatorio-compras pós-delete falhou: ${res.status}`);
    const rel2 = await res.json();
    const foundAfterDelete = rel2.find(r => r.nome === 'item-integ-1' && r.nomeLista === listaNome);
    log('Relatório encontrou o item após delete (deveria ser false):', !!foundAfterDelete);

    if (found && !foundAfterDelete) {
      log('Teste integrado: SUCESSO — relatório inclui apenas listas ativas.');
      process.exit(0);
    } else {
      console.error('Teste integrado: FALHOU — comportamento inesperado.');
      process.exit(2);
    }
  } catch (err) {
    console.error('Erro durante teste integrado:', err);
    process.exit(1);
  }
})();
