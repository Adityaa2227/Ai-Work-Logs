const WorkLog = require('../models/WorkLog');

// @desc    Get all logs with sorting and filtering
// @route   GET /api/logs
// @access  Public
exports.getLogs = async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'desc', from, to, project, search, company,
                sprint, workStatus, systemsModules, technologiesUsed, ownershipLevel, complexity } = req.query;

        // Company filter is mandatory except for maybe admin (but here strict)
        if (!company) {
            return res.status(400).json({ message: 'Company ID is required' });
        }

        const query = { company };

        // Date Range Filter
        if (from || to) {
            query.date = {};
            if (from) query.date.$gte = new Date(from);
            if (to) query.date.$lte = new Date(to);
        }

        // Project Filter
        if (project) {
            query.project = project;
        }

        // Sprint Filter
        if (sprint) {
            query.sprint = sprint;
        }

        // Work Status Filter
        if (workStatus) {
            query.workStatus = workStatus;
        }

        // Ownership Level Filter
        if (ownershipLevel) {
            query.ownershipLevel = ownershipLevel;
        }

        // Complexity Filter
        if (complexity) {
            query.complexity = complexity;
        }

        // Systems/Modules filter
        if (systemsModules) {
            query.systemsModules = { $in: Array.isArray(systemsModules) ? systemsModules : systemsModules.split(',') };
        }

        // Technologies filter
        if (technologiesUsed) {
            query.technologiesUsed = { $in: Array.isArray(technologiesUsed) ? technologiesUsed : technologiesUsed.split(',') };
        }

        // Search (Project, Task, WorkDone, TechStack, RawNotes)
        if (search) {
            query.$or = [
                { project: { $regex: search, $options: 'i' } },
                { task: { $regex: search, $options: 'i' } },
                { workDone: { $regex: search, $options: 'i' } },
                { techStack: { $regex: search, $options: 'i' } },
                { rawNotes: { $regex: search, $options: 'i' } }
            ];
        }

        const logs = await WorkLog.find(query)
            .sort({ date: sort === 'desc' ? -1 : 1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        const count = await WorkLog.countDocuments(query);

        res.json({
            logs,
            page: Number(page),
            pages: Math.ceil(count / Number(limit)),
            total: count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new log
// @route   POST /api/logs
// @access  Public
exports.createLog = async (req, res) => {
    try {
        const { company, date } = req.body;
        if (!company) {
            return res.status(400).json({ message: 'Company ID is required' });
        }
        
        // Ensure only 1 log per day per company
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        const existingLog = await WorkLog.findOne({
            company,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (existingLog) {
            return res.status(400).json({ message: 'A log for this date already exists. Please edit it instead.' });
        }

        const newLog = new WorkLog(req.body);
        const savedLog = await newLog.save();
        
        // Auto-generate weekly summary if it's Sunday
        const logDate = new Date(date);
        const dayOfWeek = logDate.getDay();
        
        if (dayOfWeek === 0) { // Sunday
            console.log('Sunday log created, triggering weekly summary generation...');
            const { autoGenerateWeeklySummary } = require('./summaryController');
            setImmediate(async () => {
                try {
                    await autoGenerateWeeklySummary(company, logDate);
                } catch (error) {
                    console.error('Error auto-generating weekly summary:', error);
                }
            });
        }
        
        // Auto-generate monthly summary if it's last day of month
        const tomorrow = new Date(logDate);
        tomorrow.setDate(logDate.getDate() + 1);
        if (tomorrow.getMonth() !== logDate.getMonth()) {
            console.log('Last day of month log created, triggering monthly summary generation...');
            const { autoGenerateMonthlySummary } = require('./summaryController');
            setImmediate(async () => {
                try {
                    await autoGenerateMonthlySummary(company, logDate);
                } catch (error) {
                    console.error('Error auto-generating monthly summary:', error);
                }
            });
        }
        
        res.status(201).json(savedLog);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a log
// @route   PUT /api/logs/:id
// @access  Public
exports.updateLog = async (req, res) => {
    try {
        const log = await WorkLog.findById(req.params.id);
        if (!log) return res.status(404).json({ message: 'Log not found' });

        Object.assign(log, req.body);
        const updatedLog = await log.save();
        res.json(updatedLog);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a log
// @route   DELETE /api/logs/:id
// @access  Public
exports.deleteLog = async (req, res) => {
    try {
        const log = await WorkLog.findById(req.params.id);
        if (!log) return res.status(404).json({ message: 'Log not found' });

        await log.deleteOne();
        res.json({ message: 'Log removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get suggestions for autocomplete (projects, tech stack)
// @route   GET /api/logs/suggestions
// @access  Public
exports.getSuggestions = async (req, res) => {
    try {
        const { company } = req.query;
        if (!company) {
            return res.status(400).json({ message: 'Company ID is required' });
        }

        // Get unique projects and tech stacks from logs with status 'Available'
        const logs = await WorkLog.find({ company, status: 'Available' });
        
        const projects = [...new Set(logs.map(log => log.project).filter(Boolean))];
        const techStacks = [...new Set(logs.flatMap(log => log.techStack || []).filter(Boolean))];

        res.json({ projects, techStacks });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get the most recent log entry
// @route   GET /api/logs/latest
// @access  Public
exports.getLatestLog = async (req, res) => {
    try {
        const { company } = req.query;
        if (!company) {
            return res.status(400).json({ message: 'Company ID is required' });
        }

        const latestLog = await WorkLog.findOne({ company, status: 'Available' })
            .sort({ date: -1 })
            .lean();

        if (!latestLog) {
            return res.json(null);
        }

        res.json(latestLog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get pending/missed log dates
// @route   GET /api/logs/pending
// @access  Public
exports.getPendingLogs = async (req, res) => {
    try {
        const { company } = req.query;
        if (!company) {
            return res.status(400).json({ message: 'Company ID is required' });
        }

        const Company = require('../models/Company');
        const companyDoc = await Company.findById(company);
        if (!companyDoc) {
             return res.status(404).json({ message: 'Company not found' });
        }

        // Find the earliest log recorded for this company
        const oldestLog = await WorkLog.findOne({ company }).sort({ date: 1 }).select('date');
        
        let startDate;
        if (oldestLog) {
            startDate = new Date(oldestLog.date);
        } else {
            // If no logs exist at all, we could just say no pending logs, or start from company creation
            startDate = new Date(companyDoc.createdAt);
        }
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        // Fetch all log dates in this range
        const logs = await WorkLog.find({
            company,
            date: { $gte: startDate, $lte: endDate }
        }).select('date');

        const loggedDates = logs.map(l => new Date(l.date).toDateString());

        let pendingDates = [];
        let currDate = new Date(startDate);

        while (currDate <= endDate) {
            if (!loggedDates.includes(currDate.toDateString())) {
                pendingDates.push(new Date(currDate));
            }
            currDate.setDate(currDate.getDate() + 1);
        }

        // Sort descending (most recent missing dates first)
        pendingDates.sort((a, b) => b - a);

        res.json(pendingDates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Structure raw messy engineering notes using Gemini AI
// @route   POST /api/logs/structure-notes
// @access  Public
exports.structureNotes = async (req, res) => {
    try {
        const { rawNotes } = req.body;
        if (!rawNotes) {
            return res.status(400).json({ message: 'Raw notes are required for AI structuring.' });
        }

        const aiService = require('../services/aiService');
        const prompts = require('../utils/prompts');

        const prompt = prompts.RAW_NOTES_STRUCTURING_PROMPT.replace('{{RAW_NOTES}}', rawNotes);
        const aiResponse = await aiService.generateCustomReport(prompt);
        
        let structuredData = null;
        try {
            let cleanText = aiResponse.trim();
            if (cleanText.startsWith('```')) {
                cleanText = cleanText.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
            }
            structuredData = JSON.parse(cleanText);
        } catch (parseError) {
            console.error('Failed to parse structured notes JSON:', aiResponse, parseError);
            return res.status(500).json({ 
                message: 'Failed to parse AI response. Please try again or fill fields manually.',
                rawAIResponse: aiResponse
            });
        }

        res.json(structuredData);
    } catch (error) {
        console.error('Error structuring notes:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get systems/modules worked on timeline over time
// @route   GET /api/logs/systems-timeline
// @access  Public
exports.getSystemsTimeline = async (req, res) => {
    try {
        const { company } = req.query;
        if (!company) {
            return res.status(400).json({ message: 'Company ID is required' });
        }

        const logs = await WorkLog.find({ 
            company, 
            status: 'Available',
            systemsModules: { $exists: true, $not: { $size: 0 } }
        }).sort({ date: -1 }).select('date sprint systemsModules task workDone technologiesUsed complexity prNumber jiraTicket');

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get ImageKit authentication parameters
// @route   GET /api/logs/imagekit-auth
// @access  Public
exports.getImageKitAuth = async (req, res) => {
    try {
        const crypto = require('crypto');
        const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

        if (!privateKey) {
            return res.status(500).json({ message: 'ImageKit private key not configured' });
        }

        const token = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
        const expire = Math.floor(Date.now() / 1000) + 1800; // 30 mins
        const signature = crypto
            .createHmac('sha1', privateKey)
            .update(token + expire)
            .digest('hex');

        res.json({
            token,
            expire,
            signature
        });
    } catch (error) {
        console.error('Error generating ImageKit authentication parameters:', error);
        res.status(500).json({ message: error.message });
    }
};


