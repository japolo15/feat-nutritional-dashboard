
const {Router}=require('express');
const router = Router();

const {postLectura, getAllLecturas, getByIdLectura, updateLectura, deleteLectura} = require('../controllers/lecturasController');

//POST /lecturas → crear nueva lectura
router.post('/readings', postLectura);

//GET ALL /lecturas → obtener todas las lecturas
router.get('/', getAllLecturas);

//GET BY ID /lecturas/:id → obtener una lectura específica
router.get('/sensor/:id', getByIdLectura);

//UPDATE /lecturas/:id → actualizar una lectura
router.put('/:id', updateLectura);

//DELETE /lecturas/:id → eliminar una lectura
router.delete('/:id', deleteLectura);

module.exports = router;


