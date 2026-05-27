const PaymentSchedule = require('../models/paymentSchedule.model');
const PersonalFinance = require('../models/personalFinance.model');

const handleError = (res, error) => {
    console.error('[SCHEDULES CONTROLLER ERROR]', error);
    if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: error.message });
    return res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
};

exports.create = async (req, res) => {
    try {
        const data = { ...req.body, userId: req.user.id, createdBy: req.user.id };
        if (data.fechaInicio && !data.proximaEjecucion) {
            data.proximaEjecucion = data.fechaInicio;
        }
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

        // Calculate next execution date based on frequency
        const proxima = new Date(s.proximaEjecucion || s.fechaInicio || new Date());
        if (s.frecuencia === 'diaria') proxima.setDate(proxima.getDate() + 1);
        else if (s.frecuencia === 'semanal') proxima.setDate(proxima.getDate() + 7);
        else if (s.frecuencia === 'quincenal') proxima.setDate(proxima.getDate() + 15);
        else if (s.frecuencia === 'mensual') proxima.setMonth(proxima.getMonth() + 1);
        else if (s.frecuencia === 'bimestral') proxima.setMonth(proxima.getMonth() + 2);
        else if (s.frecuencia === 'trimestral') proxima.setMonth(proxima.getMonth() + 3);
        else if (s.frecuencia === 'semestral') proxima.setMonth(proxima.getMonth() + 6);
        else if (s.frecuencia === 'anual') proxima.setFullYear(proxima.getFullYear() + 1);

        // Deactivate if past end date
        if (s.fechaFin && proxima > new Date(s.fechaFin)) {
            s.activa = false;
            s.proximaEjecucion = null;
        } else {
            s.proximaEjecucion = proxima;
        }

        await s.save();

        res.status(201).json({ success: true, data: saved });
    } catch (error) { handleError(res, error); }
};
