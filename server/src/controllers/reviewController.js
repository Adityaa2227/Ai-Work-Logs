const Summary = require('../models/Summary');
const WorkLog = require('../models/WorkLog');
const PRActivity = require('../models/PRActivity');
const aiService = require('../services/aiService');
const prompts = require('../utils/prompts');
const mongoose = require('mongoose');

const sendQuotaResponse = (res, error) => {
    const quotaResponse = aiService.toQuotaResponse(error);
    if (!quotaResponse) return false;
    res.status(quotaResponse.statusCode).json(quotaResponse.payload);
    return true;
};

// Helper to extract basic metadata from logs and PRs
const extractMetadata = async (logs, company, from, to) => {
    const systemsCovered = [...new Set(logs.flatMap(l => l.systemsModules || []).filter(Boolean))];
    const technologiesUsed = [...new Set(logs.flatMap(l => l.technologiesUsed || l.techStack || []).filter(Boolean))];
    
    // Fetch PR count in range
    const prQuery = {
        company,
        date: { $gte: new Date(from), $lte: new Date(to) }
    };
    const prs = await PRActivity.find(prQuery);
    const totalPRs = prs.filter(p => p.type.startsWith('pr-')).length;
    const totalTickets = prs.filter(p => p.type === 'jira-ticket').length;

    // Calculate ownership breakdown
    const ownershipBreakdown = new Map();
    logs.forEach(l => {
        if (l.ownershipLevel) {
            const count = ownershipBreakdown.get(l.ownershipLevel) || 0;
            ownershipBreakdown.set(l.ownershipLevel, count + 1);
        }
    });

    return {
        systemsCovered,
        technologiesUsed,
        totalPRs,
        totalTickets,
        ownershipBreakdown
    };
};

// @desc    Generate PPO self-review report
// @route   POST /api/review/ppo
// @access  Public
exports.generatePPOReview = async (req, res) => {
    try {
        const { company, from, to } = req.body;

        if (!company || !from || !to) {
            return res.status(400).json({ message: 'Company ID, from, and to dates are required.' });
        }

        // Fetch logs
        const logs = await WorkLog.find({
            company,
            date: { $gte: new Date(from), $lte: new Date(to) },
            status: 'Available'
        });

        if (logs.length === 0) {
            return res.status(400).json({ message: 'No work logs found in the selected date range to generate a report.' });
        }

        // Fetch PR Activities
        const prs = await PRActivity.find({
            company,
            date: { $gte: new Date(from), $lte: new Date(to) }
        });

        // Assemble combined text representation of data for AI
        const dataDetails = {
            logs: logs.map(l => ({
                date: l.date,
                task: l.task,
                workDone: l.workDone,
                blockers: l.blockers,
                learnings: l.learnings,
                systemsModules: l.systemsModules,
                technologiesUsed: l.technologiesUsed,
                ownershipLevel: l.ownershipLevel,
                complexity: l.complexity,
                engineeringImpact: l.engineeringImpact,
                testing: l.testing
            })),
            prActivities: prs.map(p => ({
                date: p.date,
                type: p.type,
                title: p.title,
                ticketId: p.ticketId,
                prNumber: p.prNumber,
                status: p.status
            }))
        };

        const prompt = prompts.PPO_REVIEW_PROMPT.replace('{{DATA}}', JSON.stringify(dataDetails, null, 2));

        const aiResult = await aiService.generateCustomReport(prompt, {
            companyId: company,
            taskType: 'complex',
            preferredProvider: 'gemini'
        });
        const content = aiResult.content;
        const metadata = await extractMetadata(logs, company, from, to);

        // Save report as a Summary
        const newSummary = new Summary({
            company,
            type: 'ppo-review',
            startDate: new Date(from),
            endDate: new Date(to),
            content,
            metadata,
            year: new Date(from).getFullYear()
        });

        const savedSummary = await newSummary.save();
        res.status(201).json({
            ...savedSummary.toObject(),
            status: aiResult.status,
            provider: aiResult.provider,
            message: aiResult.message,
            quotaSafeguard: aiResult.quotaSafeguard
        });
    } catch (error) {
        console.error('Error generating PPO review:', error);
        if (sendQuotaResponse(res, error)) return;
        res.status(500).json({ message: error.message });
    }
};

// @desc    Generate learning & growth report
// @route   POST /api/review/learning
// @access  Public
exports.generateLearningReport = async (req, res) => {
    try {
        const { company, from, to } = req.body;

        if (!company || !from || !to) {
            return res.status(400).json({ message: 'Company ID, from, and to dates are required.' });
        }

        const logs = await WorkLog.find({
            company,
            date: { $gte: new Date(from), $lte: new Date(to) },
            status: 'Available'
        });

        if (logs.length === 0) {
            return res.status(400).json({ message: 'No work logs found in the selected date range to generate a report.' });
        }

        const logDetails = logs.map(l => ({
            date: l.date,
            task: l.task,
            learnings: l.learnings,
            reflection: l.reflection,
            blockers: l.blockers,
            systemsModules: l.systemsModules,
            technologiesUsed: l.technologiesUsed
        }));

        const prompt = prompts.LEARNING_REPORT_PROMPT.replace('{{LOGS}}', JSON.stringify(logDetails, null, 2));

        const aiResult = await aiService.generateCustomReport(prompt, {
            companyId: company,
            taskType: 'complex',
            preferredProvider: 'gemini'
        });
        const content = aiResult.content;
        const metadata = await extractMetadata(logs, company, from, to);

        const newSummary = new Summary({
            company,
            type: 'custom', // using custom or generic type for growth
            startDate: new Date(from),
            endDate: new Date(to),
            content,
            metadata,
            year: new Date(from).getFullYear()
        });

        const savedSummary = await newSummary.save();
        res.status(201).json({
            ...savedSummary.toObject(),
            status: aiResult.status,
            provider: aiResult.provider,
            message: aiResult.message,
            quotaSafeguard: aiResult.quotaSafeguard
        });
    } catch (error) {
        console.error('Error generating learning report:', error);
        if (sendQuotaResponse(res, error)) return;
        res.status(500).json({ message: error.message });
    }
};

