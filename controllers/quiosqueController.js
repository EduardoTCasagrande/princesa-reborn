const { supabase } = require('../models/supabaseClient');

exports.page = (req, res) => {
  res.render('quiosques');
};

exports.listar = async (req, res) => {
  try {
    // Supabase retorna dados assim: { data, error }
    const { data, error } = await supabase
      .from('quiosques')
      .select('nome');

    if (error) {
      console.error('Erro ao buscar quiosques:', error.message);
      return res.status(500).json({ error: 'Erro ao buscar quiosques' });
    }

    // data já é array de objetos, map só extrai nomes
    const nomes = data.map(row => row.nome);

    res.json({ quiosques: nomes });
  } catch (err) {
    console.error('Erro inesperado:', err.message);
    res.status(500).json({ error: 'Erro inesperado ao buscar quiosques' });
  }
};

exports.adicionar = async (req, res) => {
  const { nome, range, colunas } = req.body;

  try {
    const { data, error } = await supabase
      .from('quiosques')
      .insert([{ nome, range, colunas }]);

    if (error) {
      console.error('Erro ao inserir quiosque:', error.message);
      return res.status(500).send('Erro ao cadastrar quiosque.');
    }

    res.redirect('/');
  } catch (err) {
    console.error('Erro inesperado:', err.message);
    res.status(500).send('Erro inesperado ao cadastrar quiosque.');
  }
};
