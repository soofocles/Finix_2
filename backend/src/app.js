/**
 * @file app.js
 * @description Configuración principal de Express, middlewares globales y enrutamiento.
 */

'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const personalFinanceRoutes = require('./routes/personalFinance.routes');
const businessFinanceRoutes = require('./routes/businessFinance.routes');

// Middlewares locales
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

// ─── Global Middlewares ───────────────────────────────────────────────────────

// Seguridad HTTP headers
app.use(helmet());

// CORS (Cross-Origin Resource Sharing)
app.use(cors());

// Logging de peticiones HTTP en consola
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Parseo de body a JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rutas Base ───────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/personal-finance', personalFinanceRoutes);
app.use('/api/business-finance', businessFinanceRoutes);

// Ruta de comprobación de salud del servidor (Health Check)
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Servidor operativo.' });
});

// ─── Manejo de Errores ────────────────────────────────────────────────────────

// 1. Manejar rutas no encontradas (404)
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// 2. Manejador global de errores
app.use(errorHandler);

module.exports = app;
