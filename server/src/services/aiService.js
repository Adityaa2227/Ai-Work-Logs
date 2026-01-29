const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const WorkLog = require('../models/WorkLog');
const Summary = require('../models/Summary');

// Initialize AI providers
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

exports.generateSummary = async (dateRange, logs) => {
    // Default to Gemini, then Groq.
    const provider = process.env.AI_PROVIDER || 'gemini';
    
    // If no valid API key for Gemini, check Groq usage or return mock
    if (provider === 'gemini' && (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here')) {
        console.log('Using Mock AI Service (Gemini key not configured)');
        return getMockSummary(logs);
    }

    try {
        const { from, to, type } = dateRange;
        const workLogs = logs.filter(l => l.status === 'Available');
        const prompt = buildPrompt(type, from, to, workLogs);

        let content;
        
        console.log('Using Gemini AI with Groq Fallback');
        try {
            content = await generateWithGemini(prompt);
        } catch (geminiError) {
            console.warn('Gemini AI failed, attempting fallback to Groq:', geminiError.message);
            content = await generateWithGroq(prompt);
        }

        return {
            content,
            generatedAt: new Date()
        };
    } catch (error) {
        console.error('AI Service Error:', error);
        
        // Handle quota exceeded errors gracefully
        if (error.status === 429 || error.code === 'insufficient_quota') {
            return {
                content: `# AI Report Generation Unavailable\n\n**API quota exceeded.** Please check your ${process.env.AI_PROVIDER === 'gemini' ? 'Gemini' : 'Groq'} account billing and quota limits.\n\n## Summary of Logs (${logs.length} entries)\n\n${logs.map(l => `### ${new Date(l.date).toLocaleDateString()}\n**Project:** ${l.project}\n**Task:** ${l.task}\n**Status:** ${l.status}\n`).join('\n')}\n\n*To enable AI-powered reports, please add credits to your account or wait for your quota to reset.*`,
                generatedAt: new Date()
            };
        }
        
        throw new Error('Failed to generate AI summary');
    }
};

function getMockSummary(logs) {
    return {
        content: `Mock Summary for ${logs.length} logs. \n\n### Impact\n- Demonstrated progress on ${logs.map(l => l.project).join(', ')}.\n\n### Key Tasks\n${logs.map(l => '- ' + l.task).join('\n')}`,
        generatedAt: new Date()
    };
}

function buildPrompt(type, from, to, workLogs) {
    if (type === 'weekly') {
        return `
You are drafting a professional Internship Weekly Report in a specific format.
Period: ${new Date(from).toLocaleDateString('en-GB')} - ${new Date(to).toLocaleDateString('en-GB')}

Logs (JSON data):
${JSON.stringify(workLogs, null, 2)}

Generate the report EXACTLY in this format. Use the data from the logs to fill in each section:

Week (${new Date(from).getDate().toString().padStart(2,'0')}/${(new Date(from).getMonth()+1).toString().padStart(2,'0')}/${new Date(from).getFullYear().toString().substr(-2)} – ${new Date(to).getDate().toString().padStart(2,'0')}/${(new Date(to).getMonth()+1).toString().padStart(2,'0')}/${new Date(to).getFullYear().toString().substr(-2)})

Key Contribution:
[Write 2-3 sentences summarizing the main achievements and impact across all the work done this week]

Development Work:
[For each major task/project worked on, create numbered points with:
•	Brief description of what was built/implemented
•	Key features or functionality added
•	Technical decisions made
Use bullet points under each numbered item for sub-tasks]

New Tools/Concept:
•	[List new technologies, tools, libraries, or concepts learned]
•	[Include validation techniques, design patterns, or approaches]
•	[Mention specific technical skills acquired]

Challenges & Resolution:
 Challenge: [Describe a technical problem or obstacle faced]
Resolution: [Explain how it was solved]
[Repeat for 1-2 major challenges]

Feedback/Observation:
•	[Mention any feedback received or notable observations]
•	[Include collaboration details if relevant]

Plan For next Week:
[Briefly describe what's planned or expected for the coming week]

Any other:
[Optional: Add any additional notes, pending items, or relevant information]
        `;
    } else if (type === 'monthly') {
        const monthName = new Date(from).toLocaleString('default', { month: 'short' });
        const year = new Date(from).getFullYear();

        return `
You are drafting a professional Internship Monthly Report in a specific format.
Month: ${monthName} ${year}

Logs (JSON data):
${JSON.stringify(workLogs, null, 2)}

Generate the report EXACTLY in this format:

Month: ${monthName} ${year}

Project Worked On:
[List unique project names worked on during this month]

Major Contributions:
[Summarize high-level impact and key achievements across all projects]

Tech Stack:
[List all technologies, frameworks, libraries used:
•	Frontend: [list]
•	Backend: [list]
•	Tools: [list]]

Key Learnings:
•	[Consolidated list of important learnings from the month]
•	[Include technical concepts, best practices, patterns learned]
•	[Mention problem-solving approaches discovered]

Areas to Improve:
•	[Based on challenges faced, suggest 1-2 areas for improvement or skill development]

Overall Summary:
[Write 2-3 sentences summarizing the month's work, growth, and progress]
        `;
    } else {
        return `
Analyze the following work logs and generate a professional summary.
Logs: ${JSON.stringify(workLogs)}
output format: Executive Summary, Key Achievements, Skills Used.
        `;
    }
}

// Generate detailed critique and improvement plan
exports.generateCritique = async (logs) => {
    try {
        const prompt = `
You are a senior engineering manager and mentor.
Analyze the following work logs from an intern/junior developer.
Your goal is to provide honest, constructive criticism and a concrete plan for improvement.
Be direct but encouraging.

Logs:
${JSON.stringify(logs)}

Output Format (Markdown):

# Self-Improvement Review

## 🛑 Constructive Criticism
[Identify 2-3 weak points or bad habits seen in the logs. E.g., vague descriptions, lack of variety, slow progress.]

## 💡 Actionable Tips
[Provide 3 specific tips to improve quality of work or logging.]

## 🚀 Growth Challenge
[A specific technical or soft-skill challenge for the next 2 days.]

## ⭐ Motivation
[A short, powerful quote or sentence to boost morale.]
`;

        // Use centralized generator with fallback models
        try {
            return await generateWithGemini(prompt);
        } catch (geminiError) {
            console.warn('Gemini AI failed for critique, attempting fallback to Groq:', geminiError.message);
            return await generateWithGroq(prompt);
        }
    } catch (error) {
        console.error('AI Critique Error:', error);
        return "# Error\nCould not generate critique at this time.";
    }
};

// Generate daily productivity insight/coach tip
exports.generateInsight = async (logs) => {
    try {
        const prompt = `
You are a productivity coach for a software engineer.
Based on their recent work logs, provide a brief, actionable "Daily Insight" or "Productivity Tip".
Keep it friendly, motivating, and under 50 words.

Logs:
${JSON.stringify(logs)}

Format:
**Tip:** [Your tip here]
**Challenge:** [A small challenge for today]
`;

        // Use centralized generator with fallback models
        try {
            return await generateWithGemini(prompt);
        } catch (geminiError) {
            console.warn('Gemini AI failed for insight, attempting fallback to Groq:', geminiError.message);
            return await generateWithGroq(prompt);
        }
    } catch (error) {
        console.error('AI Insight Error:', error);
        return "**Tip:** consistency is key! Log your work daily to see progress.";
    }
};

async function generateWithGemini(prompt) {
    // Use latest Gemini models - 2.5 Flash is fastest and most cost-effective
    const modelNames = [
        'gemini-1.5-flash-latest', // Explicit latest
        'gemini-1.5-flash',        // Standard alias
        'gemini-1.5-pro-latest',   // Explicit pro latest
        'gemini-1.5-pro',          // Standard pro
        'gemini-pro',              // Legacy
        'gemini-2.0-flash-exp',    // Experimental (Likely 429 if free tier)
    ];
    
    let lastError = null;
    let quotaExceeded = false;

    for (const modelName of modelNames) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            console.log(`Successfully used model: ${modelName}`);
            return response.text();
        } catch (error) {
            console.log(`Model ${modelName} failed: ${error.message.split('\n')[0]}`);
            lastError = error;
            if (error.message.includes('429') || error.status === 429) {
                quotaExceeded = true;
            }
        }
    }
    
    if (quotaExceeded) {
        throw new Error('AI Quota Exceeded. Please try again later.');
    }

    throw new Error('All AI models failed. Please check backend logs.');
}

async function generateWithGroq(prompt) {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('Groq API key not configured');
    }

    const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
    });

    try {
        console.log('Using Groq AI...');
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a helpful internship supervisor assistant.' },
                { role: 'user', content: prompt }
            ],
            // Using Llama 3.3 70B Versatile for best summarization performance
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 2048,
        });

        return completion.choices[0]?.message?.content || '';
    } catch (error) {
        console.error('Groq AI Error:', error);
        throw error;
    }
}

