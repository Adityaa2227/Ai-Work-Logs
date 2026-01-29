const WorkLog = require('../models/WorkLog');
const exportService = require('../services/exportService');

// @desc    Export logs
// @route   GET /api/logs/export
// @access  Public
exports.exportLogs = async (req, res) => {
    try {
        const { from, to, type, format } = req.query;

        const query = {};
        if (from || to) {
            query.date = {};
            if (from) query.date.$gte = new Date(from);
            if (to) query.date.$lte = new Date(to);
        }

        const logs = await WorkLog.find(query).sort({ date: -1 });

        if (format === 'pdf') {
            exportService.generatePDF(logs, res);
        } else if (format === 'xlsx') {
            await exportService.generateExcel(logs, res);
        } else if (format === 'csv') {
            await exportService.generateCSV(logs, res);
        } else {
            res.status(400).json({ message: 'Invalid format. Use pdf, xlsx, or csv' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.exportSummaries = async (req, res) => {
    try {
        const { type } = req.query; // 'weekly' or 'monthly'
        const Summary = require('../models/Summary');
        
        if (!type || !['weekly', 'monthly'].includes(type)) {
            return res.status(400).json({ message: 'Invalid type. Use weekly or monthly.' });
        }

        const summaries = await Summary.find({ type }).sort({ year: -1, month: -1, week: -1 });

        // Assuming PDF format for now as that's the primary request
        const exportService = require('../services/exportService');
        exportService.generateSummaryPDF(summaries, type, res);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.exportBundle = async (req, res) => {
    try {
        const { from, to } = req.query;
        const archiver = require('archiver');
        const WorkLog = require('../models/WorkLog');
        const Summary = require('../models/Summary');
        const exportService = require('../services/exportService');
        const { PassThrough } = require('stream');

        // 1. Prepare Data Queries
        const logQuery = {};
        const summaryQuery = { weekly: { type: 'weekly' }, monthly: { type: 'monthly' } };

        if (from || to) {
            logQuery.date = {};
            if (from) logQuery.date.$gte = new Date(from);
            if (to) logQuery.date.$lte = new Date(to);

            if (from && to) {
               const start = new Date(from);
               const end = new Date(to);
               summaryQuery.weekly.startDate = { $gte: start };
               summaryQuery.weekly.endDate = { $lte: end };
               summaryQuery.monthly.year = { $gte: start.getFullYear(), $lte: end.getFullYear() };
            }
        }

        const logs = await WorkLog.find(logQuery).sort({ date: -1 });
        const weeklySummaries = await Summary.find(summaryQuery.weekly).sort({ year: -1, week: -1 });
        const monthlySummaries = await Summary.find(summaryQuery.monthly).sort({ year: -1, month: -1 });

        // 2. Setup ZIP Stream
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=worklogs_bundle.zip');

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);

        // 3. Helper to create PDF Stream
        const appendPDF = (generator, data, type, filename) => {
            const pdfStream = new PassThrough();
            archive.append(pdfStream, { name: filename });
            generator(data, null, null, pdfStream); 
            // Note: My refactor of generatePDF takes (data, res, stream). So passed null res, and pdfStream as stream.
        };

        // 4. Generate & Append
        // Daily Logs
        const dailyStream = new PassThrough();
        archive.append(dailyStream, { name: 'Daily_Logs.pdf' });
        exportService.generatePDF(logs, null, dailyStream);

        // Weekly Summaries
        const weeklyStream = new PassThrough();
        archive.append(weeklyStream, { name: 'Weekly_Summaries.pdf' });
        exportService.generateSummaryPDF(weeklySummaries, 'weekly', null, weeklyStream);

        // Monthly Summaries
        const monthlyStream = new PassThrough();
        archive.append(monthlyStream, { name: 'Monthly_Summaries.pdf' });
        exportService.generateSummaryPDF(monthlySummaries, 'monthly', null, monthlyStream);

        // Finalize
        await archive.finalize();

    } catch (error) {
        console.error('Bundle Export Error:', error);
        if (!res.headersSent) res.status(500).json({ message: error.message });
    }
};
