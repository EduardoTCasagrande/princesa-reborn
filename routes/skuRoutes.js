const express = require('express');
const router = express.Router();
const skuController = require('../controllers/skuController');

router.get('/skus-com-qr', skuController.listarSkusComQr);
router.get('/qrcodes', skuController.page)

module.exports = router;
