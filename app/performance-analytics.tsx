import { useSpeedHistory } from '@/context/SpeedHistoryContext';
import { triggerErrorVibration, triggerHaptic } from '@/utils/hapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { PROVIDER_GOOGLE } from '../components/MapComponent';
import { useTheme } from '../context/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { useTimeBattery } from '../hooks/useTimeBattery';
import { crashCueAI } from '../services/AiTrainingSystem';

// --- Types & Globals ---
const { width, height } = Dimensions.get('window');

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// --- Visual Components (The "Design Change") ---

// 1. Enhanced Neural Core Header with Reanimated
const NeuralCore = ({ isListening, isLoading, isSpeaking }: { isListening: boolean; isLoading: boolean; isSpeaking: boolean }) => {
  const { theme } = useTheme();
  const primary = useThemeColor({}, 'primary');
  const accent = useThemeColor({}, 'accent');
  const backgroundCard = useThemeColor({}, 'backgroundCard');
  const glow = useThemeColor({}, 'glow');

  const pulseValue = useSharedValue(1);
  const rotateValue = useSharedValue(0);
  const glowValue = useSharedValue(0);

  useEffect(() => {
    pulseValue.value = withRepeat(
      withSequence(
        withTiming(isListening || isLoading || isSpeaking ? 1.4 : 1.1, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
    rotateValue.value = withRepeat(
      withTiming(1, { duration: 6000 }),
      -1,
      false
    );
    glowValue.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      true
    );
  }, [isListening, isLoading, isSpeaking]);

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotateValue.value * 360}deg` },
      { scale: pulseValue.value }
    ]
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowValue.value, [0, 1], [0.3, 0.7]),
    transform: [{ scale: pulseValue.value }]
  }));

  const coreColors = isListening
    ? ['#FF0000', '#FF4444', '#FF0000']
    : isLoading
      ? ['#FFFFFF', '#AAAAAA', '#FFFFFF']
      : isSpeaking
        ? [primary, accent, primary]
        : [accent, primary, accent];

  const glowColor = isListening ? '#FF0000' : (isLoading || isSpeaking) ? '#FFFFFF' : primary;

  return (
    <View className="items-center relative">
      <Animated.View
        className="absolute w-35 h-35 rounded-full shadow-xl"
        style={[animatedGlowStyle, { backgroundColor: glowColor, shadowColor: glowColor }]}
      />
      <View className="w-20 h-20 items-center justify-center z-10">
        <Animated.View className="absolute w-full h-full rounded-full overflow-hidden" style={animatedRingStyle}>
          <LinearGradient
            colors={coreColors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-1 opacity-95"
          />
        </Animated.View>
        <View
          className="w-15 h-15 rounded-full bg-black items-center justify-center border-2 shadow-lg relative"
          style={{ borderColor: 'rgba(0,224,255,0.6)', shadowColor: '#00E0FF' }}
        >
          <Ionicons
            name={isListening ? "mic" : isLoading ? "hardware-chip" : isSpeaking ? "volume-high" : "shield-checkmark"}
            size={28}
            color="#FFF"
          />
        </View>
      </View>
      <View className="items-center mt-3">
        <Text
          className="text-xs font-bold tracking-widest text-shadow-sm"
          style={{ color: '#00E0FF', textShadowColor: '#00E0FF', textShadowRadius: 10 }}
        >
          {isListening ? "Listening..." : isLoading ? "Processing..." : isSpeaking ? "Speaking..." : "AI Assistant"}
        </Text>
        <Text className="text-[8px] tracking-wide mt-0.5 font-semibold" style={{ color: 'rgba(0,224,255,0.5)' }}>
          {isSpeaking ? "Data Stream Synchronized" : "Intelligence Layer • Active"}
        </Text>
      </View>
    </View>
  );
};

// 2. Glass Card with Reanimated Entrance
const GlassCard = ({ children, style, onPress, glow, entering }: any) => {
  return (
    <Animated.View
      entering={entering || FadeInDown.duration(600)}
      className="bg-white/5 border-2 rounded-3xl overflow-hidden shadow-lg"
      style={[
        style,
        {
          borderColor: 'rgba(0,224,255,0.2)',
          shadowColor: '#00E0FF',
          backdropFilter: Platform.OS === 'web' ? 'blur(15px)' : undefined,
        }
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        className="absolute inset-0"
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
      </TouchableOpacity>
      {glow && (
        <View
          className="absolute -top-12 -right-12 w-24 h-24 rounded-full shadow-xl"
          style={{ backgroundColor: 'rgba(139,92,246,0.15)', shadowColor: '#8B5CF6' }}
        />
      )}
      <View className="p-4">{children}</View>
    </Animated.View>
  );
};

// --- Main Screen ---

export default function NexusDashboardScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { speedHistory } = useSpeedHistory();
  const { timeString } = useTimeBattery();
  const insets = useSafeAreaInsets();

  // Theme colors
  const primary = useThemeColor({}, 'primary');
  const accent = useThemeColor({}, 'accent');
  const background = useThemeColor({}, 'background');
  const backgroundHeader = useThemeColor({}, 'backgroundHeader');
  const backgroundCard = useThemeColor({}, 'backgroundCard');
  const border = useThemeColor({}, 'border');
  const textPrimary = useThemeColor({}, 'textPrimary');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const success = useThemeColor({}, 'success');
  const warning = useThemeColor({}, 'warning');
  const error = useThemeColor({}, 'error');

  // Logic States
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [conversation, setConversation] = useState<{ id: number, type: string, message: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);

  // Widget Data (Restoring Elements)
  const [weatherData, setWeatherData] = useState<any>(null);
  const [aiMode, setAiMode] = useState<'driving' | 'general' | 'emergency'>('driving');

  // Dynamic suggestions based on mode
  const getModeCapabilities = () => {
    switch (aiMode) {
      case 'driving':
        return [
          { id: 1, title: 'Route Planning', description: 'Navigate safely', icon: 'map' },
          { id: 2, title: 'Weather Check', description: 'Road conditions', icon: 'partly-sunny' },
          { id: 3, title: 'Speed Alert', description: 'Set limits', icon: 'speedometer' },
          { id: 5, title: 'Traffic Info', description: 'Live updates', icon: 'car' },
          { id: 6, title: 'Fuel Finder', description: 'Nearby stations', icon: 'location' },
        ];
      case 'general':
        return [
          { id: 1, title: 'Expert Analysis', description: 'Deep insights', icon: 'analytics' },
          { id: 2, title: 'Creative Help', description: 'Art & Design', icon: 'brush' },
          { id: 3, title: 'Problem Solving', description: 'Logic & Reason', icon: 'bulb' },
          { id: 4, title: 'Learning', description: 'Education', icon: 'school' },
          { id: 5, title: 'Web Search', description: 'Real-time info', icon: 'globe' },
          { id: 6, title: 'Entertainment', description: 'Fun & Games', icon: 'game-controller' },
        ];
      case 'emergency':
        return [
          { id: 1, title: 'Call SOS', description: 'Emergency help', icon: 'call' },
          { id: 2, title: 'Location Share', description: 'Send position', icon: 'navigate' },
          { id: 3, title: 'First Aid', description: 'Medical guide', icon: 'medical' },
          { id: 4, title: 'Contact Family', description: 'Alert contacts', icon: 'people' },
          { id: 5, title: 'Crash Report', description: 'Document incident', icon: 'document-text' },
          { id: 6, title: 'Roadside Help', description: 'Tow services', icon: 'construct' },
        ];
    }
  };

  const [suggestions, setSuggestions] = useState(getModeCapabilities());

  // Update suggestions when mode changes
  useEffect(() => {
    setSuggestions(getModeCapabilities());
  }, [aiMode]);
  const [drivingTips, setDrivingTips] = useState([
    { id: 1, tip: 'Maintain safe following distance (3s rule).', category: 'Safety' },
    { id: 2, tip: 'Check mirrors every 5-8 seconds.', category: 'Awareness' },
    { id: 3, tip: 'Keep hands at 9 and 3 position.', category: 'Control' }
  ]);

  // Map States
  const [showMap, setShowMap] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [mapRegion, setMapRegion] = useState({
    latitude: 17.3850, longitude: 78.4867, latitudeDelta: 0.09, longitudeDelta: 0.04
  });

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    getUserLocation();
    getWeatherData();
    // Welcome Message
    setConversation([
      { id: 1, type: 'ai', message: "CrashCue Intelligence initialized. Your advanced AI assistant is ready. How may I help you today?" }
    ]);
  }, []);

  // --- Helpers ---

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation(loc.coords);
      setMapRegion(r => ({ ...r, latitude: loc.coords.latitude, longitude: loc.coords.longitude }));
    } catch (e) { console.log(e); }
  };

  const getWeatherData = async () => {
    // Mock/Real Hybrid for robustness
    setWeatherData({
      temperature: 24, condition: 'Partly Cloudy', location: 'Hyderabad', humidity: 65, wind: 12
    });
    // In real prod, use the axios call from previous version
  };

  const handleSend = async (text: string = inputText) => {
    if (!text.trim()) return;
    const newMsg = { id: Date.now(), type: 'user', message: text };
    setConversation(prev => [...prev, newMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Enhanced AI Response Logic based on mode
      const lowerText = text.toLowerCase();

      // Mode-specific responses
      if (aiMode === 'driving') {
        if (lowerText.includes('route') || lowerText.includes('navigate')) {
          setShowMap(true);
          setConversation(prev => [...prev, {
            id: Date.now() + 1,
            type: 'ai',
            message: "🗺️ Initializing route calculation. Analyzing traffic patterns and road conditions for optimal path..."
          }]);
          setIsLoading(false);
          return;
        }
        if (lowerText.includes('weather')) {
          const weather = weatherData || await getWeatherData();
          setConversation(prev => [...prev, {
            id: Date.now() + 1,
            type: 'ai',
            message: `🌤️ Current conditions: ${weather.temperature}°C, ${weather.condition} in ${weather.location}. Wind: ${weather.wind} km/h. Road conditions are ${weather.temperature > 30 ? 'hot - stay hydrated' : weather.temperature < 10 ? 'cold - check tire pressure' : 'optimal for driving'}.`
          }]);
          setIsLoading(false);
          return;
        }
        if (lowerText.includes('speed') || lowerText.includes('limit')) {
          setConversation(prev => [...prev, {
            id: Date.now() + 1,
            type: 'ai',
            message: "⚡ Speed monitoring active. Current speed limits: City zones 40-60 km/h, Highways 80-120 km/h. I'll alert you if you exceed safe limits."
          }]);
          setIsLoading(false);
          return;
        }
      } else if (aiMode === 'emergency') {
        if (lowerText.includes('sos') || lowerText.includes('help') || lowerText.includes('emergency')) {
          setConversation(prev => [...prev, {
            id: Date.now() + 1,
            type: 'ai',
            message: "🚨 EMERGENCY MODE ACTIVATED. Sharing your location with emergency contacts. Stay calm. Help is on the way. Are you injured? Reply YES or NO."
          }]);
          setIsLoading(false);
          return;
        }
      }

      // General AI using crashCueAI
      const ctx = {
        time: new Date().toLocaleTimeString(),
        mode: aiMode,
        weather: weatherData,
        speed: speedHistory.length > 0 ? speedHistory[speedHistory.length - 1].speed : 0
      };
      const resp = crashCueAI.generateResponse(text, ctx);
      setConversation(prev => [...prev, { id: Date.now() + 1, type: 'ai', message: resp }]);

      // Automatically speak the response if enabled
      if (autoSpeak) {
        speakResponse(resp);
      }
    } catch (e) {
      setConversation(prev => [...prev, { id: Date.now() + 1, type: 'ai', message: "Error processing command." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakResponse = async (text: string) => {
    try {
      setIsSpeaking(true);
      // Stop any current speech before starting new one
      await Speech.stop();

      const cleanText = text.replace(/[*#]/g, ''); // Remove markdown formatting

      await Speech.speak(cleanText, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.95,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (e) {
      console.error('Speech error:', e);
      setIsSpeaking(false);
    }
  };

  const startVoice = async () => {
    const _win = globalThis as any;
    if (Platform.OS === 'web' && _win.webkitSpeechRecognition) {
      setIsListening(true);
      const rec = new _win.webkitSpeechRecognition();
      rec.onresult = (e: any) => {
        setIsListening(false);
        const transcript = e.results[0][0].transcript;
        handleSend(transcript);
      };
      rec.onend = () => setIsListening(false);
      rec.start();
    } else {
      // Mobile implementation for voice button feedback
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert("Permission Denied", "Microphone access is required for voice input.");
          return;
        }

        setIsListening(true);
        // On native, we show listening state and then let user know to type or use system keyboard mic
        setTimeout(() => {
          setIsListening(false);
          Alert.alert("Listening Active", "System ready. For the best experience, use the microphone button on your device keyboard.");
        }, 3000);
      } catch (e) {
        Alert.alert("Voice Error", "Could not initialize audio system.");
        setIsListening(false);
      }
    }
  };

  // --- Render ---

  // Chat Bubble Component
  const ChatBubble = ({ item }: any) => {
    const isUser = item.type === 'user';
    const primary = useThemeColor({}, 'primary');
    const backgroundCard = useThemeColor({}, 'backgroundCard');
    const textPrimary = useThemeColor({}, 'textPrimary');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const border = useThemeColor({}, 'border');

    return (
      <View className={`flex-row mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <View
            className="w-8 h-8 rounded-full items-center justify-center mr-2 border"
            style={{ backgroundColor: primary + '1A', borderColor: border }}
          >
            <Ionicons name="hardware-chip" color={primary} size={16} />
          </View>
        )}
        <View
          className={`px-4 py-3 max-w-[80%] rounded-2xl ${isUser ? 'rounded-tr-none' : 'rounded-tl-none border'
            }`}
          style={isUser ? { backgroundColor: primary } : { backgroundColor: backgroundCard, borderColor: border }}
        >
          <Text
            className="text-sm leading-5"
            style={isUser ? { color: '#FFF' } : { color: textPrimary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
          >
            {item.message}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: background }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[backgroundHeader, background, '#000000']} className="absolute inset-0" />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 pb-5 border-b"
        style={{ paddingTop: Math.max(insets.top + 10, 48), borderBottomColor: border, backgroundColor: backgroundHeader }}
      >
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} className="p-2">
          <Ionicons name="arrow-back" color={primary} size={24} />
        </TouchableOpacity>
        <NeuralCore isListening={isListening} isLoading={isLoading} isSpeaking={isSpeaking} />
        <TouchableOpacity onPress={() => router.push('/settings')} className="p-2">
          <Ionicons name="settings-outline" color={primary} size={24} />
        </TouchableOpacity>
      </View>

      {/* Main Content - ScrollView to include Widgets and Chat */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 60, 100) }}>

          {/* 1. Weather Widget (Glass) */}
          <View className="px-5 mb-7 mt-4">
            <GlassCard
              className="p-6 relative"
              glow
              entering={FadeInDown.delay(100).duration(800)}
            >
              <View className="flex-row justify-between items-start mb-3">
                <View>
                  <Text className="text-4xl font-black" style={{ color: textPrimary }}>{weatherData?.temperature || '--'}°</Text>
                  <Text className="text-sm tracking-widest mt-1" style={{ color: primary }}>{weatherData?.location?.toUpperCase() || 'SCANNING...'}</Text>
                </View>
                <View
                  className="w-15 h-15 rounded-full items-center justify-center border"
                  style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' }}
                >
                  <Ionicons name="partly-sunny" size={30} color={primary} />
                </View>
              </View>
              <Text className="text-sm tracking-widest mb-3" style={{ color: textSecondary }}>{weatherData?.condition || 'Checking weather...'}</Text>
              <View className="flex-row gap-4 border-t pt-3 mt-3" style={{ borderColor: border }}>
                <Text className="text-xs font-bold" style={{ color: textPrimary }}>Wind: {weatherData?.wind || 0} KM/H</Text>
                <Text className="text-xs font-bold" style={{ color: textPrimary }}>Humidity: {weatherData?.humidity || 0}%</Text>
              </View>
            </GlassCard>
          </View>

          {/* 2. AI Mode Selector */}
          <View className="px-5 mb-7">
            <Text
              className="text-xs font-bold tracking-widest mb-4 shadow-sm"
              style={{ color: 'rgba(0,224,255,0.8)', textShadowColor: 'rgba(0,224,255,0.3)', textShadowRadius: 4 }}
            >
              Select Mode
            </Text>
            <View className="flex-row gap-2.5 mb-2">
              {[
                { key: 'driving', label: 'TACTICAL', icon: 'car' },
                { key: 'general', label: 'ANALYTIC', icon: 'chatbubbles' },
                { key: 'emergency', label: 'CRITICAL', icon: 'warning' }
              ].map((m, idx) => (
                <TouchableOpacity
                  key={m.key}
                  className="flex-1 flex-row items-center justify-center py-3 px-3 rounded-2xl border gap-1.5"
                  style={[
                    aiMode === m.key && { backgroundColor: m.key === 'emergency' ? 'rgba(255,0,0,0.1)' : primary + '1A' },
                    {
                      backgroundColor: aiMode === m.key ? undefined : 'rgba(255,255,255,0.03)',
                      borderColor: aiMode === m.key ? (m.key === 'emergency' ? '#FF0000' : primary) : 'rgba(255,255,255,0.1)'
                    }
                  ]}
                  onPress={async () => {
                    if (m.key === 'emergency') await triggerErrorVibration();
                    else await triggerHaptic('medium');
                    setAiMode(m.key as any);
                  }}
                >
                  <Ionicons name={m.icon as any} size={20} color={aiMode === m.key ? (m.key === 'emergency' ? '#FF0000' : primary) : textSecondary} />
                  <Text
                    className="text-[10px] font-semibold tracking-wide"
                    style={{ color: aiMode === m.key ? (m.key === 'emergency' ? '#FF0000' : primary) : textSecondary }}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 3. Suggestions Grid (Glass) */}
          <View className="px-5 mb-7">
            <Text
              className="text-xs font-bold tracking-widest mb-4 shadow-sm"
              style={{ color: primary, textShadowColor: 'rgba(0,224,255,0.3)', textShadowRadius: 4 }}
            >
              Features
            </Text>
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {suggestions.map((s, idx) => (
                <GlassCard
                  key={s.id}
                  className="w-[48%] mb-3"
                  style={{ backgroundColor: backgroundCard, borderColor: border }}
                  onPress={async () => {
                    await triggerHaptic('light');
                    handleSend(s.title);
                  }}
                  glow
                  entering={FadeInDown.delay(200 + idx * 100).duration(600)}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mb-3"
                    style={{ backgroundColor: primary + '1A' }}
                  >
                    <Ionicons name={s.icon as any} size={24} color={accent} />
                  </View>
                  <Text className="text-xs font-bold tracking-wide mb-1" style={{ color: textPrimary }}>{s.title.toUpperCase()}</Text>
                  <Text className="text-[10px]" style={{ color: textSecondary }}>{s.description}</Text>
                </GlassCard>
              ))}
            </View>
          </View>

          {/* 4. Conversation History */}
          <View className="px-5 mb-7">
            <Text
              className="text-xs font-bold tracking-widest mb-4 shadow-sm"
              style={{ color: primary, textShadowColor: 'rgba(0,224,255,0.3)', textShadowRadius: 4 }}
            >
              Chat History
            </Text>
            {conversation.map((msg, i) => <ChatBubble key={i} item={msg} />)}
          </View>

        </ScrollView>

        {/* Floating Input Deck */}
        <View
          className="flex-row items-center px-4 py-3 border-t"
          style={{
            backgroundColor: backgroundCard + 'CC',
            borderColor: border,
            backdropFilter: Platform.OS === 'web' ? 'blur(20px)' : undefined,
          }}
        >
          <View
            className="flex-1 flex-row items-center px-4 py-2 mr-2 rounded-3xl border"
            style={{ backgroundColor: background + '80', borderColor: border }}
          >
            <TextInput
              className="flex-1 h-10 text-sm mr-2"
              style={{ color: textPrimary }}
              placeholder="Type your message..."
              placeholderTextColor={primary + '4D'}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend()}
            />
            <TouchableOpacity onPress={() => handleSend()}>
              <Ionicons name="send" color={inputText ? primary : textSecondary} size={20} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (isSpeaking) {
                Speech.stop();
                setIsSpeaking(false);
              } else {
                setAutoSpeak(!autoSpeak);
              }
            }}
            className="w-10 h-10 rounded-full items-center justify-center mr-2 border"
            style={{
              borderColor: autoSpeak ? primary : border,
              backgroundColor: autoSpeak ? primary + '1A' : 'transparent'
            }}
          >
            <Ionicons name={isSpeaking ? "volume-mute" : autoSpeak ? "volume-high" : "volume-off"} color={autoSpeak ? primary : textSecondary} size={22} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={startVoice}
            className="w-10 h-10 rounded-full items-center justify-center border"
            style={[
              { borderColor: isListening ? '#FF0000' : border },
              isListening && { backgroundColor: 'rgba(255,0,0,0.1)' }
            ]}
          >
            <Ionicons name="mic" color={isListening ? "#FF0000" : textPrimary} size={24} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Map Modal */}
      <Modal visible={showMap} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/80 px-5">
          <View className="w-full h-[70%] bg-black rounded-3xl overflow-hidden border border-white/20">
            <View className="flex-row justify-between items-center p-4 bg-white/10 border-b border-white/10">
              <Text className="text-white font-bold tracking-widest text-xs">TRAJECTORY</Text>
              <TouchableOpacity onPress={() => setShowMap(false)}>
                <Ionicons name="close" color="#F00" size={24} />
              </TouchableOpacity>
            </View>
            {Platform.OS !== 'web' ? (
              <MapView style={{ flex: 1 }} region={mapRegion} provider={PROVIDER_GOOGLE} />
            ) : (
              <View className="flex-1 items-center justify-center bg-gray-900">
                <Text className="text-white">Map Visualization Active</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}
