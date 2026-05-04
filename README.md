# CrashCue - AI-Powered Driving Assistant

CrashCue is a comprehensive React Native application built with Expo that provides real-time speed tracking, crash detection, and AI-powered driving assistance.

## Features

### 🚗 Core Functionality
- **Real-time Speed Tracking**: GPS-based speed monitoring with professional-grade accuracy
- **Crash Detection**: Advanced algorithms to detect potential accidents
- **SOS System**: Automatic emergency contact notification
- **AI Assistant**: Intelligent driving tips and weather updates

### 📊 Analytics & Storage
- **Performance Analytics**: Detailed driving statistics and insights
- **Speed History**: Comprehensive logging of all speed data
- **Storage Management**: Intelligent storage with automatic backups
- **Data Export**: Export speed logs for analysis

### 🎨 User Interface
- **Modern Design**: Clean, intuitive interface with dark/light themes
- **Real-time Updates**: Live speedometer with smooth animations
- **Responsive Layout**: Optimized for various screen sizes
- **Accessibility**: Full accessibility support

### 🔧 Technical Features
- **GPS Integration**: High-accuracy location tracking
- **Kalman Filtering**: Advanced speed smoothing algorithms
- **Data Persistence**: Robust storage with backup systems
- **Error Handling**: Comprehensive error management

## Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router
- **State Management**: React Context API
- **Storage**: AsyncStorage with backup systems
- **Location**: Expo Location API
- **UI Components**: Custom components with theming

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (for development)

### Setup
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/CrashCue.git
cd CrashCue

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Running on Device
1. Install Expo Go app on your mobile device
2. Scan the QR code from the terminal
3. The app will load on your device

## Project Structure

```
CrashCue/
├── app/                    # Main application screens
│   ├── (tabs)/            # Tab navigation screens
│   ├── performance-analytics.tsx
│   ├── emergency-contacts.tsx
│   └── ...
├── components/            # Reusable UI components
│   ├── Speedometer.tsx
│   ├── CrashCueCard.tsx
│   └── ...
├── context/              # React Context providers
│   ├── SpeedHistoryContext.tsx
│   └── ThemeContext.tsx
├── hooks/                # Custom React hooks
├── constants/            # App constants and colors
└── assets/              # Images, fonts, and other assets
```

## Key Components

### SpeedHistoryContext
Manages all speed tracking data with:
- Real-time GPS tracking
- Data persistence and backup
- Crash detection algorithms
- Storage management

### Performance Analytics
Comprehensive analytics screen featuring:
- Storage usage visualization
- Speed history charts
- Data export functionality
- Backup management

### AI Assistant
Intelligent driving assistant with:
- Weather integration
- Voice commands
- Driving tips
- Route planning

## Storage & Backup System

The app includes a robust storage system:
- **Automatic Backups**: Daily backups of speed data
- **Data Retention**: 5000 entries with 7-day backup retention
- **Export Functionality**: JSON export for external analysis
- **Recovery System**: Automatic restoration from backups

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email your-email@example.com or create an issue on GitHub.

## Acknowledgments

- Expo team for the excellent React Native framework
- React Native community for components and libraries
- Contributors and testers

---

**Note**: This app requires location permissions for GPS tracking functionality. Ensure location services are enabled on your device for optimal performance.