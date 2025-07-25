// routes/caixa.js
const express = require('express');
const router = express.Router();
const caixaController = require('../controllers/caixaController');
const { verificarCaixaAberto } = require('../helpers/verifica-caixa');
const { apenasAdmin } = require('../helpers/auth');

router.get('/api/caixa/:quiosque', caixaController.getCaixaTotal);
router.get('/api/caixa/historico/:quiosque', caixaController.getHistoricoCaixa);
router.post('/api/sangria', verificarCaixaAberto,verificarCaixaAberto, caixaController.registrarSangria);
router.get('/sangria', caixaController.renderSangriaPage);
router.get('/api/caixa/relatorio/:quiosque', caixaController.gerarRelatorioDoDia);

router.post('/api/caixa/abrir', caixaController.abrirCaixa);
router.post('/api/caixa/fechar', caixaController.fecharCaixa);
router.get('/api/caixa/status/:quiosque', caixaController.verificarStatusCaixa);
router.post('/api/caixa/ajustar', apenasAdmin, caixaController.ajustarSaldoCaixa);
router.get('/ajustar-caixa', apenasAdmin, (req, res) => {
  res.render('ajustar-caixa'); 
});

module.exports = router;
