const express = require('express');
const router = express.Router();
const Lista = require('../models/Lista');

console.log('Carregando módulo de relatórios...');

// Log todas as requisições neste roteador
router.use((req, res, next) => {
    console.log(`[DEBUG] ${req.method} ${req.baseUrl}${req.path} - Query:`, req.query);
    next();
});

// Rota: Relatório de Frequência de Compra (GET /api/relatorios/frequencia)
router.get('/frequencia', async (req, res) => {
    try {
        console.log('[relatorio-frequencia] handler start - query:', req.query);
        const { itemNome } = req.query;
        if (!itemNome) {
            return res.status(400).json({ message: 'Nome do item é obrigatório' });
        }

        // Normaliza e cria regex de busca (escape do termo para evitar regex injection)
        const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const itemRegex = new RegExp(escapeRegex(itemNome), 'i');

        const pipeline = [
            { $unwind: '$itens' },
            { $match: { 'itens.comprado': true, 'itens.nome': itemRegex, 'itens.dataCompra': { $ne: null } } },
            { $project: { nome: '$itens.nome', dataCompra: '$itens.dataCompra' } }
        ];

        console.log('[relatorio-frequencia] running aggregations...');
        const comprasAtivas = await Lista.aggregate(pipeline);
        console.log('[relatorio-frequencia] aggregations done - ativas:', comprasAtivas.length);

        // Coerção de data: garantir que dataCompra é um timestamp (number)
        const normalize = (arr) => arr
            .map(it => ({ nome: it.nome ? String(it.nome).trim() : '', dataCompra: it.dataCompra ? new Date(it.dataCompra) : null }))
            .filter(it => it.nome && it.dataCompra && !isNaN(it.dataCompra.getTime()))
            .map(it => ({ nome: String(it.nome).trim(), nomeNorm: String(it.nome).trim().toLowerCase(), dataCompra: it.dataCompra.getTime() }));

        const normAtivas = normalize(comprasAtivas);
        console.log('[relatorio-frequencia] normalized - ativas:', normAtivas.length);

        // Filtrar apenas pelo item solicitado (ignorando comprador)
        const termoNorm = String(itemNome).trim().toLowerCase();
        const todasCompras = normAtivas
            .filter(it => it.nomeNorm.includes(termoNorm))
            .sort((a, b) => b.dataCompra - a.dataCompra);

        let frequenciaMediaDias = null;
        if (todasCompras.length > 1) {
            let somaIntervalos = 0;
            for (let i = 1; i < todasCompras.length; i++) {
                const intervalo = todasCompras[i - 1].dataCompra - todasCompras[i].dataCompra; // ms
                somaIntervalos += intervalo / (1000 * 60 * 60 * 24);
            }
            frequenciaMediaDias = somaIntervalos / (todasCompras.length - 1);
        }

        // Reconstruir ultimas compras com ISO dates para resposta
        const ultimasCompras = todasCompras.slice(0, 5).map(it => ({ 
            nome: it.nome, 
            dataCompra: new Date(it.dataCompra).toISOString() 
        }));

        console.log('[relatorio-frequencia] result - total:', todasCompras.length, 'freqDays:', frequenciaMediaDias);
        res.json({ 
            itemNome: itemNome, 
            numeroTotalDeCompras: todasCompras.length, 
            frequenciaMediaDias, 
            ultimasCompras 
        });
    } catch (err) {
        console.error('Erro no relatório de frequência:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;