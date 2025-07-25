const bcrypt = require('bcrypt');
const { supabase } = require('../models/supabaseClient'); // seu client supabase exportado

exports.loginPage = (req, res) => {
  res.render('login');
};

exports.dashboard = (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.render('dashboard', {
    user: req.session.user
  });
};

exports.registroPage = (req, res) => {
  res.render('registro');
};

exports.registro = async (req, res) => {
  const { username, senha, quiosque } = req.body;

  if (!username || !senha || !quiosque) {
    return res.status(400).json({ status: 'erro', mensagem: 'Todos os campos são obrigatórios.' });
  }

  try {
    // Busca o id do quiosque pelo nome
    const { data: quiosquesData, error: quiosqueError } = await supabase
      .from('quiosques')
      .select('id')
      .eq('nome', quiosque)
      .limit(1);

    if (quiosqueError) {
      console.error('Erro ao buscar quiosque:', quiosqueError.message);
      return res.status(500).json({ status: 'erro', mensagem: 'Erro interno ao buscar quiosque.' });
    }

    if (!quiosquesData || quiosquesData.length === 0) {
      return res.status(400).json({ status: 'erro', mensagem: 'Quiosque não encontrado.' });
    }

    const quiosque_id = quiosquesData[0].id;
    const hash = await bcrypt.hash(senha, 10);

    const { data: insertData, error: insertError } = await supabase
      .from('usuarios')
      .insert([{ username, senha: hash, quiosque_id }])
      .select('id');

    if (insertError) {
      if (insertError.code === '23505') { // erro de chave única no Postgres
        return res.status(400).json({ status: 'erro', mensagem: 'Usuário já existe.' });
      }
      console.error('Erro ao inserir usuário:', insertError.message);
      return res.status(500).json({ status: 'erro', mensagem: 'Erro interno ao registrar.' });
    }

    res.json({ status: 'ok', mensagem: 'Usuário registrado com sucesso!' });
  } catch (err) {
    console.error('Erro inesperado ao registrar usuário:', err);
    res.status(500).json({ status: 'erro', mensagem: 'Erro interno ao registrar.' });
  }
};

exports.login = async (req, res) => {
  const { username, senha } = req.body;

  try {
    const { data: usuariosData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('username', username)
      .limit(1);

    if (userError) {
      console.error('Erro ao buscar usuário:', userError.message);
      return res.status(500).json({ status: 'erro', mensagem: 'Erro interno ao fazer login' });
    }

    if (!usuariosData || usuariosData.length === 0) {
      return res.status(401).json({ status: 'erro', mensagem: 'Usuário ou senha inválidos' });
    }

    const user = usuariosData[0];
    const senhaOk = await bcrypt.compare(senha, user.senha);

    if (!senhaOk) {
      return res.status(401).json({ status: 'erro', mensagem: 'Usuário ou senha inválidos' });
    }

    // Busca o nome do quiosque para armazenar na sessão e evitar queries futuras
    const { data: quiosqueData, error: qError } = await supabase
      .from('quiosques')
      .select('nome')
      .eq('id', user.quiosque_id)
      .limit(1);

    if (qError) {
      console.error('Erro ao buscar nome do quiosque:', qError.message);
    }

    const nomeQuiosque = quiosqueData?.[0]?.nome || null;

    req.session.user = {
      id: user.id,
      username: user.username,
      admin: user.admin === 1 || user.admin === true, // depende do banco
      quiosque: user.quiosque_id,
      nivel: user.nivel,
      nome_quiosque: nomeQuiosque
    };

    console.log('Valor de user.admin:', user.admin, 'Tipo:', typeof user.admin);

    res.json({ status: 'ok', mensagem: 'Login bem-sucedido' });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ status: 'erro', mensagem: 'Erro interno ao fazer login' });
  }
};

exports.sessionUser = async (req, res) => {
  const userSession = req.session.user;
  if (!userSession) return res.json({});

  res.json({
    username: userSession.username,
    admin: userSession.admin,
    nivel: userSession.nivel,
    quiosque_id: userSession.quiosque,
    quiosque: userSession.nome_quiosque || null
  });
};

exports.meuQuiosque = (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ erro: 'Não autenticado' });
  }

  const user = req.session.user;
  res.json({
    quiosque: user.quiosque,
    nome: user.nome_quiosque,
    admin: user.admin,
    id: user.id,
    nivel: user.nivel || 'user'
  });
};

exports.sessionInfo = (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ logado: false });
  }

  res.json({
    logado: true,
    admin: req.session.user.admin,
    quiosque: req.session.user.quiosque
  });
};

exports.getUsuarioLogado = (req, res) => {
  const usuario = req.session.user || {};
  const quiosque = usuario.quiosque || null;

  res.json({
    quiosque: quiosque,
    admin: usuario.admin === true,
    nome: usuario.username || null,
    id: usuario.id || null
  });
};
