const { supabase } = require('../models/supabaseClient');
const fs = require('fs');
const path = require('path');

exports.estoque = (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.render('estoque', { user: req.session.user });
};

exports.buscarEstoquePorSessao = async (req, res) => {
  if (!req.session.user) return res.status(401).json({ erro: 'Não autenticado' });

  let quiosqueId = req.session.user.quiosque;

  if (req.session.user.admin && req.query.quiosque) {
    if (isNaN(Number(req.query.quiosque))) {
      const { data: nomeResult, error } = await supabase
        .from('quiosques')
        .select('id')
        .eq('nome', req.query.quiosque)
        .single();

      if (error || !nomeResult) return res.status(404).json({ erro: 'Quiosque não encontrado' });
      quiosqueId = nomeResult.id;
    } else {
      quiosqueId = Number(req.query.quiosque);
    }
  }

  try {
    const { data: quiosqueInfo, error: err1 } = await supabase
      .from('quiosques')
      .select('nome')
      .eq('id', quiosqueId)
      .single();

    if (err1 || !quiosqueInfo) return res.status(404).json({ erro: 'Quiosque não encontrado' });

    const { data: estoque, error: err2 } = await supabase
      .from('estoque_quiosque')
      .select('sku, quantidade')
      .eq('quiosque_id', quiosqueId);

    if (err2) throw err2;

    res.json({
      quiosque_id: quiosqueId,
      quiosque_nome: quiosqueInfo.nome,
      skus: estoque
    });
  } catch (err) {
    console.error('Erro ao consultar estoque:', err.message);
    res.status(500).json({ erro: 'Erro ao consultar o estoque' });
  }
};

exports.listarQuiosques = async (req, res) => {
  if (!req.session.user?.admin) {
    return res.status(403).json({ erro: 'Apenas admins podem listar os quiosques.' });
  }

  try {
    const { data, error } = await supabase
      .from('quiosques')
      .select('id, nome')
      .order('nome');

    if (error) throw error;

    res.json({ quiosques: data });
  } catch (err) {
    console.error('Erro ao buscar quiosques:', err.message);
    res.status(500).json({ erro: 'Erro ao buscar quiosques.' });
  }
};

exports.paginaConferencia = (req, res) => {
  res.render('conferencia', { user: req.session.user });
};

exports.atualizarEstoqueConferencia = async (req, res) => {
  const { quiosque_id, contador, contagem } = req.body;

  if (!quiosque_id || !contador || !contagem) {
    return res.status(400).json({ mensagem: "Dados incompletos." });
  }

  const skusBipados = Object.keys(contagem);
  const skusBipadosLower = skusBipados.map(sku => sku.toLowerCase());

  if (skusBipados.length === 0) {
    return res.status(400).json({ mensagem: "Nenhum SKU bipado para atualizar." });
  }

  try {
    const { data: precosData, error: erroPreco } = await supabase
      .from('precos')
      .select('sku')
      .in('sku', skusBipadosLower);

    if (erroPreco) throw erroPreco;

    const skusValidos = precosData.map(p => p.sku.toLowerCase());
    const skusInvalidos = skusBipadosLower.filter(sku => !skusValidos.includes(sku));

    if (skusInvalidos.length > 0) {
      return res.status(400).json({
        mensagem: "Alguns SKUs não existem na tabela de preços.",
        skusInvalidos
      });
    }

    const { data: quiosqueData, error: erroQuiosque } = await supabase
      .from('quiosques')
      .select('nome')
      .eq('id', quiosque_id)
      .single();

    if (erroQuiosque || !quiosqueData) {
      return res.status(404).json({ mensagem: 'Quiosque não encontrado.' });
    }

    const nomeQuiosque = quiosqueData.nome;

    const { data: estoqueAntes, error: erroEstoque } = await supabase
      .from('estoque_quiosque')
      .select('sku, quantidade')
      .eq('quiosque_id', quiosque_id); // ✅ corrigido

    if (erroEstoque) throw erroEstoque;

    await gerarRelatorioConferencia(nomeQuiosque, contador, contagem, estoqueAntes);

    // Atualizar ou inserir SKUs
    for (const skuOriginal of skusBipados) {
      const skuLower = skuOriginal.toLowerCase();
      const qtd = contagem[skuOriginal];

      const { error: erroUpsert } = await supabase
        .from('estoque_quiosque')
        .upsert({
          quiosque_id: quiosque_id, // ✅ corrigido
          sku: skuLower,
          quantidade: qtd
        }, { onConflict: ['quiosque_id', 'sku'] });

      if (erroUpsert) throw erroUpsert;
    }

    res.json({ mensagem: `Estoque atualizado com sucesso. Relatório salvo.` });
  } catch (err) {
    console.error("Erro ao atualizar estoque:", err);
    res.status(500).json({ mensagem: "Erro ao atualizar estoque." });
  }
};