// @desc    Generate contribution report
// @route   POST /api/review/contribution
// @access  Public
exports.generateContributionReport = async (req, res) => {
    try {
        const { company, from, to } = req.body;

        if (!company || !from || !to) {
            return res.status(400).json({ message: 'Company ID, from, and to dates are required.' });
        }

        const logs = await WorkLog.find({
            company,
            date: { $gte: new Date(from), $lte: new Date(to) },
            status: 'Available'
        });

        if (logs.length === 0) {
            return res.status(400).json({ message: 'No work logs found in the selected date range to generate a report.' });
        }

        const prompt = prompts.CONTRIBUTION_REPORT_PROMPT.replace('{{LOGS}}', JSON.stringify(logs, null, 2));

        const aiResult = await aiService.generateCustomReport(prompt, {
            companyId: company,
            taskType: 'complex',
            preferredProvider: 'gemini'
        });
        const content = aiResult.content;
        const metadata = await extractMetadata(logs, company, from, to);

        const newSummary = new Summary({
            company,
            type: 'contribution-report',
            startDate: new Date(from),
            endDate: new Date(to),
            content,
            metadata,
            year: new Date(from).getFullYear()
        });

        const savedSummary = await newSummary.save();
        res.status(201).json({
            ...savedSummary.toObject(),
            status: aiResult.status,
            provider: aiResult.provider,
            message: aiResult.message,
            quotaSafeguard: aiResult.quotaSafeguard
        });
    } catch (error) {
        console.error('Error generating contribution report:', error);
        if (sendQuotaResponse(res, error)) return;
        res.status(500).json({ message: error.message });
    }
};

// @desc    Generate sprint summary report
// @route   POST /api/review/sprint
// @access  Public
exports.generateSprintSummary = async (req, res) => {
    try {
        const { company, sprint, from, to } = req.body;

        if (!company || !sprint) {
            return res.status(400).json({ message: 'Company ID and sprint name/number are required.' });
        }

        // We can query by sprint or by dates. If from/to are not provided, we query by sprint field
        const query = { company };
        if (sprint) {
            query.$or = [
                { sprint: sprint },
                { sprint: { $regex: sprint, $options: 'i' } }
            ];
        }
        if (from && to) {
            query.date = { $gte: new Date(from), $lte: new Date(to) };
        }

        const logs = await WorkLog.find({ ...query, status: 'Available' });

        if (logs.length === 0) {
            return res.status(400).json({ message: `No work logs found for ${sprint} to generate a report.` });
        }

        const prs = await PRActivity.find({
            company,
            sprint: { $regex: sprint, $options: 'i' }
        });

        const sprintDetails = {
            sprint,
            logs: logs.map(l => ({
                date: l.date,
                task: l.task,
                workDone: l.workDone,
                systemsModules: l.systemsModules,
                technologiesUsed: l.technologiesUsed,
                prNumber: l.prNumber,
                jiraTicket: l.jiraTicket,
                workStatus: l.workStatus,
                engineeringImpact: l.engineeringImpact
            })),
            prActivities: prs.map(p => ({
                type: p.type,
                title: p.title,
                ticketId: p.ticketId,
                prNumber: p.prNumber,
                status: p.status
            }))
        };

        const prompt = prompts.SPRINT_SUMMARY_PROMPT.replace('{{LOGS}}', JSON.stringify(sprintDetails, null, 2));

        const aiResult = await aiService.generateCustomReport(prompt, {
            companyId: company,
            taskType: 'complex',
            preferredProvider: 'gemini'
        });
        const content = aiResult.content;
        const metadata = await extractMetadata(logs, company, from || new Date(), to || new Date());

        const newSummary = new Summary({
            company,
            type: 'sprint',
            startDate: from ? new Date(from) : logs[logs.length - 1].date,
            endDate: to ? new Date(to) : logs[0].date,
            content,
            metadata,
            year: new Date().getFullYear()
        });

        const savedSummary = await newSummary.save();
        res.status(201).json({
            ...savedSummary.toObject(),
            status: aiResult.status,
            provider: aiResult.provider,
            message: aiResult.message,
            quotaSafeguard: aiResult.quotaSafeguard
        });
    } catch (error) {
        console.error('Error generating sprint summary:', error);
        if (sendQuotaResponse(res, error)) return;
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all manager reviews (saved summaries of review types)
// @route   GET /api/review
// @access  Public
exports.getSavedReviews = async (req, res) => {
    try {
        const { company, type } = req.query;
        if (!company) {
            return res.status(400).json({ message: 'Company ID is required.' });
        }

        const query = {
            company,
            type: { $in: ['sprint', 'ppo-review', 'contribution-report', 'custom'] }
        };

        if (type) {
            query.type = type;
        }

        const reviews = await Summary.find(query).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
