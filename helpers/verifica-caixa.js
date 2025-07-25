const { supabase } = require('../models/supabaseClient');
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

    const { data, error } = await supabase
      .from('caixa_status')
      .select('aberto')
      .eq('quiosque_id', quiosque)
      .maybeSingle(); // <-- permite zero ou um

    if (error) {
      console.error('Erro no Supabase:', error.message);
      throw error;
    }

    if (!data || data.aberto !== true) {
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
