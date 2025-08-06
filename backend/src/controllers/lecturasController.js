const db = require('./firebase.js')
const ref = db.ref('readings');
const lecturasController = {};

// Crear una nueva lectura
lecturasController.postLectura = async (req, res) => {
  try {
    const { food_type, grams_dispensed, timestamp } = req.body;
    
    // Verificamos que los datos necesarios existan
    if (!food_type || !grams_dispensed || !timestamp) {
      return res.status(400).json({ error: 'Faltan datos en la solicitud. Se requiere food_type, grams_dispensed y timestamp.' });
    }

    const nuevaLectura = { food_type, grams_dispensed, timestamp };

    const nuevaRef = await ref.push(nuevaLectura);

    res.status(201).json({
      message: 'Lectura creada correctamente',
      id: nuevaRef.key,
    });
  } catch (error) {
    console.error('Error escribiendo en Firebase:', error);
    res.status(500).json({ error: 'Error al crear lectura' });
  }
};

// Obtener todas las lecturas
lecturasController.getAllLecturas = async (req, res) => {
  try {
    const snapshot = await ref.once('value');
    res.status(200).json(snapshot.val() || {});
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener lecturas' });
  }
};

// Obtener una lectura por idSensor
lecturasController.getByIdLectura = async (req, res) => {
  try {
    const {id} = req.params;
    const snapshot = await ref.once('value');
    const data = snapshot.val();

    // Filtramos las lecturas que coinciden con el idSensor
    const lecturasFiltradas = {};
    for (const key in data) {
        if (data[key].idSensor === id) {
            lecturasFiltradas[key] = data[key];
        }
    }
    if (Object.keys(lecturasFiltradas).length === 0) {
      return res.status(404).json({ error: 'Lectura no encontrada' });
    }
    res.status(200).json(lecturasFiltradas);

  } catch (error) {
    res.status(500).json({ error: 'Error al obtener lectura' });
  }
};

// Actualizar una lectura por id
lecturasController.updateLectura = async (req, res) => {
  try {
    const {id} = req.params;
    const nuevaData = req.body;
    await ref.child(id).update(nuevaData);
    res.status(200).json({ message: 'Lectura actualizada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar lectura' });
  }
};

// Eliminar una lectura por id
lecturasController.deleteLectura = async (req, res) => {
  try {
    const { id } = req.params;
    await ref.child(id).remove();
    res.status(200).json({ message: 'Lectura eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar lectura' });
  }
};

module.exports = lecturasController;