const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const financeController = require('../controllers/personalFinance.controller');
const savingsController = require('../controllers/savings.controller');
const debtsController = require('../controllers/debts.controller');
const schedulesController = require('../controllers/schedules.controller');
const auth = require('../middlewares/auth.middleware');

/**
 * Logger simple para endpoints sensibles (AI/analytics)
 * TODO: Reemplazar con Winston/Pino en producción
 */
const logAccess = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.user.id} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    });
    next();
};

/**
 * Rate limiter para endpoints AI costosos
 * 10 req/min por usuario con headers estándar (RFC 6585)
 */
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.user.id,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Límite de peticiones alcanzado. Intenta de nuevo en un minuto.'
    }
});

/**
 * Burst protection: máx 5 req en 10 segundos
 * Previene ataques de ráfaga contra endpoints costosos
 */
const burstLimiter = rateLimit({
    windowMs: 10 * 1000,
    max: 5,
    keyGenerator: (req) => req.user.id,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false
});

/**
 * Valida múltiples ObjectIds en params
 * @param  {...string} params - Nombres de parámetros a validar
 * @returns {Function} Express middleware
 */
const validateObjectId = (...params) => (req, res, next) => {
    for (const param of params) {
        if (!mongoose.Types.ObjectId.isValid(req.params[param])) {
            return res.status(400).json({
                success: false,
                message: `ID inválido: ${param}`
            });
        }
    }
    next();
};


router.use(auth); 

// --- Analytics & AI (endpoints costosos: burst + rate limit + logging)
router.get('/analysis', logAccess, financeController.getAnalysis);
router.get('/prediction', logAccess, burstLimiter, aiLimiter, financeController.getPrediction);
router.get('/simulation', logAccess, burstLimiter, aiLimiter, financeController.getSimulation);


// --- Sub-resources: savings goals, debts, payment schedules
router.get('/savings', savingsController.getAll);
router.post('/savings', savingsController.create);
router.get('/savings/:id', validateObjectId('id'), savingsController.getById);
router.put('/savings/:id', validateObjectId('id'), savingsController.update);
router.post('/savings/:id/contribute', validateObjectId('id'), savingsController.addContribution);
router.delete('/savings/:id', validateObjectId('id'), savingsController.delete);

router.get('/debts', debtsController.getAll);
router.post('/debts', debtsController.create);
router.get('/debts/:id', validateObjectId('id'), debtsController.getById);
router.put('/debts/:id', validateObjectId('id'), debtsController.update);
router.post('/debts/:id/pay', validateObjectId('id'), debtsController.applyPayment);
router.delete('/debts/:id', validateObjectId('id'), debtsController.delete);

router.get('/schedules', schedulesController.getAll);
router.post('/schedules', schedulesController.create);
router.get('/schedules/:id', validateObjectId('id'), schedulesController.getById);
router.put('/schedules/:id', validateObjectId('id'), schedulesController.update);
router.post('/schedules/:id/execute', validateObjectId('id'), schedulesController.executeNow);
router.delete('/schedules/:id', validateObjectId('id'), schedulesController.delete);

router.get('/', financeController.getAllFinances);
router.post('/', financeController.createFinance);

router.get('/:id', validateObjectId('id'), financeController.getFinanceById);
router.put('/:id', validateObjectId('id'), financeController.updateFinance);
router.delete('/:id', validateObjectId('id'), financeController.deleteFinance);

/**
 * NOTA: Versionado de API
 * En producción, montar este router en app.js como:
 * app.use('/api/v1/finances', require('./routes/personalFinance.routes'));
 */
module.exports = router;