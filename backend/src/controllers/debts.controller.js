const Debt = require('../models/debt.model');

const handleError = (res, error) => {
    if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: error.message });
    return res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
};

exports.create = async (req, res) => {
    try {
        const data = { ...req.body, userId: req.user.id, createdBy: req.user.id };
        // Ensure saldo defaults to principal if not provided
        if (data.saldo === undefined) data.saldo = data.principal;
        const debt = new Debt(data);
        const saved = await debt.save();
        res.status(201).json({ success: true, data: saved });
    } catch (error) { handleError(res, error); }
};

exports.getAll = async (req, res) => {
    try {
        const debts = await Debt.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
        res.status(200).json({ success: true, data: debts });
    } catch (error) { handleError(res, error); }
};

exports.getById = async (req, res) => {
    try {
        const debt = await Debt.findOne({ _id: req.params.id, userId: req.user.id });
        if (!debt) return res.status(404).json({ success: false, message: 'Deuda no encontrada' });
        res.status(200).json({ success: true, data: debt });
    } catch (error) { handleError(res, error); }
};

exports.update = async (req, res) => {
    try {
        const updated = await Debt.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { ...req.body, updatedBy: req.user.id },
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ success: false, message: 'Deuda no encontrada' });
        res.status(200).json({ success: true, data: updated });
    } catch (error) { handleError(res, error); }
};

exports.delete = async (req, res) => {
    try {
        const debt = await Debt.findOne({ _id: req.params.id, userId: req.user.id });
        if (!debt) return res.status(404).json({ success: false, message: 'Deuda no encontrada' });
        debt.isDeleted = true;
        await debt.save();
        res.status(204).send();
    } catch (error) { handleError(res, error); }
};

exports.applyPayment = async (req, res) => {
    try {
        const { personalFinanceId, monto } = req.body;
        if (!monto) return res.status(400).json({ success: false, message: 'Monto requerido' });
        const debt = await Debt.findOne({ _id: req.params.id, userId: req.user.id });
        if (!debt) return res.status(404).json({ success: false, message: 'Deuda no encontrada' });
        await debt.applyPayment(personalFinanceId, monto);
        res.status(200).json({ success: true, data: debt });
    } catch (error) { handleError(res, error); }
};
