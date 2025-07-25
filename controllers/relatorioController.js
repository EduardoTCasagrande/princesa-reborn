const fs = require('fs').promises;
const path = require('path');

const baseRelatoriosDir = path.join(__dirname, '../relatorios');

exports.page = (req, res) => {
  res.render('relatorio'); // View para listar todos os tipos
};

// Salvar relatório em subpasta (ex: reposicao, fechamento...)
exports.salvar = async (req, res) => {
  const { quiosque, dados, separador, tipo } = req.body;

  if (!quiosque || !dados || !tipo) {
    return res.status(400).json({ mensagem: "Tipo, quiosque e dados são obrigatórios." });
  }

  if (!dados.planejado || !dados.bipado) {
    return res.status(400).json({ mensagem: "Dados devem conter 'planejado' e 'bipado'." });
  }

  const dirDestino = path.join(baseRelatoriosDir, tipo);

  try {
    await fs.mkdir(dirDestino, { recursive: true });

    let texto = `Separador: ${separador || 'Não informado'}\nQuiosque: ${quiosque}\n\n`;
    texto += `SKU\tPlanejado\tBipado\tStatus\n`;
    texto += `--------------------------------------------------\n`;

    // Obter todos SKUs únicos dos dois conjuntos
    const skus = new Set([
      ...Object.keys(dados.planejado),
      ...Object.keys(dados.bipado)
    ]);

    for (const sku of skus) {
      const planejado = dados.planejado[sku] ?? 0;
      const bipado = dados.bipado[sku] ?? 0;

      let status = '';

      if (planejado === bipado) {
        status = '✓ Correto';
      } else if (bipado > planejado) {
        status = `▲ A mais (${bipado - planejado})`;
      } else if (bipado < planejado && bipado > 0) {
        status = `▼ A menos (${planejado - bipado})`;
      } else if (bipado === 0 && planejado > 0) {
        status = '❌ Faltando';
      } else if (planejado === 0 && bipado > 0) {
        status = '➕ Novo SKU';
      }

      texto += `${sku}\t${planejado}\t${bipado}\t${status}\n`;
    }

    const nomeArquivo = `${Date.now()}_${quiosque.replace(/[^a-zA-Z0-9-_]/g, '-')}.txt`;
    const caminhoArquivo = path.join(dirDestino, nomeArquivo);

    await fs.writeFile(caminhoArquivo, texto, 'utf-8');
    res.json({ mensagem: "Relatório salvo com sucesso!", arquivo: nomeArquivo });

  } catch (err) {
    console.error("Erro ao salvar relatório:", err);
    res.status(500).json({ mensagem: "Erro ao salvar relatório." });
  }
};


// Lista relatórios da subpasta
exports.listar = async (req, res) => {
  const { tipo } = req.params;
  const dirDestino = path.join(baseRelatoriosDir, tipo);

  try {
    const files = await fs.readdir(dirDestino);
    const txtFiles = files.filter(f => f.endsWith('.txt'));
    res.json(txtFiles);
  } catch (err) {
    res.status(500).json({ mensagem: `Erro ao listar relatórios de ${tipo}.` });
  }
};

// Lê conteúdo de um relatório da subpasta
exports.ler = async (req, res) => {
  const { tipo, nomeArquivo } = req.params;

  if (!nomeArquivo.endsWith('.txt') || nomeArquivo.includes('..')) {
    return res.status(400).json({ mensagem: 'Nome de arquivo inválido.' });
  }

  const caminhoArquivo = path.join(baseRelatoriosDir, tipo, nomeArquivo);

  if (req.query.raw === 'true') {
    // Envia download do arquivo
    return res.download(caminhoArquivo, nomeArquivo, err => {
      if (err) {
        res.status(404).json({ mensagem: 'Arquivo não encontrado.' });
      }
    });
  }

  try {
    const data = await fs.readFile(caminhoArquivo, 'utf-8');
    res.json({ conteudo: data });
  } catch {
    res.status(404).json({ mensagem: 'Arquivo não encontrado.' });
  }
};

// Exclui relatório da subpasta
exports.deletar = async (req, res) => {
  const { tipo, nomeArquivo } = req.params;

  if (!nomeArquivo.endsWith('.txt') || nomeArquivo.includes('..')) {
    return res.status(400).json({ mensagem: 'Nome de arquivo inválido.' });
  }

  const caminhoArquivo = path.join(baseRelatoriosDir, tipo, nomeArquivo);

  try {
    await fs.access(caminhoArquivo); // Verifica se arquivo existe
  } catch {
    console.error(`Arquivo não encontrado para exclusão: ${caminhoArquivo}`);
    return res.status(404).json({ mensagem: 'Arquivo não encontrado.' });
  }

  try {
    await fs.unlink(caminhoArquivo);
    console.log(`Arquivo excluído: ${caminhoArquivo}`);
    res.json({ mensagem: 'Arquivo apagado com sucesso.' });
  } catch (err) {
    console.error(`Erro ao apagar arquivo ${caminhoArquivo}:`, err);
    res.status(500).json({ mensagem: 'Erro ao apagar o arquivo.' });
  }
};

