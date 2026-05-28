const Feedback = require('../models/Feedback');
const WorkLog = require('../models/WorkLog');
const aiService = require('../services/aiService');

exports.getLatestFeedback = async (req, res) => {
    try {
        const { company } = req.query;
        if (!company) {
            return res.status(400).json({ error: 'Company ID is required' });
        }

        // Check for feedback generated in the last 24 hours for this company
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        let latestFeedback = await Feedback.findOne({
            company,
            type: 'critique',
            generatedAt: { $gte: twentyFourHoursAgo }
        }).sort({ generatedAt: -1 });

        if (latestFeedback) {
            return res.json(latestFeedback);
        }

        // If no recent feedback, generate new one
        return await generateAndSaveFeedback(company, res);
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ error: 'Failed to fetch feedback' });
    }
};

exports.generateFeedback = async (req, res) => {
    try {
        const { company } = req.body;
        if (!company) {
            return res.status(400).json({ error: 'Company ID is required' });
        }
        await generateAndSaveFeedback(company, res);
    } catch (error) {
        console.error('Error generating feedback:', error);
        res.status(500).json({ error: 'Failed to generate feedback' });
    }
};

async function generateAndSaveFeedback(company, res) {
    // Fetch last 7 days of logs for this company
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const logs = await WorkLog.find({ 
        company,
        date: { $gte: sevenDaysAgo } 
    }).sort({ date: -1 });

    if (!logs || logs.length === 0) {
        return res.json({ 
            content: "# No Logs Found\nPlease add some work logs so I can analyze your performance!",
            generatedAt: new Date()
        });
    }

    let critiqueResult;
    try {
        critiqueResult = await aiService.generateCritique(logs, company);
    } catch (error) {
        const quotaResponse = aiService.toQuotaResponse(error);
        if (quotaResponse) {
            return res.status(quotaResponse.statusCode).json({
                content: quotaResponse.payload.content,
                generatedAt: new Date(),
                ...quotaResponse.payload
            });
        }
        throw error;
    }

    const newFeedback = new Feedback({
        company,
        content: critiqueResult.content,
        type: 'critique'
    });

    await newFeedback.save();
    res.json({
        ...newFeedback.toObject(),
        status: critiqueResult.status,
        provider: critiqueResult.provider,
        message: critiqueResult.message,
        quotaSafeguard: critiqueResult.quotaSafeguard
    });
}
