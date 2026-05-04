const { GoogleGenerativeAI } = require('@google/generative-ai');

class CrashCueAI {
  constructor() {
    this.apiKey = process.env.GOOGLE_AI_API_KEY;
    this.model = process.env.GOOGLE_AI_MODEL || 'gemini-1.5-flash';
    this.maxTokens = parseInt(process.env.GOOGLE_AI_MAX_TOKENS) || 2000;
    this.temperature = parseFloat(process.env.GOOGLE_AI_TEMPERATURE) || 0.7;
    
    // Initialize Google AI if API key is available
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.geminiModel = this.genAI.getGenerativeModel({ 
        model: this.model,
        generationConfig: {
          maxOutputTokens: this.maxTokens,
          temperature: this.temperature,
        }
      });
    }
    
    // Categories for local AI fallback
    this.categories = [
      'driving_safety',
      'vehicle_maintenance', 
      'weather_driving',
      'emergency_procedures',
      'traffic_laws',
      'fuel_efficiency',
      'navigation',
      'general_advice'
    ];
    
    // Training data for local AI
    this.trainingData = [];
  }

  async generateResponse(message, context = {}) {
    try {
      // Try Google AI first if available
      if (this.isGoogleAIConfigured()) {
        console.log('🤖 Using Google AI (Gemini) for response generation');
        return await this.generateWithGoogleAI(message, context);
      }
      
      // Fallback to local AI
      console.log('🔄 Using local AI fallback');
      return this.generateLocalResponse(message, context);
      
    } catch (error) {
      console.error('AI Response Error:', error);
      // Fallback to local AI on error
      return this.generateLocalResponse(message, context);
    }
  }

  async generateWithGoogleAI(message, context = {}) {
    try {
      const prompt = this.buildPrompt(message, context);
      
      const result = await this.geminiModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return text;
    } catch (error) {
      console.error('Google AI Error:', error);
      throw new Error('Failed to generate response with Google AI');
    }
  }

  buildPrompt(message, context) {
    const systemPrompt = `You are CrashCue AI, an advanced driving safety assistant. You help users with:

- Driving safety tips and best practices
- Vehicle maintenance and care
- Weather-related driving advice
- Emergency procedures and what to do in accidents
- Traffic laws and regulations
- Fuel efficiency tips
- Navigation and route planning
- General automotive and driving advice

Be helpful, accurate, and safety-focused. Provide practical, actionable advice.
Always prioritize safety over convenience.

Context: ${JSON.stringify(context)}`;

    return `${systemPrompt}

User Message: ${message}

Please provide a helpful, safety-focused response:`;
  }

  generateLocalResponse(message, context = {}) {
    // Simple local AI fallback responses
    const responses = {
      'driving_safety': [
        "Always maintain a safe following distance of at least 3 seconds behind the vehicle in front of you.",
        "Check your mirrors every 5-8 seconds and before changing lanes or turning.",
        "Never drive under the influence of alcohol, drugs, or when you're too tired.",
        "Always wear your seatbelt and ensure all passengers do the same.",
        "Keep both hands on the wheel at the 9 and 3 o'clock positions for maximum control."
      ],
      'vehicle_maintenance': [
        "Check your tire pressure monthly and before long trips.",
        "Change your oil every 3,000-5,000 miles or as recommended by your manufacturer.",
        "Inspect your brakes regularly and listen for any unusual sounds.",
        "Keep your windshield clean and replace wiper blades when they start streaking.",
        "Check all lights regularly to ensure they're working properly."
      ],
      'weather_driving': [
        "In rain, reduce your speed and increase following distance.",
        "In snow or ice, drive slowly and avoid sudden movements.",
        "Use your headlights in fog, rain, or other low-visibility conditions.",
        "If you start to skid, steer in the direction you want to go and avoid slamming the brakes.",
        "Consider postponing non-essential trips during severe weather."
      ],
      'emergency_procedures': [
        "If you're in an accident, first check for injuries and call 911 if needed.",
        "Move your vehicle to a safe location if possible and turn on hazard lights.",
        "Exchange information with other drivers and take photos of the scene.",
        "If your car breaks down, pull over safely and turn on hazard lights.",
        "Keep an emergency kit in your car with first aid supplies, water, and a flashlight."
      ],
      'traffic_laws': [
        "Always obey speed limits and traffic signals.",
        "Come to a complete stop at stop signs and red lights.",
        "Use turn signals at least 100 feet before turning or changing lanes.",
        "Yield to pedestrians in crosswalks and school zones.",
        "Don't text or use handheld devices while driving."
      ],
      'fuel_efficiency': [
        "Drive at steady speeds and avoid rapid acceleration and braking.",
        "Keep your tires properly inflated for better fuel economy.",
        "Remove excess weight from your vehicle when possible.",
        "Use cruise control on highways to maintain consistent speed.",
        "Combine errands into one trip to reduce cold starts."
      ],
      'navigation': [
        "Plan your route before starting your journey.",
        "Use GPS navigation but don't rely on it completely - stay aware of your surroundings.",
        "Have a backup plan in case of road closures or detours.",
        "Check traffic conditions before leaving.",
        "Keep a physical map as a backup to electronic navigation."
      ],
      'general_advice': [
        "Always be alert and focused while driving - avoid distractions.",
        "Regular maintenance helps prevent breakdowns and keeps you safe.",
        "Drive defensively and anticipate what other drivers might do.",
        "Take breaks every 2 hours on long trips to stay alert.",
        "Keep your vehicle registration and insurance documents easily accessible."
      ]
    };

    const category = this.predictCategory(message).category;
    const categoryResponses = responses[category] || responses['general_advice'];
    const randomResponse = categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
    
    return randomResponse;
  }

  predictCategory(message) {
    const lowerMessage = message.toLowerCase();
    
    // Simple keyword-based categorization
    const categoryKeywords = {
      'driving_safety': ['safe', 'safety', 'accident', 'crash', 'danger', 'hazard', 'careful', 'alert'],
      'vehicle_maintenance': ['maintenance', 'repair', 'oil', 'tire', 'brake', 'engine', 'service', 'check'],
      'weather_driving': ['rain', 'snow', 'ice', 'fog', 'storm', 'weather', 'wet', 'slippery'],
      'emergency_procedures': ['emergency', 'accident', 'breakdown', 'help', 'urgent', 'crash', 'injury'],
      'traffic_laws': ['law', 'legal', 'ticket', 'fine', 'violation', 'rule', 'regulation', 'police'],
      'fuel_efficiency': ['fuel', 'gas', 'mileage', 'efficient', 'economy', 'mpg', 'consumption'],
      'navigation': ['route', 'directions', 'gps', 'map', 'navigate', 'lost', 'way', 'path'],
      'general_advice': ['help', 'advice', 'question', 'how', 'what', 'why', 'when', 'where']
    };

    let bestCategory = 'general_advice';
    let maxMatches = 0;

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const matches = keywords.filter(keyword => lowerMessage.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = category;
      }
    }

    const confidence = Math.min(0.9, 0.3 + (maxMatches * 0.1));

    return {
      category: bestCategory,
      confidence: confidence
    };
  }

  async trainWithData(message, category) {
    // Simple training data storage
    this.trainingData.push({
      message: message,
      category: category,
      timestamp: new Date()
    });

    // Keep only last 1000 training examples
    if (this.trainingData.length > 1000) {
      this.trainingData = this.trainingData.slice(-1000);
    }
  }

  isGoogleAIConfigured() {
    return !!(this.apiKey && this.genAI && this.geminiModel);
  }

  async testConnection() {
    try {
      if (this.isGoogleAIConfigured()) {
        const response = await this.generateWithGoogleAI('Hello, test message');
        return { success: true, response, provider: 'Google AI' };
      } else {
        const response = this.generateLocalResponse('Hello, test message');
        return { success: true, response, provider: 'Local AI' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getModelInfo() {
    return {
      provider: this.isGoogleAIConfigured() ? 'Google AI' : 'Local AI',
      model: this.isGoogleAIConfigured() ? this.model : 'Local Fallback',
      configured: this.isGoogleAIConfigured(),
      categories: this.categories
    };
  }
}

module.exports = { CrashCueAI };