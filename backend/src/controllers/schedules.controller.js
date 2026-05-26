const PaymentSchedule = require('../models/paymentSchedule.model');
const PersonalFinance = require('../models/personalFinance.model');

const handleError = (res, error) => {
    if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: error.message });
    return res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
};

exports.create = async (req, res) => {
    try {
        const data = { ...req.body, userId: req.user.id, createdBy: req.user.id };
        const sched = new PaymentSchedule(data);
        const saved = await sched.save();
        res.status(201).json({ success: true, data: saved });
    } catch (error) { handleError(res, error); }
};

exports.getAll = async (req, res) => {
    try {
        const schedules = await PaymentSchedule.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
        res.status(200).json({ success: true, data: schedules });
    } catch (error) { handleError(res, error); }
};

exports.getById = async (req, res) => {
    try {
        const s = await PaymentSchedule.findOne({ _id: req.params.id, userId: req.user.id });
        if (!s) return res.status(404).json({ success: false, message: 'Programación no encontrada' });
        res.status(200).json({ success: true, data: s });
    } catch (error) { handleError(res, error); }
};

exports.update = async (req, res) => {
    try {
        const updated = await PaymentSchedule.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { ...req.body, updatedBy: req.user.id },
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ success: false, message: 'Programación no encontrada' });
        res.status(200).json({ success: true, data: updated });
    } catch (error) { handleError(res, error); }
};

exports.delete = async (req, res) => {
    try {
        const s = await PaymentSchedule.findOne({ _id: req.params.id, userId: req.user.id });
        if (!s) return res.status(404).json({ success: false, message: 'Programación no encontrada' });
        s.isDeleted = true;
        await s.save();
        res.status(204).send();
    } catch (error) { handleError(res, error); }
};

/** Execute a single scheduled occurrence: create a PersonalFinance entry based on template */
exports.executeNow = async (req, res) => {
    try {
        const s = await PaymentSchedule.findOne({ _id: req.params.id, userId: req.user.id });
        if (!s) return res.status(404).json({ success: false, message: 'Programación no encontrada' });
        if (!s.activa) return res.status(400).json({ success: false, message: 'Programación inactiva' });

        const template = s.plantillaTransaccion || {};
        const tx = new PersonalFinance({
            userId: req.user.id,
            tipo: template.tipo || 'gasto',
            monto: s.monto,
            moneda: s.moneda,
            categoria: template.categoria || 'programado',
            metodoPago: template.metodoPago || 'efectivo',
            descripcion: template.descripcion || s.descripcion || `Pago programado: ${s.titulo}`,
            cuentaOrigenId: template.cuentaOrigenId,
            cuentaDestinoId: template.cuentaDestinoId,
            createdBy: req.user.id
        });

        const saved = await tx.save();

        // Update next execution date is left to a background worker; set proximaEjecucion null for now
        s.proximaEjecucion = null;
        await s.save();

        res.status(201).json({ success: true, data: saved });
    } catch (error) { handleError(res, error); }
};
