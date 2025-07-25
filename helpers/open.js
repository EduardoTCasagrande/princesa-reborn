const { supabase } = require('../models/supabaseClient');
const errosController = require('./res');

async function verificarReposicaoAberta(req, res, next) {
  try {
    console.log('Sessão user:', req.session?.user);

    const quiosqueId = req.session?.user?.quiosque_id || req.session?.user?.quiosque;

    if (!quiosqueId) {
      console.log('quiosque_id inválido:', quiosqueId);
      return errosController.fechado(res);
    }

    const { data: reposicao, error } = await supabase
      .from('reposicoes_planejadas')
      .select('status')
      .eq('quiosque_id', quiosqueId)
      .eq('status', 'pendente')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Erro buscando reposicao pendente:', error);
      throw error;
    }

    if (!reposicao) {
      // Nenhuma reposição pendente = bloqueia acesso
      return errosController.fechado(res);
    }

    next();
  } catch (err) {
    console.error('Erro no middleware verificarReposicaoAberta:', err);
    return errosController.fechado(res);
  }
}

module.exports = verificarReposicaoAberta;
