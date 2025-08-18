const express = require('express');
const router = express.Router();
const lecturasController = require('../controllers/lecturasController');

// Handle both Spanish and English routes for compatibility
router.get('/', lecturasController.getLecturas);
router.get('/count', lecturasController.getCount);
router.post('/', lecturasController.postLectura);

// Add English routes for ESP32
router.post('/readings', lecturasController.postLectura);
router.get('/readings', lecturasController.getLecturas);
router.get('/readings/count', lecturasController.getCount);

module.exports = router;


