const mongoose = require('mongoose');
const { Schema } = mongoose;

const FRECUENCIAS = ['diaria', 'semanal', 'quincenal', 'mensual', 'bimestral', 'trimestral', 'semestral', 'anual'];

const paymentScheduleSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    titulo: { type: String, required: true },
    descripcion: { type: String },
    monto: { type: Number, required: true, set: v => Math.round(v * 100), get: v => v / 100 },
    moneda: { type: String, default: 'COP' },
    frecuencia: { type: String, enum: FRECUENCIAS, required: true },
    fechaInicio: { type: Date, required: true },
    fechaFin: { type: Date },
    proximaEjecucion: { type: Date },
    activa: { type: Boolean, default: true },
    plantillaTransaccion: { // minimal template to create a PersonalFinance record when executed
        tipo: { type: String, enum: ['ingreso', 'gasto', 'transferencia'], default: 'gasto' },
        categoria: String,
        metodoPago: String,
        cuentaOrigenId: { type: Schema.Types.ObjectId, ref: 'Account' },
        cuentaDestinoId: { type: Schema.Types.ObjectId, ref: 'Account' },
        descripcion: String
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } });

paymentScheduleSchema.pre(/^find/, function(next) {
    this.where({ isDeleted: false });
    next();
});

paymentScheduleSchema.methods.deactivate = function() {
    this.activa = false;
    return this.save();
};

module.exports = mongoose.model('PaymentSchedule', paymentScheduleSchema);