async function gerarRelatorioConferencia(quiosque, contador, contagem, estoqueAntes) {
  const data = new Date();
  const timestamp = data.toISOString().replace(/[-:T]/g, '').slice(0, 12);
  const nomeArquivo = `conferencia-${quiosque}-${timestamp}.txt`;
  const caminho = path.join(__dirname, '../relatorios/conferencia', nomeArquivo);

  const estoqueMap = {};
  estoqueAntes.forEach(item => {
    estoqueMap[item.sku.toLowerCase()] = item.quantidade;
  });

  const contagemMap = {};
  for (const skuOriginal in contagem) {
    contagemMap[skuOriginal.toLowerCase()] = contagem[skuOriginal];
  }

  const todosSKUs = new Set([
    ...Object.keys(estoqueMap),
    ...Object.keys(contagemMap),
  ]);

  let conteudo = `RELATÓRIO DE CONFERÊNCIA DE ESTOQUE\n`;
  conteudo += `Quiosque: ${quiosque}\nContador(a): ${contador}\nData: ${data.toLocaleString()}\n\n`;
  conteudo += `${'SKU'.padEnd(30)}${'Contado'.padEnd(10)}${'Anterior'.padEnd(10)}Observação\n`;
  conteudo += `${'-'.repeat(65)}\n`;

  for (const sku of todosSKUs) {
    const contado = contagemMap[sku] ?? '-';
    const anterior = estoqueMap[sku] ?? '-';

    let obs = '';
    if (contagemMap[sku] !== undefined && estoqueMap[sku] !== undefined) {
      obs = '✓ Atualizado';
      if (typeof contado === 'number' && typeof anterior === 'number') {
        if (contado > anterior) obs += ' ▲ Aumentou';
        else if (contado < anterior) obs += ' ▼ Diminuiu';
      }
    } else if (contagemMap[sku] !== undefined) {
      obs = '➕ Novo SKU';
    } else if (estoqueMap[sku] !== undefined) {
      obs = '⏸️ Não bipado';
    }

    conteudo += `${sku.padEnd(30)}${String(contado).padEnd(10)}${String(anterior).padEnd(10)}${obs}\n`;
  }

  await fs.promises.writeFile(caminho, conteudo, 'utf-8');
  return nomeArquivo;
}

exports.atualizarEstoque = async (req, res) => {
  const { sku, quantidade, quiosque_id } = req.body;

  // Converte quantidade para number (se vier string)
  const qtdNum = Number(quantidade);

  if (!sku || isNaN(qtdNum) || !quiosque_id) {
    return res.status(400).json({ status: 'erro', mensagem: 'Dados inválidos' });
  }

  try {
    const { error } = await supabase
      .from('estoque_quiosque')
      .update({ quantidade: qtdNum })
      .eq('sku', sku)
      .eq('quiosque_id', quiosque_id);

    if (error) throw error;

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Erro ao atualizar estoque:', error.message || error);
    res.status(500).json({ status: 'erro', mensagem: 'Erro interno ao atualizar estoque' });
  }
};
