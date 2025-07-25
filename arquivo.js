const { supabase } = require('./models/supabaseClient')
const bcrypt = require('bcrypt');
require('dotenv').config();


const username = 'Repositor';
const senha = 'galpao1';
const nomeQuiosque = 'Galpão'; 
const admin = false;
const nivel = 'repositor';

async function criarUsuario() {
  try {
    // 1. Buscar quiosque pelo nome
    const { data: quiosqueData, error: quiosqueErro } = await supabase
      .from('quiosques')
      .select('id')
      .eq('nome', nomeQuiosque)
      .single();

    if (quiosqueErro || !quiosqueData) {
      throw new Error(`Quiosque '${nomeQuiosque}' não encontrado.`);
    }

    const quiosque_id = quiosqueData.id;

    // 2. Gerar hash da senha
    const hash = await bcrypt.hash(senha, 10);

    // 3. Inserir novo usuário
    const { error: insertError } = await supabase
      .from('usuarios')
      .insert([
        {
          username,
          senha: hash,
          quiosque_id,
          admin,
          nivel,
        },
      ]);

    if (insertError) {
      throw new Error('Erro ao inserir usuário: ' + insertError.message);
    }

    console.log('✅ Usuário criado com sucesso no Supabase!');
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    process.exit();
  }
}

criarUsuario();
