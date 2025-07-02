exports.acessoNegado = (res) => {
  res.status(403).render('erro', {
    titulo: 'Acesso Negado',
    mensagem: 'Somente administradores podem acessar esta página.',
    imagem: '403.png',
    icone: '🚫'
  });
};

exports.paginaNaoEncontrada = (res) => {
  res.status(404).render('erro', {
    titulo: 'Página Não Encontrada',
    mensagem: 'A página que você tentou acessar não existe.',
    imagem: '404png.png',
    icone: '❌'
  });
};
exports.caixaFechado = (res) => {
  res.status(403).render('erro', {
    titulo: 'Caixa Fechado',
    mensagem: 'Abra o caixa para continuar.',
    imagem: 'caixa.png',
    icone: '❌'
  });
};
