const Feedback = require('../models/Feedback');
const WorkLog = require('../models/WorkLog');
const aiService = require('../services/aiService');

exports.getLatestFeedback = async (req, res) => {
    try {
        // Check for feedback generated in the last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        let latestFeedback = await Feedback.findOne({
            type: 'critique',
            generatedAt: { $gte: twentyFourHoursAgo }
        }).sort({ generatedAt: -1 });

        if (latestFeedback) {
            return res.json(latestFeedback);
        }

        // If no recent feedback, generate new one
        return await generateAndSaveFeedback(res);
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ error: 'Failed to fetch feedback' });
    }
};

exports.generateFeedback = async (req, res) => {
    try {
        await generateAndSaveFeedback(res);
    } catch (error) {
        console.error('Error generating feedback:', error);
        res.status(500).json({ error: 'Failed to generate feedback' });
    }
};

async function generateAndSaveFeedback(res) {
    // specific user id is not passed, assuming single user or handled by context. 
    // BUT we need logs to analyze. Let's fetch last 7 days of logs.
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const logs = await WorkLog.find({ date: { $gte: sevenDaysAgo } }).sort({ date: -1 });

    if (!logs || logs.length === 0) {
        return res.json({ 
            content: "# No Logs Found\nPlease add some work logs so I can analyze your performance!",
            generatedAt: new Date()
        });
    }

    const critique = await aiService.generateCritique(logs);

    const newFeedback = new Feedback({
        content: critique,
        type: 'critique'
    });

    await newFeedback.save();
    res.json(newFeedback);
}
