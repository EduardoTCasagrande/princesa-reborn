const express = require('express');
const router = express.Router();
const cuponsController = require('../controllers/cuponsController');
const { apenasAdmin } = require('../helpers/auth');

router.get('/cupons', apenasAdmin, cuponsController.listarCupons);
router.delete('/cupons/:nome', apenasAdmin, cuponsController.apagarCupom);
router.get('/cupons-view', apenasAdmin, cuponsController.listarCuponsView);


module.exports = router;
