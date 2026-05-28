const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const WorkLog = require('../models/WorkLog');
const Summary = require('../models/Summary');
const prompts = require('../utils/prompts');

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
    const logsText = JSON.stringify(workLogs, null, 2);
    const dateRangeStr = `${new Date(from).toLocaleDateString('en-GB')} - ${new Date(to).toLocaleDateString('en-GB')}`;

    if (type === 'weekly') {
        return prompts.WEEKLY_SUMMARY_PROMPT
            .replace('{{LOGS}}', logsText)
            .replace('{{DATE_RANGE}}', dateRangeStr);
    } else if (type === 'monthly') {
        return prompts.MONTHLY_SUMMARY_PROMPT
            .replace('{{LOGS}}', logsText);
    } else {
        return `
Analyze the following work logs and generate a professional backend engineering summary.
Logs: ${logsText}
Output format: Executive Summary, Key Achievements, Skills/Systems Used.
        `;
    }
}

// Generate detailed critique and improvement plan
exports.generateCritique = async (logs) => {
    try {
        const prompt = `
You are a PayPal Senior Staff Backend Engineer conducting a technical contribution review.
Analyze the following work logs from an intern.
Your goal is to provide honest, constructive architectural criticism and an actionable plan for improvement.
Focus on topics like: API performance, defensive coding, testing coverage, concurrency, database indexing, and system reliability.

Logs:
${JSON.stringify(logs, null, 2)}

Output Format (Markdown):

# Backend Self-Improvement Review

## 🛑 Architectural & Code Gaps
[Identify 2-3 technical areas of improvement. E.g., lacks robust unit testing, API payloads lack structural validation, insufficient database lock awareness, or vague description of work.]

## 💡 Practical Technical Tips
[Provide 3 highly specific tips to improve backend code quality, logging, or operational safety.]

## 🚀 Systems Engineering Challenge
[A specific technical design or implementation challenge for the next 2 days, e.g., 'write an integration test with Mockito/Sinon and hit 90% coverage for X service'.]

## ⭐ Principal Quote
[A brief, professional backend engineering advice quote regarding craftsmanship, simplicity, or operational excellence.]
`;

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
You are a PayPal Senior Staff Backend Engineer and technical mentor.
Based on the intern's recent logs, provide a brief, actionable "Backend Technical Tip".
Keep it friendly, highly technical (mention topics like caching, rate limiting, connection pooling, indexes, defensive validation), and under 60 words.

Logs:
${JSON.stringify(logs, null, 2)}

Format:
**Engineering Tip:** [Your technical tip here]
**Micro-Challenge:** [A small systems challenge for today]
`;

        try {
            return await generateWithGemini(prompt);
        } catch (geminiError) {
            console.warn('Gemini AI failed for insight, attempting fallback to Groq:', geminiError.message);
            return await generateWithGroq(prompt);
        }
    } catch (error) {
        console.error('AI Insight Error:', error);
        return "**Engineering Tip:** Build microservices defensively. Always validate API request parameters before performing database writes.\n**Micro-Challenge:** Add schema validation to your payment webhook endpoint today.";
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

exports.generateCustomReport = async (prompt) => {
    try {
        try {
            return await generateWithGemini(prompt);
        } catch (geminiError) {
            console.warn('Gemini AI failed, attempting fallback to Groq:', geminiError.message);
            return await generateWithGroq(prompt);
        }
    } catch (error) {
        console.error('AI custom report error:', error);
        throw error;
    }
};

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

