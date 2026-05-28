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
    },
    customFields: {
        type: Map,
        of: String,
        default: {}
    },
    
    // === NEW ENGINEERING FIELDS ===
    rawNotes: {
        type: String,
        default: ''
    },
    sprint: {
        type: String,
        default: ''
    },
    jiraTicket: {
        type: String,
        default: ''
    },
    prNumber: {
        type: String,
        default: ''
    },
    workStatus: {
        type: String,
        enum: ['in-progress', 'completed', 'blocked', 'review', 'deployed', ''],
        default: ''
    },
    systemsModules: {
        type: [String],
        default: []
    },
    apisModified: {
        type: [String],
        default: []
    },
    technologiesUsed: {
        type: [String],
        default: []
    },
    databasesTouched: {
        type: [String],
        default: []
    },
    infraServices: {
        type: [String],
        default: []
    },
    activities: {
        bugsFixed: { type: Number, default: 0 },
        featuresImplemented: { type: Number, default: 0 },
        prsCreated: { type: Number, default: 0 },
        prsReviewed: { type: Number, default: 0 },
        meetingsAttended: { type: Number, default: 0 },
        testsWritten: { type: Number, default: 0 },
        debugging: { type: Boolean, default: false },
        architectureDiscussion: { type: Boolean, default: false },
        codeReview: { type: Boolean, default: false },
        deployment: { type: Boolean, default: false }
    },
    ownershipLevel: {
        type: String,
        enum: ['assisted', 'pair-programmed', 'independent', 'led-discussion', ''],
        default: ''
    },
    complexity: {
        type: String,
        enum: ['low', 'medium', 'high', ''],
        default: ''
    },
    engineeringImpact: {
        whatChanged: { type: String, default: '' },
        whyItMattered: { type: String, default: '' },
        problemSolved: { type: String, default: '' },
        blockerRemoved: { type: String, default: '' }
    },
    reflection: {
        biggestLearning: { type: String, default: '' },
        biggestBlocker: { type: String, default: '' },
        whatConfusedMe: { type: String, default: '' }
    },
    testing: {
        testsAdded: { type: String, default: '' },
        testingType: { type: [String], default: [] },
        coverageNotes: { type: String, default: '' }
    },
    aiSummary: {
        type: String,
        default: ''
    },
    images: {
        type: [String],
        default: []
    }
});

// Add text index for smart search
WorkLogSchema.index({
    task: 'text',
    blockers: 'text',
    learnings: 'text',
    rawNotes: 'text',
    'engineeringImpact.whatChanged': 'text',
    'engineeringImpact.problemSolved': 'text',
    aiSummary: 'text'
});

module.exports = mongoose.model('WorkLog', WorkLogSchema);
