const { supabase } = require('../models/supabaseClient');

exports.dashboard = async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) return res.redirect('/');

    const quiosque_id = req.query.quiosque_id ? parseInt(req.query.quiosque_id) : null;
    const data_inicio = req.query.data_inicio || null;
    const data_fim = req.query.data_fim || null;
    const margem = parseFloat(req.query.margem || 100);

    let query = supabase
      .from('historico_transacoes')
      .select('*')
      .eq('tipo', 'venda');

    if (quiosque_id) query = query.eq('quiosque_id', quiosque_id);
    if (data_inicio) query = query.gte('data', data_inicio);
    if (data_fim) query = query.lte('data', data_fim);

    const { data: transacoes, error } = await query;
    if (error) throw error;

    let receita_bruta = 0;
    let total_vendas = new Set();
    let total_produtos = 0;
    let ticket_medio = 0;
    let bonecas = {};
    let vendasPorDiaQtd = {};
    let vendasPorDiaValor = {};

    for (const t of transacoes) {
      receita_bruta += t.valor || 0;
      total_produtos += t.quantidade || 0;
      if (t.id_venda) total_vendas.add(t.id_venda);

      if (t.sku && t.sku !== 'kit completo rosa' && t.sku !== 'kit completo azul') {
        bonecas[t.sku] = (bonecas[t.sku] || 0) + (t.quantidade || 0);
      }
      
      const dia = new Date(t.data).toISOString().split('T')[0];

      // Quantidade por dia
      vendasPorDiaQtd[dia] = (vendasPorDiaQtd[dia] || 0) + (t.quantidade || 0);

      // Valor por dia
      vendasPorDiaValor[dia] = (vendasPorDiaValor[dia] || 0) + (t.valor || 0);
    }

    const boneca_mais_vendida = Object.entries(bonecas)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const receita_liquida = receita_bruta * (margem / 100);
    ticket_medio = receita_bruta / (total_vendas.size || 1);

    const { data: quiosques } = await supabase.from('quiosques').select('id, nome');

    res.render('dash', {
      quiosques,
      quiosque_id,
      data_inicio,
      data_fim,
      margem,
      receita_bruta,
      receita_liquida: receita_liquida.toFixed(2),
      ticket_medio: ticket_medio.toFixed(2),
      total_vendas: total_vendas.size,
      total_produtos,
      boneca_mais_vendida,
      vendasPorDiaQtd,
      vendasPorDiaValor,
      topBonecas: bonecas
    });

  } catch (err) {
    console.error('❌ Erro no dashboard:', err.message);
    res.status(500).send('Erro ao carregar dashboard');
  }
};
