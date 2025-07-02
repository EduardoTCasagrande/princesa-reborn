const express = require('express');
const router = express.Router();
const quiosqueController = require('../controllers/quiosqueController');
const pool = require('../models/postgres');
const { apenasAdmin } = require('../helpers/auth');

router.get('/quiosque', quiosqueController.page);
router.get('/quiosques', quiosqueController.listar);
router.post('/add', quiosqueController.adicionar);

// Rota para obter range e colunas pelo nome do quiosque (PostgreSQL)
router.get('/quiosque-info/:nome', async (req, res) => {
  const nome = req.params.nome;

  try {
    const result = await pool.query(
      'SELECT range, colunas FROM quiosques WHERE nome = $1',
      [nome]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'erro', mensagem: 'Quiosque não encontrado.' });
    }

    const row = result.rows[0];
    res.json({
      status: 'ok',
      quiosque: nome,
      range: row.range,
      colunas: row.colunas
    });
  } catch (err) {
    console.error('Erro ao buscar informações do quiosque:', err.message);
    res.status(500).json({ status: 'erro', mensagem: 'Erro interno ao buscar quiosque.' });
  }
});

module.exports = router;
