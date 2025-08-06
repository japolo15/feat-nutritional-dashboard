const app = require('./app.js');
const port = app.get('port');
const host = app.get('host');

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor Feat iniciado en http://${host}:${port}`);
    console.log('Dashboard disponible en http://localhost:8081');
});