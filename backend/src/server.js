/**
 * @file server.js
 * @description Punto de entrada principal. Carga variables de entorno,
 *              conecta a MongoDB e inicia el servidor HTTP.
 */

'use strict';

require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/finix';

// Manejo de excepciones no capturadas globalmente
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

// ─── Conexión a Base de Datos ────────────────────────────────────────────────

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Conexión a MongoDB exitosa');
    })
    .catch((err) => {
        console.error('Error al conectar a MongoDB:', err.message);
    });

// ─── Inicio del Servidor ──────────────────────────────────────────────────────

const server = app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// Manejo de rechazos de promesas (por ejemplo, fallo en la red hacia MongoDB)
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});
