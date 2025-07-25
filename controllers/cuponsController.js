const fs = require('fs');
const path = require('path');

exports.listarCupons = (req, res) => {
  const pastaCupons = path.join(__dirname, '..', 'cupons');
  console.log('Pasta de cupons:', pastaCupons);

  fs.readdir(pastaCupons, (err, files) => {
    if (err) {
      console.error('Erro ao ler a pasta de cupons:', err);
      return res.status(500).json({ status: 'erro', mensagem: 'Erro ao ler a pasta de cupons' });
    }

    console.log('Arquivos encontrados:', files); // << log útil

    const arquivosTxt = files.filter(file => file.endsWith('.esc'));
    res.json({ status: 'ok', arquivos: arquivosTxt });
  });
};

exports.apagarCupom = (req, res) => {
  const nomeArquivo = req.params.nome;

  if (!nomeArquivo) {
    return res.status(400).json({ status: 'erro', mensagem: 'Nome do cupom não informado.' });
  }

  const caminho = path.join(__dirname, '..', 'cupons', nomeArquivo);

  fs.unlink(caminho, err => {
    if (err) {
      console.error('Erro ao apagar o cupom:', err);
      return res.status(500).json({ status: 'erro', mensagem: 'Erro ao apagar o cupom.' });
    }

    res.json({ status: 'ok', mensagem: `Cupom ${nomeArquivo} apagado com sucesso.` });
  });
};

exports.listarCuponsView = (req, res) => {
  const pastaCupons = path.join(__dirname, '..', 'cupons');

  fs.readdir(pastaCupons, (err, files) => {
    if (err) {
      console.error('Erro ao ler cupons:', err);
      return res.status(500).send('Erro ao carregar os cupons.');
    }

    const arquivos = files.filter(file => file.endsWith('.txt') || file.endsWith('.esc'));
    res.render('cupons', { arquivos });
  });
};
