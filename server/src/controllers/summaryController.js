const Summary = require('../models/Summary');
const WorkLog = require('../models/WorkLog');
const { generateSummary } = require('../services/aiService');

// Get week number from date
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Get Monday and Sunday of a week
function getWeekBounds(year, weekNumber) {
    const simple = new Date(year, 0, 1 + (weekNumber - 1) * 7);
    const dayOfWeek = simple.getDay();
    const isoWeekStart = simple;
    
    if (dayOfWeek <= 4) {
        isoWeekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
        isoWeekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }
    
    const monday = new Date(isoWeekStart);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return { monday, sunday };
}

// Auto-generate weekly summary (called when Sunday log is created)
exports.autoGenerateWeeklySummary = async (company, date) => {
    try {
        const weekNumber = getWeekNumber(date);
        const year = date.getFullYear();
        
        // Check if summary already exists
        const existing = await Summary.findOne({ company, type: 'weekly', weekNumber, year });
        if (existing) {
            console.log(`Weekly summary already exists for week ${weekNumber}, ${year}`);
            return existing;
        }
        
        const { monday, sunday } = getWeekBounds(year, weekNumber);
        
        // Fetch all logs for this week
        const logs = await WorkLog.find({
            company,
            date: { $gte: monday, $lte: sunday }
        }).sort({ date: 1 });
        
        if (logs.length === 0) {
            console.log('No logs found for this week');
            return null;
        }
        
        // Generate AI summary
        const aiResult = await generateSummary({ from: monday, to: sunday, type: 'weekly' }, logs);
        
        // Save summary
        const summary = new Summary({
            company,
            type: 'weekly',
            startDate: monday,
            endDate: sunday,
            content: aiResult.content,
            weekNumber,
            year,
            generatedAt: new Date()
        });
        
        await summary.save();
        console.log(`Weekly summary generated for week ${weekNumber}, ${year}`);
        return summary;
        
    } catch (error) {
        console.error('Error auto-generating weekly summary:', error);
        throw error;
    }
};

// Auto-generate monthly summary (called on last day of month)
exports.autoGenerateMonthlySummary = async (company, date) => {
    try {
        const month = date.getMonth() + 1; // 1-12
        const year = date.getFullYear();
        
        // Check if summary already exists
        const existing = await Summary.findOne({ company, type: 'monthly', month, year });
        if (existing) {
            console.log(`Monthly summary already exists for ${month}/${year}`);
            return existing;
        }
        
        // Get first and last day of month
        const startDate = new Date(year, month - 1, 1);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(year, month, 0);
        endDate.setHours(23, 59, 59, 999);
        
        // Fetch all logs for this month
        const logs = await WorkLog.find({
            company,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });
        
        if (logs.length === 0) {
            console.log('No logs found for this month');
            return null;
        }
        
        // Generate AI summary
        const aiResult = await generateSummary({ from: startDate, to: endDate, type: 'monthly' }, logs);
        
        // Save summary
        const summary = new Summary({
            company,
            type: 'monthly',
            startDate,
            endDate,
            content: aiResult.content,
            month,
            year,
            generatedAt: new Date()
        });
        
        await summary.save();
        console.log(`Monthly summary generated for ${month}/${year}`);
        return summary;
        
    } catch (error) {
        console.error('Error auto-generating monthly summary:', error);
        throw error;
    }
};

// Get all weekly summaries
exports.getWeeklySummaries = async (req, res) => {
    try {
        const { company } = req.query;
        if (!company) {
            return res.status(400).json({ message: 'Company ID is required' });
        }
        
        const summaries = await Summary.find({ company, type: 'weekly' })
            .sort({ year: -1, weekNumber: -1 });
        
        res.json(summaries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all monthly summaries
exports.getMonthlySummaries = async (req, res) => {
    try {
        const { company } = req.query;
        if (!company) {
            return res.status(400).json({ message: 'Company ID is required' });
        }
        
        const summaries = await Summary.find({ company, type: 'monthly' })
            .sort({ year: -1, month: -1 });
        
        res.json(summaries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Manually generate weekly summary
exports.generateWeeklySummary = async (req, res) => {
    try {
        const { weekNumber, year, company } = req.body;
        
        if (!weekNumber || !year || !company) {
            return res.status(400).json({ message: 'Week number, year, and company are required' });
        }
        
        const { monday, sunday } = getWeekBounds(year, weekNumber);
        const date = new Date(year, 0, 1 + (weekNumber - 1) * 7);
        
        const summary = await exports.autoGenerateWeeklySummary(company, date);
        
        if (!summary) {
            return res.status(404).json({ message: 'No logs found for this week' });
        }
        
        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Manually generate monthly summary
exports.generateMonthlySummary = async (req, res) => {
    try {
        const { month, year, company } = req.body;
        
        if (!month || !year || !company) {
            return res.status(400).json({ message: 'Month, year, and company are required' });
        }
        
        const date = new Date(year, month - 1, 15); // Mid-month date
        const summary = await exports.autoGenerateMonthlySummary(company, date);
        
        if (!summary) {
            return res.status(404).json({ message: 'No logs found for this month' });
        }
        
        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Update a summary
exports.updateSummary = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        const summary = await Summary.findById(id);
        if (!summary) return res.status(404).json({ message: 'Summary not found' });

        summary.content = content;
        await summary.save();

        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
