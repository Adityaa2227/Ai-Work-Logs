const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const Company = require('../models/Company');
const prompts = require('../utils/prompts');

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const QUEUED_MESSAGE = 'AI limits are protecting your workspace right now. Your request was safely logged and can be retried after the provider quota resets.';

class AIQuotaSafeguardError extends Error {
    constructor(message, statusCode = 202, details = {}) {
        super(message);
        this.name = 'AIQuotaSafeguardError';
        this.statusCode = statusCode;
        this.payload = {
            status: 'queued',
            content: details.content || message,
            message,
            provider: details.provider || 'none',
            quotaSafeguard: true,
            errors: details.errors || []
        };
    }
}

const isGeminiConfigured = () => Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here' &&
    genAI
);

const isGroqConfigured = () => Boolean(process.env.GROQ_API_KEY);

const getErrorMessage = (error) => error?.message || error?.error?.message || String(error);

const isQuotaError = (error) => {
    const message = getErrorMessage(error).toLowerCase();
    return (
        error?.status === 429 ||
        error?.code === 429 ||
        error?.code === 'insufficient_quota' ||
        message.includes('429') ||
        message.includes('quota') ||
        message.includes('rate limit') ||
        message.includes('resource_exhausted')
    );
};

const incrementAiCalls = async (companyId) => {
    if (!companyId) return;
    try {
        await Company.findByIdAndUpdate(companyId, { $inc: { aiCalls: 1 } });
    } catch (error) {
        console.warn('Failed to increment company AI call counter:', error.message);
    }
};

const buildProviderOrder = ({ taskType = 'complex', preferredProvider }) => {
    if (preferredProvider === 'gemini') return ['gemini', 'groq'];
    if (preferredProvider === 'groq') return ['groq', 'gemini'];
    return taskType === 'simple' ? ['groq', 'gemini'] : ['gemini', 'groq'];
};

async function runAI({ prompt, companyId, taskType = 'complex', preferredProvider }) {
    const providers = buildProviderOrder({ taskType, preferredProvider });
    const errors = [];

    for (let index = 0; index < providers.length; index++) {
        const provider = providers[index];
        try {
            const content = provider === 'gemini'
                ? await generateWithGemini(prompt)
                : await generateWithGroq(prompt);

            if (!content || !content.trim()) {
                throw new Error(`${provider} returned an empty response`);
            }

            await incrementAiCalls(companyId);

            const usedFallback = index > 0;
            return {
                status: usedFallback ? 'fallback' : 'ok',
                content,
                message: usedFallback
                    ? `Primary AI provider was unavailable, so ${provider} completed the request.`
                    : 'AI request completed successfully.',
                provider,
                quotaSafeguard: usedFallback
            };
        } catch (error) {
            const message = getErrorMessage(error);
            console.warn(`${provider} AI failed:`, message.split('\n')[0]);
            errors.push({ provider, message, quota: isQuotaError(error) });
        }
    }

    const allQuotaFailures = errors.length > 0 && errors.every(error => error.quota);
    const statusCode = allQuotaFailures ? 429 : 202;
    throw new AIQuotaSafeguardError(QUEUED_MESSAGE, statusCode, { errors });
}

exports.runAI = runAI;
exports.AIQuotaSafeguardError = AIQuotaSafeguardError;

exports.toQuotaResponse = (error) => {
    if (error instanceof AIQuotaSafeguardError || error?.quotaSafeguard || error?.payload?.quotaSafeguard) {
        return {
            statusCode: error.statusCode || 202,
            payload: error.payload || {
                status: 'queued',
                content: error.message || QUEUED_MESSAGE,
                message: error.message || QUEUED_MESSAGE,
                provider: 'none',
                quotaSafeguard: true
            }
        };
    }
    return null;
};

exports.generateSummary = async (dateRange, logs, companyId) => {
    const { from, to, type } = dateRange;
    const workLogs = logs.filter(l => l.status === 'Available');
    const prompt = buildPrompt(type, from, to, workLogs);

    try {
        const result = await runAI({ prompt, companyId, taskType: 'complex', preferredProvider: 'gemini' });
        return {
            ...result,
            generatedAt: new Date()
        };
    } catch (error) {
        const quotaResponse = exports.toQuotaResponse(error);
        if (quotaResponse) {
            return {
                ...quotaResponse.payload,
                content: buildQueuedSummary(logs),
                generatedAt: new Date()
            };
        }
        throw error;
    }
};

