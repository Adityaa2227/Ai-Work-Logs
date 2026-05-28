const WorkLog = require('../models/WorkLog');
const aiService = require('../services/aiService');
const prompts = require('../utils/prompts');

// Helper to clean AI JSON response
const parseAIJSON = (text) => {
    try {
        let cleanText = text.trim();
        // Remove markdown block wraps if present
        if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
        }
        return JSON.parse(cleanText);
    } catch (error) {
        console.error('Failed to parse AI JSON:', text, error);
        return null;
    }
};

// @desc    Perform regular text and keyword search across logs
// @route   GET /api/search
// @access  Public
exports.searchLogs = async (req, res) => {
    try {
        const { company, q, sprint, workStatus, ownershipLevel, complexity } = req.query;

        if (!company) {
            return res.status(400).json({ message: 'Company ID is required' });
        }

        const query = { company };

        if (q) {
            // Text search using mongoose index
            query.$text = { $search: q };
        }
        if (sprint) query.sprint = sprint;
        if (workStatus) query.workStatus = workStatus;
        if (ownershipLevel) query.ownershipLevel = ownershipLevel;
        if (complexity) query.complexity = complexity;

        const results = await WorkLog.find(query)
            .sort(q ? { score: { $meta: 'textScore' } } : { date: -1 });

        res.json({ results, queryApplied: query });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Perform AI natural language search interpreted into MongoDB filters
// @route   POST /api/search/ai
// @access  Public
exports.aiSearchLogs = async (req, res) => {
    try {
        const { company, query } = req.body;

        if (!company) {
            return res.status(400).json({ message: 'Company ID is required' });
        }
        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const currentDateStr = new Date().toLocaleDateString();
        
        // Calculate dynamic dates for last week
        const today = new Date();
        const lastWeekStart = new Date(today.setDate(today.getDate() - today.getDay() - 7));
        lastWeekStart.setHours(0,0,0,0);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        lastWeekEnd.setHours(23,59,59,999);

        // Prep prompt
        let prompt = prompts.SEARCH_QUERY_PROMPT
            .replace('{{QUERY}}', query)
            .replace('{{CURRENT_DATE}}', currentDateStr)
            .replace('{{LAST_WEEK_START}}', lastWeekStart.toISOString())
            .replace('{{LAST_WEEK_END}}', lastWeekEnd.toISOString());

        // Get AI filters
        const aiResult = await aiService.generateCustomReport(prompt, {
            companyId: company,
            taskType: 'simple',
            preferredProvider: 'groq'
        });
        const aiResponse = aiResult.content;
        const filters = parseAIJSON(aiResponse);

        if (!filters) {
            // Fallback to text search if AI fails or returns invalid JSON
            const fallbackQuery = { company, $text: { $search: query } };
            const results = await WorkLog.find(fallbackQuery).sort({ date: -1 });
            return res.json({
                results,
                queryApplied: fallbackQuery,
                interpretation: 'AI parsing failed. Performing basic keyword text search instead.',
                filtersUsed: {}
            });
        }

        // Enforce company scope
        filters.company = company;

        // Perform Mongoose query
        const results = await WorkLog.find(filters).sort({ date: -1 });

        res.json({
            results,
            queryApplied: filters,
            interpretation: `Interpreted query: "${query}"`,
            filtersUsed: filters,
            status: aiResult.status,
            provider: aiResult.provider,
            message: aiResult.message,
            quotaSafeguard: aiResult.quotaSafeguard
        });

    } catch (error) {
        console.error('AI search error:', error);
        const quotaResponse = aiService.toQuotaResponse(error);
        if (quotaResponse) {
            const fallbackQuery = { company, $text: { $search: req.body.query || '' } };
            const results = req.body.query
                ? await WorkLog.find(fallbackQuery).sort({ date: -1 })
                : [];
            return res.status(quotaResponse.statusCode).json({
                results,
                queryApplied: fallbackQuery,
                interpretation: quotaResponse.payload.message,
                filtersUsed: {},
                ...quotaResponse.payload
            });
        }
        res.status(500).json({ message: error.message });
    }
};
