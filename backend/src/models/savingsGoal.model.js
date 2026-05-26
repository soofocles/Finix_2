const mongoose = require('mongoose');
const { Schema } = mongoose;

const savingsGoalSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    titulo: { type: String, required: true, trim: true },
    descripcion: { type: String, trim: true },
    montoObjetivo: { type: Number, required: true, set: v => Math.round(v * 100), get: v => v / 100 },
    montoActual: { type: Number, default: 0, set: v => Math.round(v * 100), get: v => v / 100 },
    moneda: { type: String, default: 'COP' },
    fechaObjetivo: { type: Date },
    activo: { type: Boolean, default: true },
    contribuciones: [{
        personalFinanceId: { type: Schema.Types.ObjectId, ref: 'PersonalFinance' },
        monto: { type: Number, set: v => Math.round(v * 100), get: v => v / 100 },
        fecha: { type: Date, default: Date.now }
    }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } });

savingsGoalSchema.pre(/^find/, function(next) {
    this.where({ isDeleted: false });
    next();
});

savingsGoalSchema.methods.addContribution = function(personalFinanceId, monto) {
    const montoC = Math.round(monto * 100);
    this.contribuciones.push({ personalFinanceId, monto: montoC });
    this.montoActual = ((this.montoActual || 0) * 100 + montoC) / 100;
    return this.save();
};

module.exports = mongoose.model('SavingsGoal', savingsGoalSchema);
