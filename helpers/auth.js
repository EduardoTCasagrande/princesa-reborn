const e = require('express');
const resp = require('./res')
function apenasAdmin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/'); 
  }
  if (!req.session.user.admin) {
    return resp.acessoNegado(res);
  }
  next();
}
module.exports = { apenasAdmin };
