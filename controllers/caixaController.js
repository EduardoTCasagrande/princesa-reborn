const path = require('path');
const fs = require('fs');
const { DateTime } = require('luxon');
const { supabase } = require('../models/supabaseClient'); // seu client supabase exportado

exports.getCaixaTotal = async (req, res) => {
  const quiosque_id = Number(req.params.quiosque);

  if (isNaN(quiosque_id)) {
    return res.status(400).json({ erro: 'ID do quiosque inválido.' });
  }

  try {
    // Busca último ajuste
    const { data: ajusteData, error: ajusteError } = await supabase
      .from('caixa_movimentos')
      .select('valor, data')
      .eq('quiosque_id', quiosque_id)
      .eq('forma_pagamento', 'ajuste')
      .order('data', { ascending: false })
      .limit(1);

    if (ajusteError) throw ajusteError;

    const ajuste = ajusteData[0];

    if (ajuste) {
      // Soma movimentos após o ajuste
      const { data: movimentosData, error: movError } = await supabase
        .rpc('soma_movimentos_após_data', { 
          p_quiosque_id: quiosque_id,
          p_data: ajuste.data
        });
      
      const { data: movimentos, error: movimentosError } = await supabase
        .from('caixa_movimentos')
        .select('valor, forma_pagamento')
        .eq('quiosque_id', quiosque_id)
        .gt('data', ajuste.data);

      if (movimentosError) throw movimentosError;

      let totalMov = 0;
      for (const mov of movimentos) {
        if (mov.forma_pagamento === 'dinheiro' || mov.forma_pagamento === 'sangria') {
          totalMov += Number(mov.valor);
        }
      }

      const totalFinal = Number(ajuste.valor) + totalMov;

      return res.json({ total: totalFinal });
    } else {
      // Soma total geral
      const { data: todosMovimentos, error: errorTodos } = await supabase
        .from('caixa_movimentos')
        .select('valor, forma_pagamento')
        .eq('quiosque_id', quiosque_id);

      if (errorTodos) throw errorTodos;

      let total = 0;
      for (const mov of todosMovimentos) {
        if (mov.forma_pagamento === 'dinheiro' || mov.forma_pagamento === 'sangria') {
          total += Number(mov.valor);
        }
      }

      return res.json({ total });
    }
  } catch (err) {
    console.error('Erro ao buscar total do caixa:', err.message || err);
    return res.status(500).json({ erro: 'Erro ao buscar total do caixa.' });
  }
};

