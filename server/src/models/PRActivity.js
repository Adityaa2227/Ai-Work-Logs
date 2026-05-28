const mongoose = require('mongoose');

const PRActivitySchema = new mongoose.Schema({
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
    type: {
        type: String,
        enum: ['pr-created', 'pr-reviewed', 'pr-merged', 'jira-ticket', 'blocker'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    ticketId: {
        type: String,
        default: ''
    },
    prNumber: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['open', 'in-review', 'approved', 'merged', 'closed', 'blocked'],
        default: 'open'
    },
    reviewFeedback: {
        type: String,
        default: ''
    },
    sprint: {
        type: String,
        default: ''
    },
    linkedWorkLog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WorkLog',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PRActivity', PRActivitySchema);
