const mongoose = require('mongoose');

const SummarySchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    type: {
        type: String,
        enum: ['weekly', 'monthly', 'sprint', 'ppo-review', 'contribution-report', 'custom'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    metadata: {
        systemsCovered: { type: [String], default: [] },
        technologiesUsed: { type: [String], default: [] },
        totalPRs: { type: Number, default: 0 },
        totalTickets: { type: Number, default: 0 },
        ownershipBreakdown: { type: Map, of: Number, default: {} }
    },
    weekNumber: {
        type: Number,
        required: function() { return this.type === 'weekly'; }
    },
    month: {
        type: Number,
        min: 1,
        max: 12,
        required: function() { return this.type === 'monthly'; }
    },
    year: {
        type: Number,
        required: true
    },
    generatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound indexes to ensure uniqueness per company
SummarySchema.index({ company: 1, type: 1, weekNumber: 1, year: 1 }, { 
    unique: true, 
    partialFilterExpression: { type: 'weekly' }
});

SummarySchema.index({ company: 1, type: 1, month: 1, year: 1 }, { 
    unique: true,
    partialFilterExpression: { type: 'monthly' }
});

module.exports = mongoose.model('Summary', SummarySchema);
