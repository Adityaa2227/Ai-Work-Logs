const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['critique', 'tip', 'general'],
        default: 'critique'
    },
    generatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
