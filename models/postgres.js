const { Pool } = require('pg');

// Use a sua connection string completa
const connectionString = 'postgresql://princesa_reborn_db_user:C3RtAAKboNi6eal3ds7jQ0lmEMzVi5bv@dpg-d1hu4vqli9vc73a3ll5g-a.oregon-postgres.render.com/princesa_reborn_db';

/*const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testarConexao() {
  try {
    const client = await pool.connect();
    console.log("Conectado ao banco no Render!");
    const res = await client.query('SELECT NOW()');
    console.log("Data/hora do servidor:", res.rows[0]);
    client.release();
  } catch (err) {
    console.error("Erro de conexão:", err);
  }
}

testarConexao();

//module.exports = pool;
*/