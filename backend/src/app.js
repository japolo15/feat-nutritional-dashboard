const express = require('express');
const cors = require('cors');
const path = require('path');
const server = express();

//Configuraciones
server.set('port',8081);
server.set('host','localhost'); // Corrige el error de localhost

//Middlewares
server.use(cors());
server.use(express.json());

// Servir archivos estáticos desde el frontend
server.use(express.static(path.join(__dirname, '../../frontend/static')));
server.use(express.static(path.join(__dirname, '../../frontend/templates')));

//Rutas
server.get('/', function (req, res) {
   res.sendFile(path.join(__dirname, '../../frontend/templates/index.html'));
});

server.use('/', require('./routes/lecturas'));

//Mandar mensaje de error 404
server.use((req, res) => {
  res.status(404).send("<h1>Error 404</h1><h2>Página no encontrada</h2>");
});

module.exports = server;
