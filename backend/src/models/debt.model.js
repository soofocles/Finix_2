const mongoose = require('mongoose');
const { Schema } = mongoose;

const debtSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    acreedor: { type: String, required: true },
    descripcion: { type: String },
    principal: { type: Number, required: true, set: v => Math.round(v * 100), get: v => v / 100 },
    saldo: { type: Number, required: true, set: v => Math.round(v * 100), get: v => v / 100 },
    tasaInteresAnual: { type: Number, default: 0 },
    fechaVencimiento: { type: Date },
    minimoPago: { type: Number, set: v => Math.round(v * 100), get: v => v / 100 },
    activo: { type: Boolean, default: true },
    pagos: [{
        personalFinanceId: { type: Schema.Types.ObjectId, ref: 'PersonalFinance' },
        monto: { type: Number, set: v => Math.round(v * 100), get: v => v / 100 },
        fecha: { type: Date, default: Date.now }
    }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } });

debtSchema.pre(/^find/, function() {
    this.where({ isDeleted: false });
});

debtSchema.methods.applyPayment = function(personalFinanceId, monto) {
    const montoNum = Number(monto);
    const montoC = Math.round(montoNum * 100);
    if (montoC > Math.round((this.saldo || 0) * 100)) {
        throw new Error('El pago excede el saldo de la deuda');
    }
    this.pagos.push({ personalFinanceId, monto: montoNum });
    this.saldo = (Math.round((this.saldo || 0) * 100) - montoC) / 100;
    return this.save();
};

module.exports = mongoose.model('Debt', debtSchema);
