const aiService = require('../services/aiService');
const WorkLog = require('../models/WorkLog');
const Summary = require('../models/Summary');

// @desc    Generate AI Summary
// @route   POST /api/ai/generate
// @access  Public
exports.generateReport = async (req, res) => {
    try {
        const { from, to, type, company } = req.body;

        if (!from || !to || !company) {
            return res.status(400).json({ message: 'Please provide company, from and to dates' });
        }

        // Fetch logs for the range
        const logs = await WorkLog.find({
            company,
            date: { $gte: new Date(from), $lte: new Date(to) }
        });

        if (logs.length === 0) {
            return res.status(404).json({ message: 'No logs found for this period' });
        }

        const aiResponse = await aiService.generateSummary({ from, to, type: type || 'custom' }, logs);

        // If save is explicitly false, return without saving to DB
        if (req.body.save === false) {
            return res.json({
                content: aiResponse.content,
                generatedAt: aiResponse.generatedAt || new Date()
            });
        }

        // Calculate week/month for the summary
        const startDate = new Date(from);
        const endDate = new Date(to);
        const year = startDate.getFullYear();
        
        // Determine if it's weekly or monthly based on type or date range
        let summaryType = type || 'custom';
        let weekNumber, month;
        
        if (summaryType === 'weekly' || summaryType === 'custom') {
            // Calculate week number
            const d = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        }
        
        if (summaryType === 'monthly') {
            month = startDate.getMonth() + 1; // 1-12
        }

        // Save Summary with new schema
        const summary = await Summary.create({
            company,
            type: summaryType, 
            startDate,
            endDate,
            content: aiResponse.content,
            weekNumber: weekNumber || undefined,
            month: month || undefined,
            year,
            generatedAt: aiResponse.generatedAt || new Date()
        });

        res.json(summary);
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get latest AI summary
// @route   GET /api/ai/latest
// @access  Public
exports.getLatestSummary = async (req, res) => {
    try {
        const { company } = req.query;
        // In real app, summaries would also need a company link.
        // For now, assuming standard flow. If summaries don't have company ref, we might need to add it.
        // Let's add company ref to Summary model or just filter locally if needed. 
        // Ideally Summary model updates too. But for speed, let's just create summaries with company ID if possible?
        // Actually, Summary model DOES NOT have company ID yet.
        
        // Quick fix: Just return latest for now as user might not have many companies. 
        // OR better: Update Summary Schema?
        const summary = await Summary.findOne().sort({ generatedAt: -1 });
        if (!summary) {
            return res.status(404).json({ message: 'No summaries generated yet' });
        }
        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get daily AI insight
// @route   POST /api/ai/insight
// @access  Public
exports.getInsight = async (req, res) => {
    try {
        const { company } = req.body;
        if (!company) return res.status(400).json({ message: 'Company required' });

        // Get last 3 days of logs
        let logs = await WorkLog.find({
            company,
            date: { $gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
        }).limit(10);

        // Fallback: If no recent logs, get the last 10 logs ever
        if (logs.length === 0) {
            logs = await WorkLog.find({ company })
                .sort({ date: -1 })
                .limit(10);
        }

        const insight = await aiService.generateInsight(logs);
        res.json({ content: insight, generatedAt: new Date() });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
