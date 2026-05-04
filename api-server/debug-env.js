// Debug environment variables
require('dotenv').config({ path: './env.local' });

console.log('Environment variables:');
console.log('GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? 'SET' : 'NOT SET');
console.log('GOOGLE_AI_MODEL:', process.env.GOOGLE_AI_MODEL);
console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'SET' : 'NOT SET');

// Test Google AI initialization
const { GoogleGenerativeAI } = require('@google/generative-ai');

if (process.env.GOOGLE_AI_API_KEY) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.GOOGLE_AI_MODEL || 'gemini-1.5-flash' });
    console.log('✅ Google AI initialized successfully');
    
    // Test a simple generation
    model.generateContent('Hello, this is a test').then(result => {
      console.log('✅ Google AI test response:', result.response.text());
    }).catch(error => {
      console.error('❌ Google AI test failed:', error.message);
    });
  } catch (error) {
    console.error('❌ Google AI initialization failed:', error.message);
  }
} else {
  console.log('❌ Google AI API key not found');
}
