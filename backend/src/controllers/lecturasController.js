const db = require('./firebase');
const ref = db.ref('readings');

// Create a single object to export all methods
const lecturasController = {
    // Get all readings
    getLecturas: async (req, res) => {
        try {
            const snapshot = await ref.once('value');
            const data = snapshot.val();
            res.status(200).json(data || {});
        } catch (error) {
            res.status(500).json({ error: 'Error al obtener lecturas' });
        }
    },

    // Get readings count
    getCount: async (req, res) => {
        try {
            const snapshot = await ref.once('value');
            const count = snapshot.numChildren();
            res.json({ count });
        } catch (error) {
            res.status(500).json({ error: 'Error getting count' });
        }
    },

    // Create new reading
    postLectura: async (req, res) => {
        try {
            console.log('Received request:', {
                body: req.body,
                timestamp: new Date().toISOString()
            });

            // Add timeout handling
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Database timeout')), 5000);
            });

            // Race between the database operation and timeout
            const newReading = await Promise.race([
                ref.push(req.body),
                timeoutPromise
            ]);

            console.log('Reading saved successfully:', newReading.key);

            res.status(201).json({
                message: 'Lectura creada correctamente',
                id: newReading.key
            });
        } catch (error) {
            console.error('Error saving reading:', error);
            res.status(500).json({ 
                error: 'Error al crear lectura',
                details: error.message
            });
        }
    }
};

module.exports = lecturasController;