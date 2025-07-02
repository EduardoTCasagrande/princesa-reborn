const express = require('express');
const router = express.Router();
const path = require('path');
const precoController = require('../controllers/precoController');
const { apenasAdmin } = require('../helpers/auth');

// Página HTML para cadastro de SKU
router.get('/cadastrar-sku', (req, res) => {
  res.render('sku');
});
router.post('/cadastrar-sku', precoController.uploadMiddleware, precoController.cadastrarSku);

// API JSON para listar preços
router.get('/api/precos', precoController.listarPrecos);

// Página de preços
router.get('/precos', precoController.precosPage);

// Adicionar ou atualizar preço
router.post('/precos', precoController.adicionarPreco);

// Atualizar preço diretamente por SKU
router.put('/precos/:sku', precoController.atualizarPreco);

// Deletar preço por SKU
router.delete('/precos/:sku', precoController.deletarPreco);

// ✅ NOVA ROTA para renomear um SKU
router.post('/precos/renomear', precoController.renomearSKU);

module.exports = router;
