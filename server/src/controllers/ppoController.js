const PPOChat = require('../models/PPOChat');
const WorkLog = require('../models/WorkLog');
const aiService = require('../services/aiService');

// Get chat history for the company
exports.getHistory = async (req, res) => {
    try {
        const { company } = req.query;
        if (!company) return res.status(400).json({ message: 'Company required' });

        const history = await PPOChat.find({ company }).sort({ timestamp: 1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Send a message or trigger daily review
exports.sendMessage = async (req, res) => {
    try {
        const { company, message } = req.body;
        if (!company) return res.status(400).json({ message: 'Company required' });

        // Save user message if provided
        if (message) {
            await PPOChat.create({ company, role: 'user', content: message });
        }

        // Fetch recent chat history (last 10 messages to save tokens)
        const history = await PPOChat.find({ company }).sort({ timestamp: -1 }).limit(10);
        history.reverse();

        // Fetch recent work logs (last 3 days)
        const logs = await WorkLog.find({
            company,
            date: { $gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
        }).sort({ date: -1 }).limit(15);

        // Format history for prompt
        const historyContext = history.map(h => `${h.role === 'user' ? 'Intern' : 'Coach'}: ${h.content}`).join('\n');
        
        // Build the Prompt
        const prompt = `
You are a Staff Software Engineer mentoring an intern who wants a Pre-Placement Offer (PPO).
You act as their tough but fair Daily PPO Coach.

Here are the intern's recent work logs:
${JSON.stringify(logs, null, 2)}

Here is the recent conversation history with you (the Coach):
${historyContext}

Your goal:
1. Analyze their latest logs and the conversation.
2. Point out what they are doing right and what they are doing WRONG.
3. If they improved based on your previous advice, acknowledge it!
4. Tell them what EXTRA they need to do today/tomorrow to impress leadership and secure that PPO.
5. If the intern asked a question in the latest message, answer it directly.
6. Keep it conversational, actionable, and under 200 words to save tokens.
        `;

        const aiResponse = await aiService.generateCustomReport(prompt);

        // Save AI response
        const aiMessage = await PPOChat.create({ company, role: 'ai', content: aiResponse });

        res.json(aiMessage);
    } catch (error) {
        console.error('PPO Coach Error:', error);
        
        const { company } = req.body;
        // If quota exceeded, save a system message so user knows their update is safe
        if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('Limit')) {
            const aiMessage = await PPOChat.create({ 
                company, 
                role: 'ai', 
                content: "⚠️ I've hit my daily API limit! Don't worry, I've safely logged your updates. I'll review them and give you a comprehensive PPO evaluation tomorrow when my limit resets. Keep up the great work!" 
            });
            return res.json(aiMessage);
        }

        res.status(500).json({ message: error.message });
    }
};
