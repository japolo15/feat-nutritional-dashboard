const express = require('express');
const router = express.Router();
const lecturasController = require('../controllers/lecturasController');

//GET ALL /lecturas → obtener todas las lecturas
router.get('/lecturas', lecturasController.getLecturas);

//GET COUNT /lecturas/count → obtener el conteo de las lecturas
router.get('/lecturas/count', lecturasController.getCount);

//POST /lecturas → crear nueva lectura
router.post('/lecturas', lecturasController.postLectura);

module.exports = router;


