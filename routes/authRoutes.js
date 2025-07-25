const express = require('express');
const path = require('path'); 
const router = express.Router();
const authController = require('../controllers/authController');
const { apenasAdmin } = require('../helpers/auth');


router.get('/', authController.loginPage);
router.post('/login', authController.login);
router.get('/registro', apenasAdmin, authController.registroPage);
router.post('/registro', apenasAdmin, authController.registro);
router.get('/dashboard', authController.dashboard);
router.get('/session-user', authController.sessionUser);
router.get('/meu-quiosque', authController.meuQuiosque);
router.get('/session-info', authController.sessionInfo);  
router.get('/usuario-logado', authController.getUsuarioLogado);

router.get('/sangria', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.render('sangria', 
    {user: req.session.user});
});

module.exports = router;
