const express = require('express');
const router = express.Router();
const reposicaoController = require('../controllers/reposicaoController');

// Página principal de reposição genérica (se quiser)
router.get('/', reposicaoController.renderReposicaoPage);

// Página mobile
router.get('/mobile', reposicaoController.renderReposicaoPageMobile);

// Página para separar bonecas
router.get('/bonecas', reposicaoController.renderReposicao);

// POST para salvar a reposição (que seu form envia para /reposicao/nova)
router.post('/nova', reposicaoController.salvarReposicao);

// POST para bipar SKU
router.post('/bipar', reposicaoController.biparSku);

router.get('/banco/:quiosque', reposicaoController.getReposicaoBanco);

router.post('/finalizar', reposicaoController.finalizarReposicao);

router.post('/resetar', reposicaoController.resetarReposicao);

module.exports = router;
