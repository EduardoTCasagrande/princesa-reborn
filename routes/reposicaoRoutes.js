const express = require('express');
const router = express.Router();
const reposicaoController = require('../controllers/reposicaoController');
const verificarReposicaoAberta = require('../helpers/open');
const { apenasAdmin } = require('../helpers/auth');

router.get('/',verificarReposicaoAberta, reposicaoController.renderReposicaoPage);
router.get('/mobile', reposicaoController.renderReposicaoPageMobile);
router.get('/bonecas', reposicaoController.renderReposicao);
router.post('/nova', reposicaoController.salvarReposicao);
router.post('/bipar', reposicaoController.biparSku);
router.get('/banco/:quiosque', reposicaoController.getReposicaoBanco);
router.post('/finalizar', reposicaoController.finalizarReposicao);
router.post('/resetar', reposicaoController.resetarReposicao);
router.get('/estoque/:nome', reposicaoController.getEstoquePorQuiosque);


module.exports = router;
