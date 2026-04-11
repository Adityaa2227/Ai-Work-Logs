const WorkLog = require('../models/WorkLog');
const mongoose = require('mongoose');

exports.getDashboardStats = async (req, res) => {
    try {
        const { company } = req.query;
        if (!company) {
            return res.status(400).json({ message: 'Company ID is required' });
        }

        const matchStage = { company: new mongoose.Types.ObjectId(company) };

        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Counts
        const totalLogs = await WorkLog.countDocuments(matchStage);
        const todayCount = await WorkLog.countDocuments({ ...matchStage, date: { $gte: startOfDay } });
        const weekCount = await WorkLog.countDocuments({ ...matchStage, date: { $gte: startOfWeek } });
        const monthCount = await WorkLog.countDocuments({ ...matchStage, date: { $gte: startOfMonth } });

        // Learnings count
        const learningsAgg = await WorkLog.aggregate([
            { $match: { ...matchStage, status: 'Available' } },
            { $project: { learningCount: { $size: { $ifNull: ['$learnings', []] } } } },
            { $group: { _id: null, total: { $sum: '$learningCount' } } }
        ]);
        const totalLearnings = learningsAgg[0]?.total || 0;

        // Calculate Streak - consecutive days with logs
        const allLogs = await WorkLog.find(matchStage).select('date').sort({ date: -1 });
        const datesLogged = new Set(allLogs.map(l => new Date(l.date).toDateString()));
        
        let streak = 0;
        for (let i = 0; i < 365; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            if (datesLogged.has(d.toDateString())) {
                streak++;
            } else {
                if (i === 0) continue;
                break;
            }
        }

        // Get unique projects
        const projects = await WorkLog.distinct('project', { ...matchStage, status: 'Available' });
        const projectCount = projects.filter(p => p && p.trim()).length;

        // Top tech stacks
        const topTechStacks = await WorkLog.aggregate([
            { $match: { ...matchStage, status: 'Available' } },
            { $unwind: '$techStack' },
            { $match: { techStack: { $ne: '', $ne: null } } },
            { $group: { _id: '$techStack', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 8 }
        ]);

        res.json({
            totalLogs,
            todayLogs: todayCount,
            weeklyLogs: weekCount,
            monthlyLogs: monthCount,
            totalLearnings,
            streak,
            projectDist: projects.filter(p => p && p.trim()).map(p => ({ name: p })),
            topTechStacks: topTechStacks.map(t => ({ name: t._id, count: t.count }))
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

exports.getChartData = async (req, res) => {
    try {
        const { range = 7, company } = req.query; // days
        if (!company) {
            return res.status(400).json({ message: 'Company ID is required' });
        }
        const matchStage = { company: new mongoose.Types.ObjectId(company) };

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - range);
        startDate.setHours(0,0,0,0);

        // 1. Daily Activity - Count logs per day
        const dailyActivity = await WorkLog.aggregate([
            { $match: { ...matchStage, date: { $gte: startDate } } },
            { 
                $group: { 
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, 
                    count: { $sum: 1 }
                } 
            },
            { $sort: { _id: 1 } }
        ]);

        // Fill missing days
        const filledDaily = [];
        for(let i=0; i<range; i++) {
             const d = new Date();
             d.setDate(d.getDate() - i);
             const dateStr = d.toISOString().split('T')[0];
             const found = dailyActivity.find(a => a._id === dateStr);
             filledDaily.push({
                 date: dateStr,
                 logs: found ? found.count : 0
             });
        }
        filledDaily.reverse();

        // 2. Project Distribution - Count logs per project
        const projectDist = await WorkLog.aggregate([
             { $match: { ...matchStage, status: 'Available' } },
             { $group: { _id: "$project", count: { $sum: 1 } } },
             { $match: { _id: { $ne: null, $ne: '' } } }
        ]);

        // 3. Tech Stack Stats - Count usage
        const techStackStats = await WorkLog.aggregate([
            { $match: { ...matchStage, status: 'Available' } },
            { $unwind: "$techStack" },
            { $group: { _id: "$techStack", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            weeklyActivity: filledDaily,
            projectDist: projectDist.map(p => ({ name: p._id, value: p.count })),
            focusStats: techStackStats.map(t => ({ name: t._id, count: t.count }))
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getHeatmapData = async (req, res) => {
    try {
        const { company } = req.query;
        if (!company) {
            return res.status(400).json({ message: 'Company ID is required' });
        }
        const matchStage = { company: new mongoose.Types.ObjectId(company) };

        // Last 84 days (12 weeks)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 84);
        startDate.setHours(0, 0, 0, 0);

        const dailyActivity = await WorkLog.aggregate([
            { $match: { ...matchStage, date: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Build full 84-day grid
        const heatmap = [];
        for (let i = 83; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const found = dailyActivity.find(a => a._id === dateStr);
            heatmap.push({
                date: dateStr,
                count: found ? found.count : 0,
                day: d.getDay() // 0=Sun, 6=Sat
            });
        }

        res.json(heatmap);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
