const fs = require('fs');
const path = require('path');
const { supabase } = require('../models/supabaseClient'); // ajuste o caminho

// Página do estoque
exports.estoque = (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.render('estoque', { user: req.session.user });
};

// Buscar estoque do quiosque da sessão (ou de outro quiosque se admin)
exports.buscarEstoquePorSessao = async (req, res) => {
  if (!req.session.user) return res.status(401).json({ erro: 'Não autenticado' });

  let quiosqueId = req.session.user.quiosque;

  try {
    if (req.session.user.admin && req.query.quiosque) {
      if (isNaN(Number(req.query.quiosque))) {
        const { data: quiosqueByName, error: errNome } = await supabase
          .from('quiosques')
          .select('id')
          .eq('nome', req.query.quiosque)
          .limit(1)
          .maybeSingle();

        if (errNome || !quiosqueByName) return res.status(404).json({ erro: 'Quiosque não encontrado' });

        quiosqueId = quiosqueByName.id;
      } else {
        quiosqueId = Number(req.query.quiosque);
      }
    }

    const { data: quiosqueNomeResult, error: errNomeQuiosque } = await supabase
      .from('quiosques')
      .select('nome')
      .eq('id', quiosqueId)
      .limit(1)
      .maybeSingle();

    if (errNomeQuiosque || !quiosqueNomeResult) {
      return res.status(404).json({ erro: 'Quiosque não encontrado' });
    }
    const quiosqueNome = quiosqueNomeResult.nome;

    const { data: estoqueResult, error: errEstoque } = await supabase
      .from('estoque_quiosque')
      .select('sku, quantidade')
      .eq('quiosque_id', quiosqueId);

    if (errEstoque) {
      console.error('Erro ao consultar estoque:', errEstoque.message);
      return res.status(500).json({ erro: 'Erro ao consultar o estoque' });
    }

    res.json({
      quiosque_id: quiosqueId,
      quiosque_nome: quiosqueNome,
      skus: estoqueResult
    });

  } catch (err) {
    console.error('Erro inesperado:', err);
    res.status(500).json({ erro: 'Erro inesperado' });
  }
};

// Listar quiosques (apenas para admins)
exports.listarQuiosques = async (req, res) => {
  if (!req.session.user || !req.session.user.admin) {
    return res.status(403).json({ erro: 'Apenas admins podem listar os quiosques.' });
  }

  try {
    const { data, error } = await supabase
      .from('quiosques')
      .select('id, nome')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao buscar quiosques:', error.message);
      return res.status(500).json({ erro: 'Erro ao buscar quiosques.' });
    }

    res.json({ quiosques: data });
  } catch (err) {
    console.error('Erro inesperado:', err);
    res.status(500).json({ erro: 'Erro inesperado' });
  }
};

// Página de conferência
exports.paginaConferencia = (req, res) => {
  res.render('conferencia', { user: req.session.user });
};

// Atualizar estoque com contagem de conferência
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
    // Verifica se os SKUs são válidos
    const { data: precosResult, error: errPrecos } = await supabase
      .from('precos')
      .select('sku')
      .in('sku', skusBipadosLower);

    if (errPrecos) {
      console.error('Erro ao buscar preços:', errPrecos.message);
      return res.status(500).json({ mensagem: 'Erro ao verificar SKUs.' });
    }

    const skusValidos = precosResult.map(r => r.sku.toLowerCase());
    const skusInvalidos = skusBipadosLower.filter(sku => !skusValidos.includes(sku));

    if (skusInvalidos.length > 0) {
      return res.status(400).json({
        mensagem: "Alguns SKUs não existem na tabela de preços.",
        skusInvalidos
      });
    }

    // Buscar nome do quiosque a partir do ID
    const { data: nomeQuiosqueResult, error: errNomeQuiosque } = await supabase
      .from('quiosques')
      .select('nome')
      .eq('id', quiosque_id)
      .limit(1)
      .maybeSingle();

    if (errNomeQuiosque || !nomeQuiosqueResult) {
      return res.status(404).json({ mensagem: 'Quiosque não encontrado.' });
    }
    const nomeQuiosque = nomeQuiosqueResult.nome;

    // Buscar estoque atual
    const { data: estoqueAntes, error: errEstoqueAntes } = await supabase
      .from('estoque_quiosque')
      .select('sku, quantidade')
      .eq('quiosque', nomeQuiosque);

    if (errEstoqueAntes) {
      console.error('Erro ao buscar estoque atual:', errEstoqueAntes.message);
      return res.status(500).json({ mensagem: 'Erro ao buscar estoque atual.' });
    }

    // Gerar relatório
    await gerarRelatorioConferencia(nomeQuiosque, contador, contagem, estoqueAntes);

    // Atualiza o estoque substituindo o valor antigo pelo contado
    for (const skuOriginal of skusBipados) {
      const skuLower = skuOriginal.toLowerCase();
      const qtd = contagem[skuOriginal];

      // Usando upsert para atualizar ou inserir
      const { error: errUpsert } = await supabase
        .from('estoque_quiosque')
        .upsert({ quiosque: nomeQuiosque, sku: skuLower, quantidade: qtd }, { onConflict: ['quiosque', 'sku'] });

      if (errUpsert) {
        console.error('Erro ao atualizar estoque:', errUpsert.message);
        return res.status(500).json({ mensagem: "Erro ao atualizar estoque." });
      }
    }

    res.json({ mensagem: `Estoque atualizado com sucesso. Relatório salvo.` });

  } catch (err) {
    console.error("Erro ao atualizar estoque:", err);
    res.status(500).json({ mensagem: "Erro ao atualizar estoque." });
  }
};

// Gera relatório da conferência
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
