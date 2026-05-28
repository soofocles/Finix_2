/**
 * Category Model
 * Transaction classification system per user
 * Enforces unique category names per user for consistent reporting
 * @module models/Category
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

const categorySchema = new Schema({
    // Reference to category owner (categories are user-specific)
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Category name (normalized to lowercase for consistency)
    nombre: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },

    // Transaction type this category applies to
    tipo: {
        type: String,
        enum: ['ingreso', 'gasto'], 
        required: true,
        index: true
    },

    color: String,
    icono: String,

    // System-generated categories (vs user-created)
    isDefault: {
        type: Boolean,
        default: false
    },

    // Soft delete - preserves historical transaction references
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },

    deletedAt: {
        type: Date
    }

}, { timestamps: true });

// Enforce unique category names per user (case-insensitive via lowercase)
categorySchema.index({ userId: 1, nombre: 1 }, { unique: true });

categorySchema.methods.softDelete = function () {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return this.save();
};

// Soft delete middleware - auto-exclude deleted categories from queries
categorySchema.pre(/^find/, function() {
    this.where({ isDeleted: false });
});

categorySchema.pre('aggregate', function() {
    const pipeline = this.pipeline();
    if (pipeline.length > 0 && pipeline[0].$geoNear) {
        pipeline.splice(1, 0, { $match: { isDeleted: false } });
    } else {
        pipeline.unshift({ $match: { isDeleted: false } });
    }
});

module.exports = mongoose.model('Category', categorySchema);