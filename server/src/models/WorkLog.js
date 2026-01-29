const mongoose = require('mongoose');

const WorkLogSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Available', 'No Work', 'Leave', 'Holiday'],
        default: 'Available',
        required: true
    },
    noWorkReason: {
        type: String,
        default: ''
    },
    project: {
        type: String,
        trim: true,
        default: ''
    },
    task: {
        type: String,
        trim: true,
        default: ''
    },
    workDone: {
        type: [String],
        default: []
    },
    filesTouched: {
        type: [String],
        default: []
    },
    techStack: {
        type: [String],
        default: []
    },
    blockers: {
        type: String,
        default: ''
    },
    learnings: {
        type: [String],
        default: []
    },
    impact: {
        type: [String],
        default: []
    },
    nextPlan: {
        type: String,
        default: ''
    },
    // Keeping hours optional for backward compatibility if needed, but not required
    hours: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('WorkLog', WorkLogSchema);
