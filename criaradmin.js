const bcrypt = require('bcrypt');
const { supabase } = require('./models/supabaseClient'); // ajuste o caminho se necessário

async function criarUsuarioDeus() {
  try {
    const hash = await bcrypt.hash('Galpao:)', 10);

    // Buscar o ID do quiosque com nome "Matriz"
    const { data: quiosques, error: erroQuiosque } = await supabase
      .from('quiosques')
      .select('id')
      .eq('nome', 'Matriz')
      .maybeSingle();

    if (erroQuiosque) {
      console.error('❌ Erro ao buscar quiosque:', erroQuiosque.message);
      return;
    }

    if (!quiosques) {
      console.error("❌ Quiosque 'Matriz' não encontrado. Crie-o antes.");
      return;
    }

    const quiosque_id = quiosques.id;

    // Inserir o usuário
    const { error: erroInsercao } = await supabase
      .from('usuarios')
      .insert([
        {
          username: 'Repositor',
          senha: hash,
          quiosque_id: quiosque_id,
          admin: true,
          nivel: 'repositor',
        },
      ]);

    if (erroInsercao) {
      console.error('❌ Erro ao inserir usuário:', erroInsercao.message);
      return;
    }

    console.log("✅ Usuário nível 'repositor' criado com sucesso!");

  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }
}

criarUsuarioDeus();
