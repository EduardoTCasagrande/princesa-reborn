const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { supabase } = require('../models/supabaseClient'); // ajuste o caminho

// Configuração do multer para fotos de SKUs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/imagens/skus');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nomeArquivo = req.body.sku + ext;
    cb(null, nomeArquivo);
  }
});
const upload = multer({ storage });
exports.uploadMiddleware = upload.single('foto');

exports.listarPrecos = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('precos')
      .select('sku, preco, foto');

    if (error) {
      console.error('Erro ao buscar preços:', error.message);
      return res.status(500).json({ status: 'erro', mensagem: 'Erro no banco de dados.' });
    }

    const dadosCompletos = data.map(row => ({
      ...row,
      foto: row.foto || `/imagens/skus/${row.sku}.jpg`
    }));

    res.json(dadosCompletos);
  } catch (err) {
    console.error('Erro inesperado:', err);
    res.status(500).json({ status: 'erro', mensagem: 'Erro inesperado.' });
  }
};

exports.atualizarPreco = async (req, res) => {
  const { sku } = req.params;
  const preco = Number(req.body.preco);

  if (isNaN(preco) || preco < 0) {
    return res.status(400).json({ status: 'erro', mensagem: 'Preço inválido' });
  }

  try {
    const { data, error } = await supabase
      .from('precos')
      .update({ preco })
      .eq('sku', sku)
      .select(); // ← necessário para trazer os dados atualizados

    if (error) {
      console.error('Erro ao atualizar preço:', error);
      return res.status(500).json({ status: 'erro', mensagem: 'Erro ao atualizar preço' });
    }

    // ✅ Corrigido: evita erro se data for null
    if (!data || data.length === 0) {
      return res.status(404).json({ status: 'erro', mensagem: 'SKU não encontrado' });
    }

    res.json({ status: 'ok', mensagem: `Preço do SKU ${sku} atualizado para R$ ${preco.toFixed(2)}` });
  } catch (err) {
    console.error('Erro inesperado:', err);
    res.status(500).json({ status: 'erro', mensagem: 'Erro inesperado.' });
  }
};


exports.deletarPreco = async (req, res) => {
  const { sku } = req.params;

  try {
    const { data, error } = await supabase
      .from('precos')
      .delete()
      .eq('sku', sku);

    if (error) {
      console.error('Erro ao remover preço:', error.message);
      return res.status(500).json({ status: 'erro', mensagem: 'Erro ao remover preço' });
    }

    if (data.length === 0) {
      return res.status(404).json({ status: 'erro', mensagem: 'SKU não encontrado' });
    }

    res.json({ status: 'ok', mensagem: `Preço do SKU ${sku} removido com sucesso` });
  } catch (err) {
    console.error('Erro inesperado:', err);
    res.status(500).json({ status: 'erro', mensagem: 'Erro inesperado' });
  }
};

exports.precosPage = (req, res) => {
  res.render('precos', { userSession: req.session.user });
};

exports.adicionarPreco = async (req, res) => {
  const { sku } = req.body;
  const preco = Number(req.body.preco);

  if (!sku || isNaN(preco) || preco < 0) {
    return res.status(400).json({ status: 'erro', mensagem: 'SKU ou preço inválidos.' });
  }

  try {
    const { error } = await supabase
      .from('precos')
      .upsert({ sku, preco });

    if (error) {
      console.error('Erro ao inserir/atualizar preço:', error.message);
      return res.status(500).json({ status: 'erro', mensagem: 'Erro no banco de dados.' });
    }

    res.json({ status: 'ok', mensagem: 'Preço cadastrado/atualizado com sucesso.' });
  } catch (err) {
    console.error('Erro inesperado:', err);
    res.status(500).json({ status: 'erro', mensagem: 'Erro inesperado.' });
  }
};

// Controller para cadastro com foto
exports.cadastrarSku = async (req, res) => {
  const { sku } = req.body;
  const preco = Number(req.body.preco);

  if (!sku || isNaN(preco) || preco < 0) {
    return res.status(400).json({ status: 'erro', mensagem: 'SKU ou preço inválidos.' });
  }

  if (!req.file) {
    return res.status(400).json({ status: 'erro', mensagem: 'Arquivo de foto obrigatório.' });
  }

  const fotoPath = `/imagens/skus/${req.file.filename}`;

  try {
    const { error } = await supabase
      .from('precos')
      .upsert({ sku, preco, foto: fotoPath });

    if (error) {
      console.error('Erro ao inserir SKU:', error.message);
      return res.status(500).json({ status: 'erro', mensagem: 'Erro ao cadastrar SKU.' });
    }

    res.redirect('/cadastrar-sku');
  } catch (err) {
    console.error('Erro inesperado:', err);
    res.status(500).json({ status: 'erro', mensagem: 'Erro inesperado.' });
  }
};

exports.renomearSKU = async (req, res) => {
  const user = req.session.user;

  if (!user || user.nivel !== 'DEUS') {
    return res.status(403).json({ status: 'erro', mensagem: 'Apenas usuários nível "deus" podem renomear SKUs.' });
  }

  const { skuAntigo, skuNovo } = req.body;

  if (!skuAntigo || !skuNovo) {
    return res.status(400).json({ status: 'erro', mensagem: 'Dados inválidos.' });
  }

  try {
    const { data, error } = await supabase
      .from('precos')
      .update({ sku: skuNovo })
      .eq('sku', skuAntigo)
      .select(); // <--- adicione isso para ter `data`

    if (error) {
      console.error('Erro ao renomear SKU:', error); // ← aqui, sem `.message`
      return res.status(500).json({ status: 'erro', mensagem: 'Erro ao renomear SKU.' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ status: 'erro', mensagem: 'SKU antigo não encontrado.' });
    }

    res.json({ status: 'ok', mensagem: 'SKU renomeado com sucesso.' });

  } catch (err) {
    console.error('Erro inesperado ao renomear SKU:', err); // <--- pode estar ocultando detalhes
    res.status(500).json({ status: 'erro', mensagem: 'Erro inesperado.' });
  }
};
