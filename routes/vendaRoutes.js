const express = require('express');
const router = express.Router();
const vendaController = require('../controllers/vendaController');
const { apenasAdmin } = require('../helpers/auth');
const { verificarCaixaAberto } = require('../helpers/verifica-caixa');


// Rotas de venda
router.get('/vendas', verificarCaixaAberto, vendaController.vendasPage);
router.post('/vender', vendaController.vender);

// Rota para carregar a página do histórico (carrega o EJS)
router.get('/historico', vendaController.renderHistoricoPage);

// Rota para o AJAX buscar os dados (retorna JSON)
router.get('/historico-vendas', vendaController.historico);
router.get('/reimprimir-cupom', vendaController.reimprimirCupom);
router.post('/emitir-nota', vendaController.emitirNotaFiscal);
router.get('/nfce/:id/pdf', vendaController.getPdfNotaFiscal);


module.exports = router;
