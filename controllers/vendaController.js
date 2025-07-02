const { supabase } = require('../models/supabaseClient');
const path = require('path');
const fs = require('fs');

exports.vendasPage = (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.render('vendas');
};

exports.vender = async (req, res) => {
  const {
    quiosque_id,
    venda,
    pagamentos,
    total,
    desconto,
    operador,
    itensPromocionais
  } = req.body;

  if (!quiosque_id || !venda || typeof venda !== 'object' || !Array.isArray(pagamentos) || typeof total !== 'number') {
    return res.status(400).json({ status: 'erro', mensagem: 'Dados da venda inválidos.' });
  }

  try {
    // Busca o último ID de venda
    const { data: ultimas, error: errUltimo } = await supabase
      .from('historico_transacoes')
      .select('id_venda')
      .order('id_venda', { ascending: false })
      .limit(1);

    if (errUltimo) throw errUltimo;

    const idVendaAtual = (ultimas?.[0]?.id_venda || 0) + 1;

    const skus = Object.entries(venda).filter(([sku, qtd]) => sku && qtd && qtd > 0);
    const vendaDetalhada = [];

    for (const [sku, quantidade] of skus) {
      let precoUnitario = 0;
      const { data: precoData, error: precoErr } = await supabase
        .from('precos')
        .select('preco')
        .eq('sku', sku)
        .single();

      if (precoErr) throw precoErr;
      precoUnitario = precoData?.preco || 0;

      if (itensPromocionais && itensPromocionais[sku]) {
        precoUnitario = 0.01;
      }

      const valorTotalItem = precoUnitario * quantidade;
      vendaDetalhada.push({ sku, quantidade, precoUnitario, valorTotalItem });

      // Atualizar estoque
      await supabase.rpc('atualizar_estoque_venda', {
        p_quiosque_id: quiosque_id,
        p_sku: sku,
        p_quantidade: quantidade
      });

      // Inserir no histórico
      const { error: insertHistErr } = await supabase
        .from('historico_transacoes')
        .insert([{
          id_venda: idVendaAtual,
          tipo: 'venda',
          quiosque_id,
          sku,
          quantidade,
          valor: valorTotalItem,
          operador: operador || 'desconhecido'
        }]);

      if (insertHistErr) throw insertHistErr;
    }

    // Pagamentos
    const agora = new Date().toISOString();
    const pagamentosInsert = pagamentos.map(p => ({
      quiosque_id,
      valor: p.valor,
      forma_pagamento: p.forma.toLowerCase(),
      data: agora
    }));

    const { error: caixaErr } = await supabase
      .from('caixa_movimentos')
      .insert(pagamentosInsert);

    if (caixaErr) throw caixaErr;

    const nomeArquivo = gerarCupomESC(quiosque_id, vendaDetalhada, total, desconto, pagamentos, operador, idVendaAtual);

    res.json({
      status: 'ok',
      mensagem: `Venda #${idVendaAtual} finalizada com sucesso.`,
      id_venda: idVendaAtual,
      cupomUrl: `/cupons/${nomeArquivo}`
    });
  } catch (err) {
    console.error('Erro ao processar venda:', err);
    res.status(500).json({ status: 'erro', mensagem: 'Erro interno ao processar venda.' });
  }
};

function gerarCupomESC(quiosque_id, itens, total, desconto, pagamentos, operador, idVendaAtual) {
  const cuponsDir = path.join(__dirname, '../cupons');
  if (!fs.existsSync(cuponsDir)) {
    fs.mkdirSync(cuponsDir);
  }

  const data = new Date();
  const nomeArquivo = `cupom_${quiosque_id}_${data.getTime()}.esc`;
  const filePath = path.join(cuponsDir, nomeArquivo);

  let conteudo = '';
  conteudo += '*** CUPOM PDV ***\n';
  conteudo += `Venda Nº: ${idVendaAtual}\n`;
  conteudo += `Quiosque ID: ${quiosque_id}\n`;
  conteudo += `Data: ${data.toLocaleString()}\n`;
  conteudo += `Operador: ${operador || 'desconhecido'}\n\n`;

  itens.forEach(item => {
    conteudo += `SKU: ${item.sku} | Qtd: ${item.quantidade} | R$: ${item.precoUnitario.toFixed(2)}\n`;
  });

  conteudo += `\nTotal: R$ ${total.toFixed(2)}\n`;
  if (desconto && desconto > 0) {
    conteudo += `Desconto: R$ ${desconto.toFixed(2)}\n`;
  }

  conteudo += '\nPagamentos:\n';
  pagamentos.forEach(p => {
    conteudo += `- ${p.forma}: R$ ${p.valor.toFixed(2)}\n`;
  });

  conteudo += '\nObrigado pela preferência!\n';
  fs.writeFileSync(filePath, conteudo, 'utf8');
  return nomeArquivo;
}

exports.renderHistoricoPage = (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.render('historico');
};

exports.historico = async (req, res) => {
  const { data_inicio, data_fim, quiosque_id } = req.query;

  if (!data_inicio || !data_fim) {
    return res.status(400).json({
      status: 'erro',
      mensagem: 'Parâmetros "data_inicio" e "data_fim" são obrigatórios.'
    });
  }

  try {
    let query = supabase
      .from('historico_transacoes')
      .select('*')
      .eq('tipo', 'venda')
      .gte('data', `${data_inicio}T00:00:00`)
      .lte('data', `${data_fim}T23:59:59`)
      .order('id_venda', { ascending: true });

    if (quiosque_id) {
      query = query.eq('quiosque_id', quiosque_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ status: 'ok', historico: data });
  } catch (err) {
    console.error('Erro ao consultar histórico:', err);
    res.status(500).json({ status: 'erro', mensagem: 'Erro ao buscar histórico de vendas.' });
  }
};
