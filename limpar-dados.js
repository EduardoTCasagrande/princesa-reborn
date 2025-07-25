const { supabase } = require('./models/supabaseClient')
async function apagarDados() {
  const tabelas = [
    'bipagens_reposicao',
    'reposicoes_planejadas',
    'caixa_status',
    'historico_transacoes',
    'caixa_movimentos',
    'precos',
    'estoque_quiosque',
    'usuarios',
    'quiosques'
  ];

  for (const tabela of tabelas) {
    const { data, error } = await supabase
      .from(tabela)
      .delete()
      .neq('id', 0); // Apaga todas as linhas com id diferente de zero (ou seja, todas)

    if (error) {
      console.error(`Erro ao apagar dados da tabela ${tabela}:`, error);
    } else {
      console.log(`Dados apagados da tabela ${tabela}`);
    }
  }
}
