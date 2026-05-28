const PRActivity = require('../models/PRActivity');
const WorkLog = require('../models/WorkLog');
const mongoose = require('mongoose');

// @desc    Get all PR/Jira activities
// @route   GET /api/pr
// @access  Public
exports.getPRActivities = async (req, res) => {
    try {
        const { company, type, status, sprint, from, to, page = 1, limit = 20, search } = req.query;

        if (!company) {
            return res.status(400).json({ message: 'Company ID is required' });
        }

        const query = { company };

        if (type) query.type = type;
        if (status) query.status = status;
        if (sprint) query.sprint = sprint;

        if (from || to) {
            query.date = {};
            if (from) query.date.$gte = new Date(from);
            if (to) query.date.$lte = new Date(to);
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { ticketId: { $regex: search, $options: 'i' } },
                { prNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const activities = await PRActivity.find(query)
            .sort({ date: -1, createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .populate('linkedWorkLog', 'date task project');

        const count = await PRActivity.countDocuments(query);

        res.json({
            activities,
            page: Number(page),
            pages: Math.ceil(count / Number(limit)),
            total: count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new PR/Jira activity
// @route   POST /api/pr
// @access  Public
exports.createPRActivity = async (req, res) => {
    try {
        const { company, date, type, title } = req.body;

        if (!company) {
            return res.status(400).json({ message: 'Company ID is required' });
        }
        if (!type || !title) {
            return res.status(400).json({ message: 'Type and Title are required' });
        }

        const newActivity = new PRActivity(req.body);
        const savedActivity = await newActivity.save();

        res.status(201).json(savedActivity);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a PR/Jira activity
// @route   PUT /api/pr/:id
// @access  Public
exports.updatePRActivity = async (req, res) => {
    try {
        const activity = await PRActivity.findById(req.params.id);
        if (!activity) {
            return res.status(404).json({ message: 'PR/Jira activity not found' });
        }

        Object.assign(activity, req.body);
        const updatedActivity = await activity.save();

        res.json(updatedActivity);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a PR/Jira activity
// @route   DELETE /api/pr/:id
// @access  Public
exports.deletePRActivity = async (req, res) => {
    try {
        const activity = await PRActivity.findById(req.params.id);
        if (!activity) {
            return res.status(404).json({ message: 'PR/Jira activity not found' });
        }

        await activity.deleteOne();
        res.json({ message: 'PR/Jira activity removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get PR/Jira stats
// @route   GET /api/pr/stats
// @access  Public
exports.getPRStats = async (req, res) => {
    try {
        const { company } = req.query;
        if (!company) {
            return res.status(400).json({ message: 'Company ID is required' });
        }

        const matchStage = { company: new mongoose.Types.ObjectId(company) };

        const stats = await PRActivity.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    statuses: { $push: '$status' }
                }
            }
        ]);

        const formattedStats = {
            totalPRsCreated: 0,
            totalPRsReviewed: 0,
            totalPRsMerged: 0,
            totalTickets: 0,
            completedTickets: 0,
            blockedTickets: 0,
            activeBlockers: 0
        };

        stats.forEach(item => {
            if (item._id === 'pr-created') {
                formattedStats.totalPRsCreated = item.count;
                // Count merged PRs in created list
                formattedStats.totalPRsMerged = item.statuses.filter(s => s === 'merged').length;
            } else if (item._id === 'pr-reviewed') {
                formattedStats.totalPRsReviewed = item.count;
            } else if (item._id === 'pr-merged') {
                formattedStats.totalPRsMerged += item.count;
            } else if (item._id === 'jira-ticket') {
                formattedStats.totalTickets = item.count;
                formattedStats.completedTickets = item.statuses.filter(s => ['merged', 'closed', 'approved'].includes(s)).length;
                formattedStats.blockedTickets = item.statuses.filter(s => s === 'blocked').length;
            } else if (item._id === 'blocker') {
                formattedStats.activeBlockers = item.statuses.filter(s => ['open', 'blocked'].includes(s)).length;
            }
        });

        res.json(formattedStats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
