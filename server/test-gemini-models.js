const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        console.log('Fetching available Gemini models...\n');
        
        // Try to list models
        const models = await genAI.listModels();
        
        console.log('Available models:');
        for await (const model of models) {
            console.log(`- ${model.name}`);
            console.log(`  Display Name: ${model.displayName}`);
            console.log(`  Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
            console.log('');
        }
    } catch (error) {
        console.error('Error listing models:', error.message);
        
        // If listing fails, try common model names
        console.log('\nTrying common model names...\n');
        const commonModels = [
            'gemini-pro',
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'gemini-1.0-pro'
        ];
        
        for (const modelName of commonModels) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent('Hello');
                console.log(`✓ ${modelName} - WORKS`);
            } catch (err) {
                console.log(`✗ ${modelName} - ${err.message.split('\n')[0]}`);
            }
        }
    }
}

listModels();
