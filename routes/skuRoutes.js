const express = require('express');
const router = express.Router();
const skuController = require('../controllers/skuController');
const { apenasAdmin } = require('../helpers/auth');

router.get('/skus-com-qr', skuController.listarSkusComQr);
router.get('/qrcodes', apenasAdmin,skuController.page);

module.exports = router;
