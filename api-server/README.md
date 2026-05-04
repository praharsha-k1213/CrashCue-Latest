# CrashCue+ AI API Server

A comprehensive AI-powered API server for the CrashCue+ driving safety application. This server provides intelligent responses, training capabilities, and conversation management for driving-related queries.

## 🚀 Features

- **Intelligent AI Responses**: Context-aware AI that provides driving safety advice
- **Neural Network Training**: Self-learning AI that improves with each interaction
- **Conversation Management**: Track and analyze user conversations
- **Real-time Statistics**: Monitor AI performance and usage metrics
- **Authentication**: Secure API access with JWT tokens
- **Database Storage**: SQLite database for persistent data storage
- **RESTful API**: Clean, well-documented API endpoints

## 📋 Prerequisites

- Node.js 16+ 
- npm or yarn
- SQLite3

## 🛠️ Installation

1. **Clone and navigate to the API server directory:**
   ```bash
   cd api-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server:**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |
| `JWT_SECRET` | JWT secret key | crashcue-secret-key |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:8081 |
| `DB_PATH` | Database file path | ./data/crashcue.db |

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify` - Verify token

### AI Chat
- `POST /api/ai/chat` - Get AI response
- `POST /api/ai/predict` - Predict category only
- `GET /api/ai/categories` - Get available categories

### Training
- `POST /api/training/data` - Add training data
- `GET /api/training/data` - Get training data
- `POST /api/training/retrain` - Retrain AI model
- `POST /api/training/batch` - Add multiple training data points
- `DELETE /api/training/data/:id` - Delete training data
- `GET /api/training/stats` - Get training statistics

### Conversations
- `GET /api/conversations` - Get user conversations
- `POST /api/conversations/feedback` - Submit feedback

### Statistics
- `GET /api/stats/overview` - Get overall statistics
- `GET /api/stats/performance` - Get AI performance metrics
- `POST /api/stats/update` - Update AI statistics

## 🧠 AI Categories

The AI is trained on 8 main categories:

1. **Driving Safety** - Safe driving practices and techniques
2. **Vehicle Maintenance** - Car maintenance and upkeep advice
3. **Weather Driving** - Driving in various weather conditions
4. **Emergency Procedures** - What to do in emergency situations
5. **Traffic Laws** - Traffic rules and regulations
6. **Fuel Efficiency** - Tips for better fuel economy
7. **Navigation** - Route planning and navigation help
8. **General Advice** - General driving and vehicle advice

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevent API abuse with rate limiting
- **CORS Protection**: Configured CORS for frontend access
- **Input Validation**: Comprehensive input validation
- **Error Handling**: Secure error handling without data leakage
- **Helmet Security**: Security headers with Helmet.js

## 📊 Database Schema

### Tables
- `users` - User accounts and authentication
- `training_data` - AI training data points
- `conversations` - User conversations with AI
- `ai_stats` - AI performance statistics
- `feedback` - User feedback on AI responses

## 🚀 Usage Examples

### Get AI Response
```bash
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What should I do if my car starts skidding on ice?",
    "context": {
      "weather": {"temperature": -5, "condition": "icy"},
      "speed": 45
    }
  }'
```

### Add Training Data
```bash
curl -X POST http://localhost:3001/api/training/data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "input": "How often should I change my oil?",
    "output": "Change your oil every 3,000-5,000 miles",
    "category": "vehicle_maintenance",
    "confidence": 0.95
  }'
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

## 📈 Monitoring

The API includes comprehensive logging and monitoring:

- **Request Logging**: All API requests are logged
- **Error Logging**: Detailed error logs with stack traces
- **Performance Metrics**: Response times and processing metrics
- **AI Statistics**: Training data and conversation analytics

## 🔄 Development

### Running in Development Mode
```bash
npm run dev
```

### Database Management
The database is automatically created and initialized on first run. Tables are created with proper indexes and foreign key constraints.

### Adding New AI Categories
1. Update the knowledge base in `services/ai-service.js`
2. Add category to the categories array
3. Update the neural network output layer size if needed

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For support and questions, please contact the CrashCue+ development team.










