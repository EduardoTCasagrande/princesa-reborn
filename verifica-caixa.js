const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho para o banco
const dbPath = path.resolve(__dirname, './quiosques.db'); // ajuste se estiver em outro lugar
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar no banco:', err.message);
    return;
  }
  console.log('Conectado ao banco:', dbPath);
});

// Nome do quiosque que você quer testar
const quiosque = 'Mogi das Cruzes'; // <--- ALTERE AQUI

const query = `
  SELECT *
  FROM caixa_movimentos
  WHERE quiosque = ? AND date(data) = date('now', 'localtime')
`;

db.all(query, [quiosque], (err, rows) => {
  if (err) {
    console.error('Erro ao executar a consulta:', err.message);
    return;
  }

  if (rows.length === 0) {
    console.log(`Nenhuma venda encontrada hoje para o quiosque "${quiosque}".`);
  } else {
    console.log(`Vendas de hoje para o quiosque "${quiosque}":`);
    rows.forEach(row => {
      console.log(`ID: ${row.id}, Valor: ${row.valor}, Forma: ${row.forma_pagamento}, Data: ${row.data}`);
    });
  }

  db.close();
});
