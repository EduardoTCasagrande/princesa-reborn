const express = require('express');
const router = express.Router();

const certificatesController = require('../controllers/certificadosController');
const { apenasAdmin } = require('../helpers/auth');

router.get('/', apenasAdmin, certificatesController.listCertificates);

module.exports = router;
