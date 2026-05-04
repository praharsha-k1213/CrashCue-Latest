const OpenAI = require('openai');

class OpenRouterService {
  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({
        baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
        apiKey: apiKey
      });
    } else {
      console.warn('⚠️ OpenRouter API Key missing. OpenAI client not initialized.');
      this.client = null;
    }
  }

  async generateResponse(userMessage, context = {}) {
    if (!this.client) {
      throw new Error('OpenRouter client is not configured (missing API key).');
    }

    try {
      console.log('🤖 Using OpenRouter API (Gemini 2.0) for response generation');

      const completion = await this.client.chat.completions.create({
        model: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free',
        messages: [
          {
            role: 'system',
            content: `You are an advanced AI assistant for CrashCue, a driving safety app. 
            You can help with driving advice, technology, entertainment, lifestyle, health, 
            business, travel, and any other topics. Be helpful, accurate, and engaging.
            
            Context: ${JSON.stringify(context)}`
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: parseInt(process.env.OPENROUTER_MAX_TOKENS) || 2000,
        temperature: parseFloat(process.env.OPENROUTER_TEMPERATURE) || 0.7,
        extra_headers: {
          "HTTP-Referer": process.env.SITE_URL || "https://crashcue.app",
          "X-Title": process.env.SITE_NAME || "CrashCue"
        }
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter API Error:', error);
      throw new Error('Failed to get OpenRouter response');
    }
  }

  isConfigured() {
    return !!this.client;
  }

  async testConnection() {
    try {
      const response = await this.generateResponse('Hello, test message');
      return { success: true, response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getModelInfo() {
    return {
      provider: 'OpenRouter',
      model: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free',
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
    };
  }
}

module.exports = OpenRouterService;