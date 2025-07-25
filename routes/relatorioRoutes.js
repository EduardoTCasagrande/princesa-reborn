const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');
const { apenasAdmin } = require('../helpers/auth');

// Página geral
router.get('/relatorios', apenasAdmin,relatorioController.page);

// APIs por tipo
router.get('/relatorios/listar/:tipo', relatorioController.listar);
router.get('/relatorios/ler/:tipo/:nomeArquivo', relatorioController.ler);
router.delete('/relatorios/excluir/:tipo/:nomeArquivo', relatorioController.deletar);
router.post('/relatorios/salvar', relatorioController.salvar);

module.exports = router;
