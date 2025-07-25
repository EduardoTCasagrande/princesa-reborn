const resHelper = require('../helpers/res');
module.exports = (dataHoraLimiteISO = '2025-07-05T15:10:00') => {
  return (req, res, next) => {
    const agora = new Date();
    const limite = new Date(dataHoraLimiteISO);

    if (agora >= limite) {
      console.error(`[EXPIRADO] Acesso bloqueado desde ${limite.toLocaleString('pt-BR')}`);
      return res.status(501).send(`
        <h1 style="color:red; font-family:sans-serif;">⚠️ Erro Interno</h1>
        <p>Entre em contato com o suporte<strong></strong>.</p>
      `);
    }
    next();
  };
};

module.exports = function (dataLimiteStr) {
  const dataLimite = new Date(dataLimiteStr);

  return (req, res, next) => {
    const agora = new Date();

    if (agora > dataLimite) {
      return res.status(403).render('erro', {
        titulo: 'Erro interno',
        mensagem: `TraceBack Error`,
        imagem: 'caixa.png',
        icone: '💻'
      });
    }

    next();
  };
};