const pool = require('../models/postgres'); // ajustar caminho
const resp = require('../helpers/res');

exports.verificarCaixaAberto = async (req, res, next) => {
  try {
    const quiosque = req.body?.quiosque || req.params?.quiosque || req.session?.user?.quiosque;

    if (!quiosque) {
      return res.status(400).render('erro', {
        titulo: 'Erro de Verificação',
        mensagem: 'Quiosque não informado para verificação do caixa.',
        imagem: './404png.png',
        icone: '⚠️'
      });
    }

    const query = 'SELECT aberto FROM caixa_status WHERE quiosque_id = $1';
    const result = await pool.query(query, [quiosque]);

    if (result.rows.length === 0 || result.rows[0].aberto !== true) {
      return resp.caixaFechado(res);
    }

    next();

  } catch (err) {
    console.error('Erro ao verificar status do caixa:', err.message);
    return res.status(500).render('erro', {
      titulo: 'Erro Interno',
      mensagem: 'Erro ao consultar o status do caixa.',
      imagem: '404png.png',
      icone: '💥'
    });
  }
};
