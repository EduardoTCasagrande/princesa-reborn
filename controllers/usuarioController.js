const { supabase } = require('../models/supabaseClient');
const bcrypt = require('bcrypt');

exports.gerenciarPage = async (req, res) => {
  if (!req.session.user || !req.session.user.admin) {
    return res.status(403).send('Acesso negado.');
  }

  try {
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('id, username, quiosque_id, nivel');

    const { data: quiosques, error: quiosquesError } = await supabase
      .from('quiosques')
      .select('nome');

    if (usuariosError || quiosquesError) throw usuariosError || quiosquesError;

    res.render('gerenciar-usuarios', {
      usuarios,
      quiosques,
      userSession: req.session.user
    });
  } catch (err) {
    console.error('Erro ao buscar dados:', err.message);
    res.status(500).send('Erro ao buscar dados.');
  }
};

exports.atualizarSenha = async (req, res) => {
  const { id, novaSenha } = req.body;

  if (!req.session.user || !req.session.user.admin) {
    return res.status(403).json({ status: 'erro', mensagem: 'Acesso negado.' });
  }

  if (!id || !novaSenha) {
    return res.status(400).json({ status: 'erro', mensagem: 'Dados incompletos.' });
  }

  try {
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('nivel')
      .eq('id', id)
      .single();

    if (error || !usuario)
      return res.status(404).json({ status: 'erro', mensagem: 'Usuário não encontrado.' });

    if (usuario.nivel === 'deus')
      return res.status(403).json({ status: 'erro', mensagem: 'Senha do DEUS não pode ser alterada.' });

    const senhaHash = await bcrypt.hash(novaSenha, 10);

    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ senha: senhaHash })
      .eq('id', id);

    if (updateError) throw updateError;

    res.json({ status: 'ok', mensagem: 'Senha atualizada com sucesso.' });
  } catch (err) {
    console.error('Erro ao atualizar senha:', err.message);
    res.status(500).json({ status: 'erro', mensagem: 'Erro ao atualizar senha.' });
  }
};

exports.atualizarQuiosque = async (req, res) => {
  const { userId, novoQuiosque } = req.body;

  if (!req.session.user || req.session.user.nivel !== 'DEUS') {
    return res.status(403).json({ status: 'erro', mensagem: 'Apenas DEUS pode alterar o quiosque.' });
  }

  if (!userId || !novoQuiosque) {
    return res.status(400).json({ status: 'erro', mensagem: 'Dados incompletos.' });
  }

  try {
    const { data, error } = await supabase
      .from('usuarios')
      .update({ quiosque_id: novoQuiosque })
      .eq('id', userId)
      .select();

    if (error || !data || data.length === 0)
      return res.status(404).json({ status: 'erro', mensagem: 'Usuário não encontrado.' });

    res.json({ status: 'ok', mensagem: 'Quiosque do usuário atualizado com sucesso!' });
  } catch (err) {
    console.error('Erro ao atualizar quiosque:', err.message);
    res.status(500).json({ status: 'erro', mensagem: 'Erro ao atualizar quiosque.' });
  }
};

exports.atualizarUsername = async (req, res) => {
  const { userId, novoUsername } = req.body;

  if (!req.session.user || req.session.user.nivel !== 'DEUS') {
    return res.status(403).json({ status: 'erro', mensagem: 'Apenas DEUS pode alterar o username.' });
  }

  if (!userId || !novoUsername) {
    return res.status(400).json({ status: 'erro', mensagem: 'Dados incompletos.' });
  }

  try {
    const { data: check, error: checkError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('username', novoUsername);

    if (checkError) throw checkError;
    if (check.length > 0)
      return res.status(400).json({ status: 'erro', mensagem: 'Username já está em uso.' });

    const { data, error } = await supabase
      .from('usuarios')
      .update({ username: novoUsername })
      .eq('id', userId)
      .select();

    if (error || !data || data.length === 0)
      return res.status(404).json({ status: 'erro', mensagem: 'Usuário não encontrado.' });

    res.json({ status: 'ok', mensagem: 'Username atualizado com sucesso!' });
  } catch (err) {
    console.error('Erro ao atualizar username:', err.message);
    res.status(500).json({ status: 'erro', mensagem: 'Erro ao atualizar username.' });
  }
};

exports.atualizarNomeQuiosque = async (req, res) => {
  const { nomeAntigo, nomeNovo } = req.body;

  if (!req.session.user || req.session.user.nivel !== 'DEUS') {
    return res.status(403).json({ status: 'erro', mensagem: 'Apenas DEUS pode alterar nome do quiosque.' });
  }

  if (!nomeAntigo || !nomeNovo) {
    return res.status(400).json({ status: 'erro', mensagem: 'Dados incompletos.' });
  }

  try {
    const { data: check, error: checkError } = await supabase
      .from('quiosques')
      .select('nome')
      .eq('nome', nomeNovo);

    if (checkError) throw checkError;
    if (check.length > 0)
      return res.status(400).json({ status: 'erro', mensagem: 'Já existe um quiosque com esse nome.' });

    const { data, error } = await supabase
      .from('quiosques')
      .update({ nome: nomeNovo })
      .eq('nome', nomeAntigo)
      .select();

    if (error || !data || data.length === 0)
      return res.status(404).json({ status: 'erro', mensagem: 'Quiosque não encontrado.' });

    res.json({ status: 'ok', mensagem: 'Nome do quiosque atualizado com sucesso!' });
  } catch (err) {
    console.error('Erro ao atualizar nome do quiosque:', err.message);
    res.status(500).json({ status: 'erro', mensagem: 'Erro ao atualizar nome.' });
  }
};
