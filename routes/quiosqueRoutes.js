const express = require('express');
const router = express.Router();
const quiosqueController = require('../controllers/quiosqueController');
const { apenasAdmin } = require('../helpers/auth');

router.get('/quiosque', quiosqueController.page);
router.get('/quiosques', quiosqueController.listar);
router.post('/add', quiosqueController.adicionar);

module.exports = router;
