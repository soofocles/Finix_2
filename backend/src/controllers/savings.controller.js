const SavingsGoal = require('../models/savingsGoal.model');
const PersonalFinance = require('../models/personalFinance.model');

const handleError = (res, error) => {
    console.error('[SAVINGS ERROR]', error.name, error.message, error.stack);
    if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: error.message });
    return res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
};

exports.create = async (req, res) => {
    try {
        const data = { ...req.body, userId: req.user.id, createdBy: req.user.id };
        const goal = new SavingsGoal(data);
        const saved = await goal.save();
        res.status(201).json({ success: true, data: saved });
    } catch (error) { handleError(res, error); }
};

exports.getAll = async (req, res) => {
    try {
        const goals = await SavingsGoal.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: goals });
    } catch (error) { handleError(res, error); }
};

exports.getById = async (req, res) => {
    try {
        const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user.id });
        if (!goal) return res.status(404).json({ success: false, message: 'Meta no encontrada' });
        res.status(200).json({ success: true, data: goal });
    } catch (error) { handleError(res, error); }
};

exports.update = async (req, res) => {
    try {
        const updated = await SavingsGoal.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { ...req.body, updatedBy: req.user.id },
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ success: false, message: 'Meta no encontrada' });
        res.status(200).json({ success: true, data: updated });
    } catch (error) { handleError(res, error); }
};

exports.delete = async (req, res) => {
    try {
        const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user.id });
        if (!goal) return res.status(404).json({ success: false, message: 'Meta no encontrada' });
        goal.isDeleted = true;
        await goal.save();
        res.status(204).send();
    } catch (error) { handleError(res, error); }
};

exports.addContribution = async (req, res) => {
    try {
        const { personalFinanceId, monto } = req.body;
        if (!monto) return res.status(400).json({ success: false, message: 'Monto requerido' });
        const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user.id });
        if (!goal) return res.status(404).json({ success: false, message: 'Meta no encontrada' });

        let pfId = personalFinanceId;
        if (!pfId) {
            const tx = new PersonalFinance({
                userId: req.user.id,
                tipo: 'gasto',
                monto: Number(monto),
                moneda: goal.moneda || 'COP',
                categoria: 'ahorros',
                descripcion: `Aporte a meta: ${goal.titulo}`,
                metodoPago: 'efectivo',
                estado: 'completado',
                esAhorro: true,
                createdBy: req.user.id
            });
            const savedTx = await tx.save();
            pfId = savedTx._id;
        }

        await goal.addContribution(pfId, monto);
        res.status(200).json({ success: true, data: goal });
    } catch (error) { handleError(res, error); }
};
