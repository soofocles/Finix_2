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

// ─── Conexión a Base de Datos + Inicio del Servidor ──────────────────────────

(async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            // ── Pool de conexiones ─────────────────────────────────────
            maxPoolSize: 10,            // Máx conexiones simultáneas
            minPoolSize: 2,             // Mantener mínimo 2 conexiones calientes
            maxIdleTimeMS: 30000,       // Cerrar conexiones inactivas después de 30s

            // ── Timeouts ───────────────────────────────────────────────
            serverSelectionTimeoutMS: 5000,   // Máx 5s para seleccionar servidor
            socketTimeoutMS: 45000,           // Máx 45s por operación de socket
            connectTimeoutMS: 10000,          // Máx 10s para establecer conexión

            // ── Resiliencia ────────────────────────────────────────────
            retryWrites: true,
            retryReads: true,

            // ── Evitar buffering silencioso ────────────────────────────
            bufferCommands: false,      // Fallar inmediatamente si no hay conexión
        });

        console.log('Conexión a MongoDB exitosa');

        // Iniciar el servidor SOLO después de conectar a la DB
        const server = app.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto ${PORT}`);
        });

        // Manejo de rechazos de promesas
        process.on('unhandledRejection', (err) => {
            console.error('UNHANDLED REJECTION! Shutting down...');
            console.error(err.name, err.message);
            server.close(() => {
                process.exit(1);
            });
        });

    } catch (err) {
        console.error('Error al conectar a MongoDB:', err.message);
        process.exit(1);
    }
})();
