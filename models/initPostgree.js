const pool = require('./supabaseClient'); // Ajuste se estiver em outro caminho

async function criarTabelas() {
  try {
    // 1. Tabela: quiosques
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quiosques (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        range TEXT NOT NULL,
        colunas TEXT NOT NULL
      );
    `);

    // 2. Tabela: usuarios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        senha TEXT NOT NULL,
        quiosque_id INTEGER NOT NULL,
        admin BOOLEAN NOT NULL DEFAULT FALSE,
        nivel TEXT NOT NULL DEFAULT 'user',
        FOREIGN KEY (quiosque_id) REFERENCES quiosques(id)
      );
    `);

    // 3. Tabela: estoque_quiosque
    await pool.query(`
      CREATE TABLE IF NOT EXISTS estoque_quiosque (
        id SERIAL PRIMARY KEY,
        quiosque_id INTEGER NOT NULL,
        sku TEXT NOT NULL,
        quantidade INTEGER NOT NULL DEFAULT 0,
        UNIQUE(quiosque_id, sku),
        FOREIGN KEY (quiosque_id) REFERENCES quiosques(id)
      );
    `);

    // 4. Tabela: precos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS precos (
        sku TEXT PRIMARY KEY,
        preco REAL NOT NULL,
        foto TEXT
      );
    `);

    // 5. Tabela: caixa_movimentos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS caixa_movimentos (
        id SERIAL PRIMARY KEY,
        quiosque_id INTEGER NOT NULL,
        valor REAL NOT NULL,
        forma_pagamento TEXT NOT NULL,
        data TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quiosque_id) REFERENCES quiosques(id)
      );
    `);

    // 6. Tabela: historico_transacoes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historico_transacoes (
        id SERIAL PRIMARY KEY,
        id_venda INTEGER,
        tipo TEXT NOT NULL,
        quiosque_id INTEGER NOT NULL,
        sku TEXT,
        quantidade INTEGER,
        valor REAL,
        operador TEXT,
        data TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quiosque_id) REFERENCES quiosques(id)
      );
    `);

    // 7. Tabela: caixa_status
    await pool.query(`
      CREATE TABLE IF NOT EXISTS caixa_status (
        quiosque_id INTEGER PRIMARY KEY,
        aberto INTEGER NOT NULL DEFAULT 0,
        valor_inicial REAL DEFAULT 0,
        data_abertura TIMESTAMP,
        data_fechamento TIMESTAMP,
        FOREIGN KEY (quiosque_id) REFERENCES quiosques(id)
      );
    `);
    // 8. Tabela: reposicoes_planejadas
await pool.query(`
  CREATE TABLE IF NOT EXISTS reposicoes_planejadas (
    id SERIAL PRIMARY KEY,
    quiosque_id INTEGER NOT NULL,
    sku TEXT NOT NULL,
    quantidade_planejada INTEGER NOT NULL,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    FOREIGN KEY (quiosque_id) REFERENCES quiosques(id),
    FOREIGN KEY (sku) REFERENCES precos(sku)
  );
`);

// 9. Tabela: bipagens_reposicao
await pool.query(`
  CREATE TABLE IF NOT EXISTS bipagens_reposicao (
    id SERIAL PRIMARY KEY,
    reposicao_id INTEGER NOT NULL,
    data TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    operador TEXT,
    FOREIGN KEY (reposicao_id) REFERENCES reposicoes_planejadas(id)
  );
`);

    console.log('✅ Todas as tabelas foram criadas com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao criar tabelas:', err.message);
  } finally {
    await pool.end(); // encerra a conexão após tudo
  }
}

criarTabelas();
