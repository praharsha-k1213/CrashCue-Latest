// Test GPT-4 API Integration
require('dotenv').config({ path: './api-server/env.local' });
const GPT4Service = require('./api-server/services/gpt4-service');

async function testGPT4API() {
  console.log('🚀 Testing GPT-4 API Integration');
  console.log('=' .repeat(50));
  
  const gpt4 = new GPT4Service();
  
  // Check if API key is configured
  if (!gpt4.isConfigured()) {
    console.log('❌ GPT-4 not configured. Please check your API key.');
    return;
  }
  
  console.log('✅ GPT-4 API key found');
  console.log('🔑 API Key:', process.env.OPENAI_API_KEY?.substring(0, 20) + '...');
  console.log('🤖 Model:', process.env.OPENAI_MODEL || 'gpt-4');
  
  try {
    console.log('\n🧪 Testing API connection...');
    const testResult = await gpt4.testConnection();
    
    if (testResult.success) {
      console.log('✅ GPT-4 API connection successful!');
      console.log('📝 Test response:', testResult.response);
    } else {
      console.log('❌ GPT-4 API connection failed:', testResult.error);
    }
    
    console.log('\n🚗 Testing car question...');
    const carResponse = await gpt4.generateResponse('How fast is a Lamborghini Aventador?');
    console.log('🏎️ Car response:', carResponse);
    
    console.log('\n🔬 Testing science question...');
    const scienceResponse = await gpt4.generateResponse('What is quantum computing?');
    console.log('⚛️ Science response:', scienceResponse);
    
    console.log('\n🎉 GPT-4 API Integration Test Complete!');
    
  } catch (error) {
    console.error('❌ Error testing GPT-4 API:', error.message);
  }
}

testGPT4API();