function buildQueuedSummary(logs) {
    return `# AI Report Queued\n\n${QUEUED_MESSAGE}\n\n## Logged Work (${logs.length} entries)\n\n${logs.map(l => `### ${new Date(l.date).toLocaleDateString()}\n**Project:** ${l.project}\n**Task:** ${l.task}\n**Status:** ${l.status}\n`).join('\n')}`;
}

function buildPrompt(type, from, to, workLogs) {
    const logsText = JSON.stringify(workLogs, null, 2);
    const dateRangeStr = `${new Date(from).toLocaleDateString('en-GB')} - ${new Date(to).toLocaleDateString('en-GB')}`;

    if (type === 'weekly') {
        return prompts.WEEKLY_SUMMARY_PROMPT
            .replace('{{LOGS}}', logsText)
            .replace('{{DATE_RANGE}}', dateRangeStr);
    }

    if (type === 'monthly') {
        return prompts.MONTHLY_SUMMARY_PROMPT.replace('{{LOGS}}', logsText);
    }

    return `
Analyze the following work logs and generate a professional backend engineering summary.
Logs: ${logsText}
Output format: Executive Summary, Key Achievements, Skills/Systems Used.
    `;
}

exports.generateCritique = async (logs, companyId) => {
    const prompt = `
You are a PayPal Senior Staff Backend Engineer conducting a technical contribution review.
Analyze the following work logs from an intern.
Your goal is to provide honest, constructive architectural criticism and an actionable plan for improvement.
Focus on topics like: API performance, defensive coding, testing coverage, concurrency, database indexing, and system reliability.

Logs:
${JSON.stringify(logs, null, 2)}

Output Format (Markdown):

# Backend Self-Improvement Review

## Architectural & Code Gaps
[Identify 2-3 technical areas of improvement. E.g., lacks robust unit testing, API payloads lack structural validation, insufficient database lock awareness, or vague description of work.]

## Practical Technical Tips
[Provide 3 highly specific tips to improve backend code quality, logging, or operational safety.]

## Systems Engineering Challenge
[A specific technical design or implementation challenge for the next 2 days, e.g., 'write an integration test with Mockito/Sinon and hit 90% coverage for X service'.]

## Principal Quote
[A brief, professional backend engineering advice quote regarding craftsmanship, simplicity, or operational excellence.]
`;

    return runAI({ prompt, companyId, taskType: 'complex', preferredProvider: 'gemini' });
};

exports.generateInsight = async (logs, companyId) => {
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

    return runAI({ prompt, companyId, taskType: 'simple', preferredProvider: 'groq' });
};

exports.generateCustomReport = async (prompt, options = {}) => {
    return runAI({
        prompt,
        companyId: options.companyId,
        taskType: options.taskType || 'complex',
        preferredProvider: options.preferredProvider
    });
};

async function generateWithGemini(prompt) {
    if (!isGeminiConfigured()) {
        throw new Error('Gemini API key not configured');
    }

    const modelNames = [
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash',
        'gemini-1.5-pro-latest',
        'gemini-1.5-pro',
        'gemini-pro',
        'gemini-2.0-flash-exp'
    ];

    let lastError = null;
    let quotaExceeded = false;

    for (const modelName of modelNames) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            console.log(`Successfully used Gemini model: ${modelName}`);
            return response.text();
        } catch (error) {
            lastError = error;
            if (isQuotaError(error)) quotaExceeded = true;
        }
    }

    if (quotaExceeded) {
        const quotaError = new Error('Gemini quota exceeded');
        quotaError.status = 429;
        throw quotaError;
    }

    throw lastError || new Error('All Gemini models failed');
}

async function generateWithGroq(prompt) {
    if (!isGroqConfigured()) {
        throw new Error('Groq API key not configured');
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a helpful internship supervisor assistant.' },
                { role: 'user', content: prompt }
            ],
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 2048
        });

        return completion.choices[0]?.message?.content || '';
    } catch (error) {
        throw error;
    }
}
