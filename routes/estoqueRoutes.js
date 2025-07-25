const express = require('express');
const router = express.Router();
const estoqueController = require('../controllers/estoqueController');

// Página do estoque
router.get('/estoque', estoqueController.estoque);

// API que carrega o estoque (usada pelo JS do front)
router.get('/api/estoque', estoqueController.buscarEstoquePorSessao);

router.get('/api/quiosques', estoqueController.listarQuiosques);
router.get('/conferencia', estoqueController.paginaConferencia);
router.post('/conferencia', estoqueController.atualizarEstoqueConferencia);
router.post('/atualizar', estoqueController.atualizarEstoque);




module.exports = router;
