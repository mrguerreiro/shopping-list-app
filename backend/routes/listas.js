const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Lista = require('../models/Lista');
const Historico = require('../models/Historico');

// ===================================
// ROTAS CRUD (INCLUINDO A ROTA POST QUE SUMIU)
// ===================================

// Rota 1: Criar nova lista (POST /api/listas)
router.post('/', async (req, res) => {
    const novaLista = new Lista(req.body);
    try {
        await novaLista.save();
        res.status(201).json(novaLista);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ===================================
// ROTAS DE RELATÓRIO (movidas para antes de rotas com ':id' para evitar conflito)
// ===================================

// Função auxiliar para processar itens do relatório
const processarItem = (item, lista, origem) => {
    if (!item?.dataCompra || !item.comprado) return null;
    
    const dataCompra = new Date(item.dataCompra);
    if (isNaN(dataCompra.getTime())) return null;

    return {
        _id: String(item._id || ''),
        nome: String(item.nome || '').trim(),
        comprador: String(item.comprador || 'Não informado').trim(),
        dataCompra: dataCompra.toISOString(),
        nomeLista: String(lista.nome || 'Lista sem nome').trim(),
        criadoPor: String(lista.criadoPor || 'Não informado').trim(),
        origem
    };
};

router.get('/relatorio-compras', async (req, res) => {
    try {
        console.log('\n=== INÍCIO DO RELATÓRIO DE COMPRAS ===');
        console.log('Timestamp:', new Date().toISOString());

        // 1. Validação da conexão com o MongoDB
        if (mongoose.connection.readyState !== 1) {
            throw new Error('MongoDB não está conectado');
        }

        // 2. Validação dos parâmetros
        // Permitir também requisições que peçam filter por nomeLista sem datas
        const { dataInicio, dataFim, nomeLista } = req.query;
        if (!nomeLista && (!dataInicio || !dataFim)) {
            return res.status(400).json({
                error: 'Parâmetros inválidos',
                message: 'Data inicial e final são obrigatórias (ou forneça nomeLista para filtrar por nome)',
                received: req.query
            });
        }

        // Extrai e valida parâmetros usados posteriormente
        const { dataInicio: di, dataFim: df } = req.query;

        // Parseia datas YYYY-MM-DD de forma determinística como datas LOCAIS
        const parseLocalDate = (s) => {
            const parts = String(s).split('-').map(Number);
            if (parts.length !== 3) return new Date(NaN);
            const [y, m, d] = parts;
            return new Date(y, m - 1, d); // cria no horário local
        };

        let dataInicioObj = null;
        let dataFimObj = null;

        if (di && df) {
            dataInicioObj = parseLocalDate(di);
            dataFimObj = parseLocalDate(df);

            console.log('Datas convertidas (local):', {
                inicio: dataInicioObj.toString(),
                fim: dataFimObj.toString()
            });

            // Ajusta horários para o intervalo completo do dia (local)
            dataInicioObj.setHours(0, 0, 0, 0);
            dataFimObj.setHours(23, 59, 59, 999);

            console.log('Datas ajustadas:', {
                inicio: dataInicioObj.toISOString(),
                fim: dataFimObj.toISOString()
            });

            if (isNaN(dataInicioObj.getTime()) || isNaN(dataFimObj.getTime())) {
                console.warn('Datas inválidas:', { dataInicio: di, dataFim: df });
                return res.status(400).json({ 
                    message: 'Datas inválidas. Use o formato YYYY-MM-DD',
                    dataInicio: di,
                    dataFim: df
                });
            }

            console.log('Datas validadas:', {
                inicio: dataInicioObj.toISOString(),
                fim: dataFimObj.toISOString()
            });
        }

    // 3. Se foi solicitado filtrar por nome da lista, usar fluxo alternativo
    if (nomeLista) {
            console.log('Filtro por nomeLista detectado:', nomeLista);
            const nomeRegex = new RegExp(String(nomeLista), 'i');

            // Busca listas ativas e histórico que tenham o nome informado
            const [listasAtivasRaw, listasHistoricoRaw] = await Promise.all([
                Lista.find({ nome: nomeRegex }).lean(),
                Historico.find({ nome: nomeRegex }).lean()
            ]);

            console.log('Listas encontradas (ativas):', listasAtivasRaw.length);
            console.log('Listas encontradas (historico):', listasHistoricoRaw.length);

            const itensResultado = [];

            const opcaoFiltrarPorData = !!(req.query.dataInicio && req.query.dataFim);

            // Função para checar intervalo se necessário
            const dentroDoPeriodo = (data) => {
                if (!opcaoFiltrarPorData) return true;
                const dt = new Date(data);
                return dt >= dataInicioObj && dt <= dataFimObj;
            };

            const mapearItens = (lista, origem) => {
                if (!lista || !Array.isArray(lista.itens)) return;
                for (const item of lista.itens) {
                    // Apenas itens marcados como comprados devem ser retornados (solicitação do usuário)
                    if (!item || !item.comprado) continue;

                    // Se houver filtro por data, só considerar itens com dataCompra válida no período
                    if (opcaoFiltrarPorData && !item.dataCompra) continue;
                    if (item.dataCompra && !dentroDoPeriodo(item.dataCompra)) continue;

                    itensResultado.push({
                        _id: (item._id || item.id)?.toString(),
                        nome: item.nome || 'Item sem nome',
                        comprador: item.comprador || 'Não informado',
                        dataCompra: item.dataCompra ? new Date(item.dataCompra).toISOString() : null,
                        nomeLista: lista.nome || 'Lista sem nome',
                        criadoPor: lista.criadoPor || 'Não informado',
                        origem: origem,
                        comprado: !!item.comprado
                    });
                }
            };

            for (const l of listasAtivasRaw) mapearItens(l, 'lista_ativa');
            for (const h of listasHistoricoRaw) mapearItens(h, 'historico');

            // Ordena por dataCompra (mais recente primeiro)
            itensResultado.sort((a, b) => {
                const da = a.dataCompra ? new Date(a.dataCompra) : 0;
                const dbv = b.dataCompra ? new Date(b.dataCompra) : 0;
                return dbv - da;
            });

            console.log('Itens retornados pelo filtro nomeLista:', itensResultado.length);
            return res.json(itensResultado);
        }

        // 4. Busca nas listas ativas e histórico (fluxo padrão por data)
        const pipeline = [
            { $unwind: '$itens' },
            {
                $match: {
                    'itens.comprado': true,
                    'itens.dataCompra': {
                        $gte: dataInicioObj,
                        $lte: dataFimObj
                    }
                }
            },
            {
                $project: {
                    nome: 1,
                    criadoPor: 1,
                    dataCriacao: 1,
                    itens: [{
                        _id: '$itens._id',
                        nome: '$itens.nome',
                        comprador: '$itens.comprador',
                        dataCompra: '$itens.dataCompra',
                        comprado: '$itens.comprado'
                    }]
                }
            }
        ];

        // 5. Executa queries em paralelo
        let listasAtivas = [];
        let listasHistorico = [];
        try {
            [listasAtivas, listasHistorico] = await Promise.all([
                Lista.aggregate(pipeline),
                Historico.aggregate(pipeline)
            ]);

            if (!Array.isArray(listasAtivas) || !Array.isArray(listasHistorico)) {
                throw new Error('Resultado inválido da busca no banco de dados');
            }

            console.log('Resultados da busca:', {
                listasAtivas: listasAtivas.length,
                listasHistorico: listasHistorico.length,
                primeiraListaAtiva: listasAtivas[0]?._id || 'Nenhuma',
                primeiraListaHistorico: listasHistorico[0]?._id || 'Nenhuma'
            });
        } catch (dbError) {
            console.error('Erro na busca do banco de dados:', dbError);
            throw new Error(`Erro ao buscar dados: ${dbError.message}`);
        }

        // 4. Processa itens das listas ativas
        console.log('\n=== PROCESSANDO LISTAS ATIVAS ===');
        const itensComprados = [];
        for (const lista of listasAtivas) {
            if (!lista) {
                console.warn('Lista inválida encontrada');
                continue;
            }

            console.log(`\nProcessando lista: ${lista._id} - ${lista.nome || 'Sem nome'}`);
            if (!Array.isArray(lista.itens)) {
                console.warn('Lista com itens inválidos:', { id: lista._id, itensType: typeof lista.itens });
                continue;
            }

            console.log(`Lista ${lista._id} tem ${lista.itens.length} itens`);
            for (const item of lista.itens) {
                try {
                    if (!item || typeof item !== 'object') {
                        console.warn('Item inválido encontrado:', item);
                        continue;
                    }

                    const itemValido = item.nome && (item.comprado === true || item.comprado === false) && (item._id || item.id);
                    if (!itemValido) {
                        console.warn('Item com estrutura inválida:', { id: item._id || item.id, nome: item.nome, comprado: item.comprado });
                        continue;
                    }

                    if (!item.comprado || !item.dataCompra) {
                        console.log('Item não comprado ou sem data:', { id: item._id || item.id, nome: item.nome, comprado: item.comprado, dataCompra: item.dataCompra });
                        continue;
                    }

                    const dataCompra = new Date(item.dataCompra);
                    if (isNaN(dataCompra.getTime())) {
                        console.warn('Data de compra inválida:', { id: item._id || item.id, nome: item.nome, dataCompra: item.dataCompra });
                        continue;
                    }

                    const itemProcessado = {
                        _id: (item._id || item.id)?.toString(),
                        nome: String(item.nome || '').trim(),
                        comprador: String(item.comprador || 'Não informado').trim(),
                        dataCompra: dataCompra.toISOString(),
                        nomeLista: String(lista.nome || 'Lista sem nome').trim(),
                        criadoPor: String(lista.criadoPor || 'Não informado').trim(),
                        origem: 'lista_ativa',
                        dataCriacao: lista.dataCriacao ? new Date(lista.dataCriacao).toISOString() : null
                    };
                    itensComprados.push(itemProcessado);
                    console.log('Item adicionado ao relatório:', { nome: item.nome, dataCompra: dataCompra.toISOString() });
                } catch (itemErr) {
                    console.error('Erro ao processar item:', { erro: itemErr.message, item: item });
                }
            }
        }

        // 5. Processa listas do histórico
        console.log('\n=== PROCESSANDO HISTÓRICO ===');
        for (const lista of listasHistorico) {
            if (!lista || !Array.isArray(lista.itens)) {
                console.warn('Lista do histórico inválida:', lista?._id);
                continue;
            }

            console.log(`Processando lista histórica: ${lista._id} - ${lista.nome || 'Sem nome'}`);
            for (const item of lista.itens) {
                try {
                    if (!item || !item.comprado || !item.dataCompra) {
                        continue;
                    }

                    const dataCompra = new Date(item.dataCompra);
                    if (isNaN(dataCompra.getTime())) {
                        console.warn('Data de compra inválida no histórico:', { lista: lista._id, item: item._id, dataCompra: item.dataCompra });
                        continue;
                    }

                    if (dataCompra >= dataInicioObj && dataCompra <= dataFimObj) {
                        itensComprados.push({
                            _id: (item._id || item.id)?.toString(),
                            nome: item.nome || 'Item sem nome',
                            comprador: item.comprador || 'Não informado',
                            dataCompra: dataCompra,
                            nomeLista: lista.nome || 'Lista sem nome',
                            criadoPor: lista.criadoPor || 'Não informado',
                            origem: 'historico'
                        });

                        console.log('Item histórico adicionado:', { nome: item.nome, dataCompra: dataCompra.toISOString() });
                    }
                } catch (itemErr) {
                    console.error('Erro ao processar item do histórico:', { erro: itemErr.message, item: item });
                }
            }
        }

        console.log('\n=== FINALIZANDO RELATÓRIO ===');
        // Ordena por data de compra (mais recente primeiro)
        itensComprados.sort((a, b) => new Date(b.dataCompra) - new Date(a.dataCompra));
        console.log('Total de itens no relatório:', itensComprados.length);
        if (itensComprados.length > 0) {
            console.log('Exemplo do primeiro item:', { nome: itensComprados[0].nome, dataCompra: itensComprados[0].dataCompra, lista: itensComprados[0].nomeLista });
        }

        res.json(itensComprados);
    } catch (err) {
        console.error('\n=== ERRO NO RELATÓRIO DE COMPRAS ===');
        console.error('Timestamp:', new Date().toISOString());
        console.error('Tipo do erro:', err.constructor.name);
        console.error('Nome do erro:', err.name);
        console.error('Mensagem:', err.message);
        try {
            const dbStatus = {
                listasConectado: Boolean(Lista?.db?.readyState === 1),
                historicoConectado: Boolean(Historico?.db?.readyState === 1)
            };
            console.error('Status das conexões:', dbStatus);
        } catch (statusErr) {
            console.error('Erro ao verificar status do banco:', statusErr.message);
        }

        const errorDetails = {
            timestamp: new Date().toISOString(),
            name: err.name,
            message: err.message,
            code: err.code,
            type: err.constructor.name,
            cause: err.cause,
            path: req?.path,
            query: req?.query,
            stack: err.stack?.split('\n').slice(0, 5)
        };

        console.error('Detalhes completos do erro:', JSON.stringify(errorDetails, null, 2));
        // Grava erro em log (arquivo) para análise posterior
        try {
            const logsDir = path.join(__dirname, '..', 'logs');
            if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
            const logPath = path.join(logsDir, 'relatorio-error.log');
            const payload = `\n=== ${new Date().toISOString()} ===\n${JSON.stringify(errorDetails, null, 2)}\n`;
            fs.appendFileSync(logPath, payload, { encoding: 'utf8' });
        } catch (logErr) {
            console.error('Falha ao gravar log de erro:', logErr);
        }

        res.status(500).json({ 
            error: 'Erro ao gerar relatório de compras',
            message: err.message,
            details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
        });
    }
});

// Rota 2: Obter todas as listas (GET /api/listas)
router.get('/', async (req, res) => {
    try {
        // Encontra todas as listas ativas, ordenadas pela mais recente
        const listas = await Lista.find().sort({ dataCriacao: -1 });
        res.json(listas);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rota 3: Obter uma lista específica (GET /api/listas/:id)
router.get('/:id', async (req, res) => {
    try {
        const lista = await Lista.findById(req.params.id);
        if (!lista) {
            return res.status(404).json({ message: 'Lista não encontrada.' });
        }
        res.json(lista);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rota 4: Atualizar uma lista (PUT /api/listas/:id)
router.put('/:id', async (req, res) => {
    try {
        const lista = await Lista.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // Retorna o documento atualizado
            runValidators: true,
        });
        if (!lista) {
            return res.status(404).json({ message: 'Lista não encontrada.' });
        }
        res.json(lista);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Rota para atualizar um item específico de uma lista (PUT /api/listas/:id/itens/:itemId)
router.put('/:id/itens/:itemId', async (req, res) => {
    try {
        const lista = await Lista.findById(req.params.id);
        if (!lista) {
            return res.status(404).json({ message: 'Lista não encontrada.' });
        }

        const item = lista.itens.id(req.params.itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item não encontrado.' });
        }

        // Atualiza os campos do item
        if (req.body.comprado !== undefined) item.comprado = req.body.comprado;
        if (req.body.comprador !== undefined) item.comprador = req.body.comprador;
        if (req.body.dataCompra !== undefined) item.dataCompra = req.body.dataCompra;
        if (req.body.nome !== undefined) item.nome = req.body.nome;

        await lista.save();
        res.json(lista);
    } catch (err) {
        console.error('Erro ao atualizar item:', err);
        res.status(400).json({ error: err.message });
    }
});

// Rota 5: Deletar ou Mover para Histórico (DELETE /api/listas/:id)
// Esta rota é mantida no server.js para o Historico

// Rota para adicionar um item a uma lista (POST /api/listas/:id/itens)
router.post('/:id/itens', async (req, res) => {
    try {
        const lista = await Lista.findById(req.params.id);
        if (!lista) {
            return res.status(404).json({ message: 'Lista não encontrada.' });
        }

        const novoItem = {
            nome: req.body.nome,
            comprado: false,
            comprador: null,
            dataCompra: null
        };

        lista.itens.push(novoItem);
        await lista.save();
        
        res.json(lista);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Rota para deletar um item de uma lista (DELETE /api/listas/:id/itens/:itemId)
router.delete('/:id/itens/:itemId', async (req, res) => {
    try {
        const inicio = Date.now();
        console.log('DELETE /api/listas/:id/itens/:itemId -> params:', req.params);

        // Valida IDs
        const { id, itemId } = req.params;
        const mongoose = require('mongoose');
        
        // Validação mais detalhada dos IDs
        if (!id || !itemId) {
            console.warn('IDs ausentes na requisição:', req.params);
            return res.status(400).json({ message: 'ID da lista e do item são obrigatórios.' });
        }
        
        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(itemId)) {
            console.warn('IDs inválidos recebidos para exclusão:', req.params);
            return res.status(400).json({ message: 'ID da lista ou do item inválido.' });
        }

        // Usa operação atômica $pull para remover o subdocumento pelo _id
        const updatedLista = await Lista.findByIdAndUpdate(
            id,
            { $pull: { itens: { _id: itemId } } },
            { new: true }
        );

        if (!updatedLista) {
            console.warn('Lista não encontrada para id (após pull):', id);
            return res.status(404).json({ message: 'Lista não encontrada.' });
        }

        console.log('Item removido com sucesso via $pull:', itemId, 'da lista', id);
        const tempoExecucao = Date.now() - inicio;
        console.log(`Exclusão concluída em ${tempoExecucao}ms`);
        res.json(updatedLista);
    } catch (err) {
        console.error('Erro ao deletar item (stack):', err);
        console.error('Detalhes do erro:', err.response?.data || err.message);
        res.status(500).json({ 
            error: err.message,
            details: err.response?.data || 'Erro interno do servidor'
        });
    }
});

module.exports = router;

// Rota: Relatório de Compras por Usuário (GET /api/listas/relatorio-usuario)
router.get('/relatorio-usuario/:tipo', async (req, res) => {
    try {
        const { usuario, dataInicio, dataFim } = req.query;
        const tipo = req.params.tipo; // 'comprados' ou 'solicitados'

        if (!usuario || !dataInicio || !dataFim) {
            return res.status(400).json({ message: 'Usuário e datas são obrigatórios' });
        }

        console.log('Buscando relatório para usuário:', usuario, 'tipo:', tipo);
        console.log('Período:', dataInicio, 'até', dataFim);

        const dataInicioObj = new Date(dataInicio);
        const dataFimObj = new Date(dataFim);
        dataFimObj.setHours(23, 59, 59, 999);

        let resultado = [];
        
        if (tipo === 'comprados') {
            const itensAtivos = await Lista.aggregate([
                { $unwind: '$itens' },
                {
                    $match: {
                        'itens.comprado': true,
                        'itens.comprador': { $regex: new RegExp(usuario, 'i') },
                        'itens.dataCompra': { 
                            $gte: dataInicioObj,
                            $lte: dataFimObj 
                        }
                    }
                },
                {
                    $project: {
                        _id: '$itens._id',
                        nome: '$itens.nome',
                        dataCompra: '$itens.dataCompra',
                        nomeLista: '$nome',
                        comprador: '$itens.comprador'
                    }
                }
            ]);

            console.log('Itens encontrados em listas ativas:', itensAtivos.length);

            const itensHistorico = await Historico.aggregate([
                { $unwind: '$itens' },
                {
                    $match: {
                        'itens.comprado': true,
                        'itens.comprador': { $regex: new RegExp(usuario, 'i') },
                        'itens.dataCompra': { 
                            $gte: dataInicioObj,
                            $lte: dataFimObj 
                        }
                    }
                },
                {
                    $project: {
                        _id: '$itens._id',
                        nome: '$itens.nome',
                        dataCompra: '$itens.dataCompra',
                        nomeLista: '$nome',
                        comprador: '$itens.comprador'
                    }
                }
            ]);

            console.log('Itens encontrados no histórico:', itensHistorico.length);

            resultado = [...itensAtivos, ...itensHistorico].sort((a, b) => {
                return new Date(b.dataCompra) - new Date(a.dataCompra);
            });

        } else if (tipo === 'solicitados') {
            const [listasAtivas, listasHistorico] = await Promise.all([
                Lista.find({
                    criadoPor: { $regex: new RegExp(usuario, 'i') },
                    dataCriacao: { $gte: dataInicioObj, $lte: dataFimObj }
                }).select('nome dataCriacao criadoPor'),
                Historico.find({
                    criadoPor: { $regex: new RegExp(usuario, 'i') },
                    dataCriacao: { $gte: dataInicioObj, $lte: dataFimObj }
                }).select('nome dataCriacao criadoPor')
            ]);

            console.log('Listas ativas encontradas:', listasAtivas.length);
            console.log('Listas no histórico encontradas:', listasHistorico.length);

            resultado = [...listasAtivas, ...listasHistorico].sort((a, b) => {
                return new Date(b.dataCriacao) - new Date(a.dataCriacao);
            });
        }

        console.log('Total de resultados:', resultado.length);
        res.json(resultado);
    } catch (err) {
        console.error('Erro no relatório por usuário:', err);
        res.status(500).json({ error: err.message });
    }
});

// Rota: Relatório de Frequência de Compra (GET /api/listas/relatorio-frequencia)
router.get('/relatorio-frequencia', async (req, res) => {
    try {
        const { itemNome } = req.query;

        if (!itemNome) {
            return res.status(400).json({ message: 'Nome do item é obrigatório' });
        }

        const itemRegex = new RegExp(itemNome, 'i');

        const [comprasAtivas, comprasHistorico] = await Promise.all([
            Lista.aggregate([
                { $unwind: '$itens' },
                {
                    $match: {
                        'itens.comprado': true,
                        'itens.nome': itemRegex,
                        'itens.dataCompra': { $ne: null }
                    }
                },
                {
                    $project: {
                        nome: '$itens.nome',
                        dataCompra: '$itens.dataCompra'
                    }
                }
            ]),
            Historico.aggregate([
                { $unwind: '$itens' },
                {
                    $match: {
                        'itens.comprado': true,
                        'itens.nome': itemRegex,
                        'itens.dataCompra': { $ne: null }
                    }
                },
                {
                    $project: {
                        nome: '$itens.nome',
                        dataCompra: '$itens.dataCompra'
                    }
                }
            ])
        ]);

        const todasCompras = [...comprasAtivas, ...comprasHistorico].sort((a, b) => b.dataCompra - a.dataCompra);

        let frequenciaMediaDias = null;
        if (todasCompras.length > 1) {
            let somaIntervalos = 0;
            for (let i = 1; i < todasCompras.length; i++) {
                const intervalo = todasCompras[i-1].dataCompra - todasCompras[i].dataCompra;
                somaIntervalos += intervalo / (1000 * 60 * 60 * 24);
            }
            frequenciaMediaDias = somaIntervalos / (todasCompras.length - 1);
        }

        res.json({
            itemNome: itemNome,
            numeroTotalDeCompras: todasCompras.length,
            frequenciaMediaDias: frequenciaMediaDias,
            ultimasCompras: todasCompras.slice(0, 5)
        });
    } catch (err) {
        console.error('Erro no relatório de frequência:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;