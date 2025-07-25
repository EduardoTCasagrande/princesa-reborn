const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { apenasAdmin } = require('../helpers/auth');

router.get('/dash', apenasAdmin, dashboardController.dashboard);

module.exports = router;