exports.getHistoricoCaixa = async (req, res) => {
  const quiosque = req.params.quiosque; // string mesmo
  console.log('quiosque_id recebido:', req.params.quiosque);


  if (!quiosque || typeof quiosque !== 'string') {
    return res.status(400).json({ erro: 'Quiosque inválido.' });
  }

  try {
    const { data, error } = await supabase
      .from('caixa_movimentos')
      .select('id, valor, forma_pagamento, data')
      .eq('quiosque_id', quiosque)
      .order('data', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Erro ao buscar histórico do caixa:', err.message || err);
    res.status(500).json({ erro: 'Erro ao buscar histórico do caixa.' });
  }
};

exports.registrarSangria = async (req, res) => {
  const { quiosque, valor } = req.body;
  const quiosque_id = Number(quiosque);

  if (isNaN(quiosque_id) || typeof valor !== 'number' || valor <= 0) {
    return res.status(400).json({ erro: 'Dados inválidos. Informe quiosque e valor numérico positivo.' });
  }

  const valorNegativo = -Math.abs(valor);
  const dataBrasilia = DateTime.now().setZone('America/Sao_Paulo').toISO();

  try {
    const { data, error } = await supabase
      .from('caixa_movimentos')
      .insert([{ quiosque_id, valor: valorNegativo, forma_pagamento: 'sangria', data: dataBrasilia }])
      .select('id');

    if (error) throw error;

    res.json({ mensagem: 'Sangria registrada com sucesso!', id: data[0].id });
  } catch (err) {
    console.error('Erro ao registrar sangria:', err.message || err);
    res.status(500).json({ erro: 'Erro ao registrar sangria.' });
  }
};

exports.renderSangriaPage = (req, res) => {
  const user = req.session.user;
  res.render('sangria', { user });
};

exports.gerarRelatorioDoDia = async (req, res) => {
  const quiosque_id = Number(req.params.quiosque);
  if (isNaN(quiosque_id)) return res.status(400).json({ erro: 'ID do quiosque inválido.' });

  const relatoriosDir = path.join(__dirname, '..', 'relatorios', 'fechamento');

  try {
    if (!fs.existsSync(relatoriosDir)) fs.mkdirSync(relatoriosDir, { recursive: true });

    // Busca a data de abertura do caixa atual
    const { data: statusData, error: statusError } = await supabase
      .from('caixa_status')
      .select('data_abertura')
      .eq('quiosque_id', quiosque_id)
      .eq('aberto', true)
      .limit(1);

    if (statusError) throw statusError;
    if (!statusData.length) {
      return res.status(400).json({ erro: 'Caixa não está aberto para esse quiosque.' });
    }

    const dataAbertura = statusData[0].data_abertura;

    // Consulta os movimentos desde a abertura do caixa
    const { data: totalsData, error: totalsError } = await supabase
      .from('caixa_movimentos')
      .select('forma_pagamento, valor')
      .eq('quiosque_id', quiosque_id)
      .gte('data', dataAbertura);

    if (totalsError) throw totalsError;

    let totalDinheiro = 0;
    let totalPix = 0;
    let totalCartao = 0;
    let totalSangria = 0;

    totalsData.forEach(row => {
      const tipo = row.forma_pagamento.toLowerCase().trim();
      const valor = Number(row.valor);

      if (tipo === 'dinheiro') totalDinheiro += valor;
      else if (tipo === 'pix') totalPix += valor;
      else if (tipo === 'cartão' || tipo === 'cartao') totalCartao += valor;
      else if (tipo === 'sangria') totalSangria += Math.abs(valor);
    });

    // Agora, calcular o saldo do caixa atual (dinheiro - sangria)
    const { data: saldoData, error: saldoError } = await supabase
      .from('caixa_movimentos')
      .select('valor, forma_pagamento')
      .eq('quiosque_id', quiosque_id)
      .gte('data', dataAbertura); // importante: só considerar os movimentos após a abertura

    if (saldoError) throw saldoError;

    let saldoAtualCaixa = 0;
    saldoData.forEach(row => {
      const tipo = row.forma_pagamento.toLowerCase().trim();
      const valor = Number(row.valor);

      if (tipo === 'dinheiro') saldoAtualCaixa += valor;
      else if (tipo === 'sangria') saldoAtualCaixa += valor; // valor negativo subtrai automaticamente
    });

    // Monta o conteúdo do relatório
    let conteudo = `Fechamento de Caixa\n\n`;
    conteudo += `Vendas por Forma de Pagamento:\n`;
    conteudo += `- Dinheiro: R$ ${totalDinheiro.toFixed(2).replace('.', ',')}\n`;
    conteudo += `- Pix: R$ ${totalPix.toFixed(2).replace('.', ',')}\n`;
    conteudo += `- Cartão: R$ ${totalCartao.toFixed(2).replace('.', ',')}\n`;
    conteudo += `Sangrias: R$ ${Math.abs(totalSangria).toFixed(2).replace('.', ',')}\n\n`;
    conteudo += `Total vendido em dinheiro no dia: R$ ${totalDinheiro.toFixed(2).replace('.', ',')}\n\n`;
    conteudo += `ADICIONADO NO CAIXA HOJE: R$ ${saldoAtualCaixa.toFixed(2).replace('.', ',')}\n`;

    // Gera arquivo
    const dataHoje = DateTime.now().setZone('America/Sao_Paulo').toISODate();
    const nomeArquivo = `relatorio_${quiosque_id}_${dataHoje}.txt`;
    const caminhoArquivo = path.join(relatoriosDir, nomeArquivo);

    if (fs.existsSync(caminhoArquivo)) {
      const anterior = fs.readFileSync(caminhoArquivo, 'utf-8');
      fs.writeFileSync(caminhoArquivo, '\n' + conteudo + anterior, 'utf-8');
    } else {
      fs.writeFileSync(caminhoArquivo, conteudo, 'utf-8');
    }

    res.json({
      mensagem: 'Relatório de fechamento gerado com sucesso!',
      arquivo: nomeArquivo,
      url: `/relatorios/fechamento/${encodeURIComponent(nomeArquivo)}?tipo=fechamento&raw=true`
    });

  } catch (err) {
    console.error('Erro ao gerar relatório:', err.message || err);
    res.status(500).json({ erro: 'Erro ao gerar relatório.' });
  }
};

exports.abrirCaixa = async (req, res) => {
  const { quiosque, valor_inicial } = req.body;
  const quiosque_id = Number(quiosque);

  if (isNaN(quiosque_id) || typeof valor_inicial !== 'number' || valor_inicial < 0) {
    return res.status(400).json({ erro: 'Dados inválidos.' });
  }

  const agora = DateTime.now().setZone('America/Sao_Paulo').toISO();

  try {
    // Buscar nome do quiosque
    const { data: quiosqueData, error: nomeError } = await supabase
      .from('quiosques')
      .select('nome')
      .eq('id', quiosque_id)
      .single();

    if (nomeError || !quiosqueData) {
      throw new Error('Não foi possível obter o nome do quiosque.');
    }

    const nomeQuiosque = quiosqueData.nome;

    // Upsert na tabela caixa_status
    const { error } = await supabase
      .from('caixa_status')
      .upsert({
        quiosque_id,
        aberto: true,
        valor_inicial,
        data_abertura: agora,
        data_fechamento: null
      }, { onConflict: 'quiosque_id' });

    if (error) throw error;

    // Caminho para salvar o relatório
    const relatoriosDir = path.join(__dirname, '..', 'relatorios', 'fechamento');
    if (!fs.existsSync(relatoriosDir)) fs.mkdirSync(relatoriosDir, { recursive: true });

    const dataHoje = DateTime.now().setZone('America/Sao_Paulo').toISODate();
    const nomeArquivo = `relatorio_${quiosque_id}_${dataHoje}.txt`;
    const caminhoArquivo = path.join(relatoriosDir, nomeArquivo);

    // Conteúdo do relatório com NOME do quiosque
    const conteudoAbertura =
      `Abertura de Caixa\n` +
      `Quiosque: ${nomeQuiosque}\n` +
      `Valor Inicial: R$ ${valor_inicial.toFixed(2).replace('.', ',')}\n` +
      `Data: ${DateTime.now().setZone('America/Sao_Paulo').toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}\n\n`;

    // Salvar ou sobrescrever o conteúdo no arquivo
    if (fs.existsSync(caminhoArquivo)) {
      const anterior = fs.readFileSync(caminhoArquivo, 'utf-8');
      fs.writeFileSync(caminhoArquivo, conteudoAbertura + anterior, 'utf-8');
    } else {
      fs.writeFileSync(caminhoArquivo, conteudoAbertura, 'utf-8');
    }

    res.json({ mensagem: 'Caixa aberto com sucesso!' });

  } catch (err) {
    console.error('Erro ao abrir caixa:', err.message || err);
    res.status(500).json({ erro: 'Erro ao abrir caixa.' });
  }
};

exports.fecharCaixa = async (req, res) => {
  const { quiosque } = req.body;
  const quiosque_id = Number(quiosque);

  if (isNaN(quiosque_id)) return res.status(400).json({ erro: 'Quiosque não informado.' });

  const agora = DateTime.now().setZone('America/Sao_Paulo').toISO();

  try {
    const { error, count } = await supabase
      .from('caixa_status')
      .update({ aberto: false, data_fechamento: agora })
      .eq('quiosque_id', quiosque_id);

    if (error) throw error;

    res.json({ mensagem: 'Caixa fechado com sucesso.' });

  } catch (err) {
    console.error('Erro ao fechar caixa:', err.message || err);
    res.status(500).json({ erro: 'Erro ao fechar caixa.' });
  }
};

exports.verificarStatusCaixa = async (req, res) => {
  const quiosque_id = Number(req.params.quiosque);

  if (isNaN(quiosque_id)) {
    return res.status(400).json({ erro: 'ID do quiosque inválido.' });
  }

  try {
    const { data, error } = await supabase
      .from('caixa_status')
      .select('aberto, valor_inicial, data_abertura, data_fechamento')
      .eq('quiosque_id', quiosque_id)
      .limit(1);

    if (error) throw error;

    if (!data.length) {
      return res.status(404).json({ erro: 'Caixa não encontrado para esse quiosque.' });
    }

    const row = data[0];
    res.json({
      aberto: row.aberto,
      valor_inicial: row.valor_inicial,
      data_abertura: row.data_abertura,
      data_fechamento: row.data_fechamento
    });
  } catch (err) {
    console.error('Erro ao verificar status do caixa:', err.message || err);
    res.status(500).json({ erro: 'Erro ao consultar status do caixa.' });
  }
};

exports.ajustarSaldoCaixa = async (req, res) => {
  const { quiosque, valor } = req.body;
  const quiosque_id = Number(quiosque);

  if (isNaN(quiosque_id) || typeof valor !== 'number') {
    return res.status(400).json({ erro: 'Dados inválidos.' });
  }

  const dataBrasilia = DateTime.now().setZone('America/Sao_Paulo').toISO();

  try {
    const { error: deleteError } = await supabase
      .from('caixa_movimentos')
      .delete()
      .eq('quiosque_id', quiosque_id)
      .eq('forma_pagamento', 'ajuste');

    if (deleteError) throw deleteError;

    // Insere novo ajuste
    const { error: insertError } = await supabase
      .from('caixa_movimentos')
      .insert([{ quiosque_id, valor, forma_pagamento: 'ajuste', data: dataBrasilia }]);

    if (insertError) throw insertError;

    res.json({ mensagem: `Saldo do caixa ajustado para R$ ${valor.toFixed(2).replace('.', ',')}` });

  } catch (err) {
    console.error('Erro ao ajustar saldo do caixa:', err.message || err);
    res.status(500).json({ erro: 'Erro ao ajustar saldo do caixa.' });
  }
};
