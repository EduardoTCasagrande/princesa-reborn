const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { apenasAdmin } = require('../helpers/auth');

// Página principal
router.get('/gerenciar-usuarios', apenasAdmin, usuarioController.gerenciarPage);

// Ações do admin
router.post('/atualizar-senha', usuarioController.atualizarSenha);
router.post('/usuarios/atualizar-quiosque', usuarioController.atualizarQuiosque);
router.post('/usuarios/atualizar-username', usuarioController.atualizarUsername);
router.post('/quiosques/atualizar-nome', usuarioController.atualizarNomeQuiosque);

module.exports = router;
