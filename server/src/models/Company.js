const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a company name'],
        trim: true,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Used to configure which fields are active on the Log Form
    logTemplate: {
        visibleFields: {
            filesTouched: { type: Boolean, default: true },
            blockers: { type: Boolean, default: true },
            learnings: { type: Boolean, default: true },
            impact: { type: Boolean, default: true }
        },
        customFields: [{ type: String }] // e.g. ["Meetings", "PRs"]
    }
});

module.exports = mongoose.model('Company', CompanySchema);
