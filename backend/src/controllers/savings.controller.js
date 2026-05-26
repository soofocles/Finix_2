const SavingsGoal = require('../models/savingsGoal.model');

const handleError = (res, error) => {
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
        const goals = await SavingsGoal.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
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
        await goal.addContribution(personalFinanceId, monto);
        res.status(200).json({ success: true, data: goal });
    } catch (error) { handleError(res, error); }
};
