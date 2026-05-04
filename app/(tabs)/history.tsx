import { useSpeedHistory } from '../../context/SpeedHistoryContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import { Dimensions, ScrollView, StatusBar, Text, TouchableOpacity, View, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Svg, { Defs, Line, LinearGradient as SvgGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 80;
const CHART_HEIGHT = 160;

export default function SpeedHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { speedHistory } = useSpeedHistory();
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1H' | '6H' | '24H' | '7D' | 'Custom'>('1H');
  const [activeChartTab, setActiveChartTab] = useState<'Speed' | 'Distance' | 'Stops'>('Speed');

  const oldestTimestamp = speedHistory.length > 0 ? Math.min(...speedHistory.map(d => d.timestamp)) : Date.now();
  const availableAgeMs = Date.now() - oldestTimestamp;

  const validRanges = React.useMemo(() => {
    return (['1H', '6H', '24H', '7D', 'Custom'] as const).filter(range => {
      if (range === '1H') return true;
      if (range === '6H') return availableAgeMs > 3600000; // > 1 hour
      if (range === '24H') return availableAgeMs > 21600000; // > 6 hours
      if (range === '7D') return availableAgeMs > 86400000; // > 24 hours
      return true; // Custom
    });
  }, [availableAgeMs]);

  React.useEffect(() => {
    if (!validRanges.includes(selectedTimeRange)) {
        setSelectedTimeRange('1H');
    }
  }, [validRanges, selectedTimeRange]);

  const getFilteredData = () => {
    const now = Date.now();
    let timeLimit = 3600000; // 1 hour default
    if (selectedTimeRange === '6H') timeLimit = 21600000;
    if (selectedTimeRange === '24H') timeLimit = 86400000;
    if (selectedTimeRange === '7D' || selectedTimeRange === 'Custom') timeLimit = 604800000; 
    return speedHistory.filter(data => now - data.timestamp <= timeLimit);
  };

  const data = getFilteredData();

  // Stats calculation
  const stats = useMemo(() => {
    if (data.length === 0) return { max: 0, avg: 0, distance: 0, activeTime: 0 };
    const speeds = data.map(d => d.speed);
    
    // Haversine formula approximation for total distance
    let dist = 0;
    let activeMinutes = 0;
    for (let i = 1; i < data.length; i++) {
        const prev = data[i-1];
        const curr = data[i];
        
        const timeDiffMins = (curr.timestamp - prev.timestamp) / 60000;
        if (curr.speed > 1) {
            activeMinutes += timeDiffMins;
        }

        if (prev.location && curr.location) {
            const R = 6371; 
            const dLat = (curr.location.latitude - prev.location.latitude) * Math.PI / 180;
            const dLon = (curr.location.longitude - prev.location.longitude) * Math.PI / 180;
            const lat1 = prev.location.latitude * Math.PI / 180;
            const lat2 = curr.location.latitude * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
            dist += R * c;
        }
    }
    
    return {
      max: Math.max(...speeds),
      avg: speeds.reduce((a, b) => a + b, 0) / speeds.length,
      distance: dist,
      activeTime: activeMinutes
    };
  }, [data]);

  const renderSpeedChart = () => {
    if (data.length < 2) {
      return (
        <View style={{ height: CHART_HEIGHT + 30 }} className="items-center justify-center opacity-50">
          <Ionicons name="analytics" size={48} color="#9CA3AF" />
          <Text className="text-xs mt-2 text-gray-400">Insufficient Data for Graph</Text>
        </View>
      );
    }

    const displayData = data.length > 50 ? data.filter((_, i) => i % Math.ceil(data.length / 50) === 0) : data;
    
    const minChartWidth = width - 80;
    const currentChartWidth = Math.max(minChartWidth, displayData.length * 15);

    // Calculate dynamic max speed, rounded up to nearest nice interval
    let maxSpeed = Math.max(10, ...displayData.map(d => d.speed));
    maxSpeed = Math.ceil(maxSpeed / 10) * 10;
    const minSpeed = 0;

    const pointsData: [number, number][] = displayData.map((d, i) => {
      const x = (i / (displayData.length - 1)) * currentChartWidth;
      const y = CHART_HEIGHT - ((d.speed - minSpeed) / (maxSpeed - minSpeed)) * CHART_HEIGHT;
      return [x, y];
    });

    const generateBezierCurve = (pts: [number, number][]) => {
      if (pts.length === 0) return '';
      if (pts.length === 1) return `M ${pts[0][0]},${pts[0][1]}`;
      let d = `M ${pts[0][0]},${pts[0][1]}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const xc = (pts[i][0] + pts[i + 1][0]) / 2;
        const yc = (pts[i][1] + pts[i + 1][1]) / 2;
        if (i === 0) {
          d += ` L ${xc},${yc}`;
        } else {
          d += ` Q ${pts[i][0]},${pts[i][1]} ${xc},${yc}`;
        }
      }
      d += ` L ${pts[pts.length - 1][0]},${pts[pts.length - 1][1]}`;
      return d;
    };

    const pathData = generateBezierCurve(pointsData);
    const fillPath = `${pathData} L ${currentChartWidth},${CHART_HEIGHT} L 0,${CHART_HEIGHT} Z`;

    const startTime = displayData[0].timestamp;
    const endTime = displayData[displayData.length - 1].timestamp;
    const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View className="items-center mt-4 pb-2 content-center mx-auto w-full border border-transparent">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
          <Svg width={currentChartWidth + 30} height={CHART_HEIGHT + 30} className="overflow-visible">
            <Defs>
            <SvgGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#10B981" stopOpacity="0.4" />
              <Stop offset="1" stopColor="#10B981" stopOpacity="0" />
            </SvgGradient>
          </Defs>
          
          {/* Dynamic Grid lines & Labels */}
          {[1.0, 0.8, 0.6, 0.4, 0.2, 0].map((ratio, i) => {
             const y = CHART_HEIGHT - ratio * CHART_HEIGHT;
             const val = Math.round(maxSpeed * ratio);
             return (
               <React.Fragment key={i}>
                 <Line x1="15" y1={y} x2={currentChartWidth + 15} y2={y} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
                 {(i === 0 || i === 3 || i === 5) && <SvgText x="0" y={val === 0 ? y : y + 4} fill="#9CA3AF" fontSize="10">{val}</SvgText>}
               </React.Fragment>
             );
          })}

          {/* Dynamic Time X-axis labels */}
          <SvgText x="15" y={CHART_HEIGHT + 20} fill="#9CA3AF" fontSize="10">{formatTime(startTime)}</SvgText>
          <SvgText x={currentChartWidth / 2 + 15 - 15} y={CHART_HEIGHT + 20} fill="#9CA3AF" fontSize="10">{formatTime(startTime + (endTime - startTime) / 2)}</SvgText>
          <SvgText x={currentChartWidth + 15 - 20} y={CHART_HEIGHT + 20} fill="#9CA3AF" fontSize="10">{formatTime(endTime)}</SvgText>

          <Path d={`M 15,${CHART_HEIGHT} ${fillPath.replace(/M /g, 'M-').replace(/L /g, 'L-').replace(/-0,/g, '15,').replace(/-([0-9.]+),/g, (match, p1) => `${parseFloat(p1) + 15},`)}`} fill="url(#chartGradient)" />
          <Path d={`${pathData.replace(/M /g, 'M-').replace(/L /g, 'L-').replace(/Q /g, 'Q-').replace(/-0,/g, '15,').replace(/-([0-9.]+),/g, (match, p1) => `${parseFloat(p1) + 15},`).replace(/ ([0-9.]+) /g, (match, p1) => ` ${parseFloat(p1) + 15} `)}`.replace(/Q-([0-9.]+),([0-9.]+) ([0-9.]+),([0-9.]+)/g, (match, p1, p2, p3, p4) => `Q${parseFloat(p1) + 15},${p2} ${parseFloat(p3) + 15},${p4}`)} fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
        </ScrollView>

        {/* Legend */}
        <View className="flex-row items-center justify-center gap-6 mt-4">
            <View className="flex-row items-center gap-1.5"><View className="w-2.5 h-2.5 rounded-full bg-green-500" /><Text className="text-gray-500 text-xs font-medium">Moving</Text></View>
            <View className="flex-row items-center gap-1.5"><View className="w-2.5 h-2.5 rounded-full bg-[#a3e635]" /><Text className="text-gray-500 text-xs font-medium">Slow</Text></View>
            <View className="flex-row items-center gap-1.5"><View className="w-2.5 h-2.5 rounded-full bg-red-400" /><Text className="text-gray-500 text-xs font-medium">Stopped</Text></View>
        </View>
      </View>
    );
  };

  const neoBg = 'bg-[#F2F6F9]';
  const neoShadow = 'shadow-xl shadow-slate-300/50 border border-white';

  return (
    <View className={`flex-1 ${neoBg}`}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="px-5 pb-4 flex-row justify-between items-center z-10" style={{ paddingTop: Math.max(insets.top + 10, 56) }}>
        <TouchableOpacity 
          className={`w-12 h-12 rounded-full items-center justify-center ${neoShadow} bg-[#F2F6F9]`}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        
        <Text className="text-2xl font-black text-slate-800 tracking-tight">Speed Insights</Text>
        
        <View className="flex-row gap-3">
          <TouchableOpacity className={`w-10 h-10 rounded-full items-center justify-center ${neoShadow} bg-[#F2F6F9]`}>
            <Ionicons name="share-outline" size={20} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity className={`w-10 h-10 rounded-full items-center justify-center ${neoShadow} bg-[#F2F6F9]`}>
            <Ionicons name="settings-outline" size={20} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        
        {/* Segmented Control */}
        <View className="mx-5 mb-5 p-1.5 rounded-full flex-row items-center bg-[#E5EDF5] border border-white/60 shadow-inner">
          {validRanges.map(range => (
            <TouchableOpacity 
              key={range}
              onPress={() => setSelectedTimeRange(range)}
              className={`flex-1 py-3 items-center rounded-full ${selectedTimeRange === range ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`text-[12px] font-bold ${selectedTimeRange === range ? 'text-slate-800' : 'text-slate-400'}`}>
                 {range}{range === 'Custom' && ' ⌄'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 4 Stats Cards Carousel */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }} className="mb-5 flex-row">
            <View className={`w-28 p-4 rounded-3xl mr-4 ${neoShadow} bg-[#F2F6F9]`}>
               <View className="flex-row items-center justify-between mb-3"><Ionicons name="speedometer" size={18} color="#4B5563" /></View>
               <Text className="text-[10px] font-bold text-gray-500 mb-1">Top Speed</Text>
               <View className="flex-row items-baseline gap-1">
                   <Text className="text-3xl font-black text-slate-800">{Math.round(stats.max)}</Text>
                   <Text className="text-[10px] font-bold text-gray-500 uppercase">km/h</Text>
               </View>
               <Text className="text-[10px] font-medium text-emerald-500 mt-2">↗ Top Value</Text>
            </View>

            <View className={`w-28 p-4 rounded-3xl mr-4 ${neoShadow} bg-[#F2F6F9]`}>
               <View className="flex-row items-center justify-between mb-3"><Ionicons name="pulse" size={18} color="#4B5563" /></View>
               <Text className="text-[10px] font-bold text-gray-500 mb-1">Avg Speed</Text>
               <View className="flex-row items-baseline gap-1">
                   <Text className="text-3xl font-black text-slate-800">{Math.round(stats.avg)}</Text>
                   <Text className="text-[10px] font-bold text-gray-500 uppercase">km/h</Text>
               </View>
               <Text className="text-[10px] font-medium text-emerald-500 mt-2">~ Median Range</Text>
            </View>

            <View className={`w-28 p-4 rounded-3xl mr-4 ${neoShadow} bg-[#F2F6F9]`}>
               <View className="flex-row items-center justify-between mb-3"><Ionicons name="location" size={18} color="#4B5563" /></View>
               <Text className="text-[10px] font-bold text-gray-500 mb-1">Distance</Text>
               <View className="flex-row items-baseline gap-1">
                   <Text className="text-3xl font-black text-slate-800">{stats.distance.toFixed(1)}</Text>
                   <Text className="text-[10px] font-bold text-gray-500 uppercase">km</Text>
               </View>
            </View>

            <View className={`w-28 p-4 rounded-3xl mr-4 ${neoShadow} bg-[#F2F6F9]`}>
               <View className="flex-row items-center justify-between mb-3"><Ionicons name="time" size={18} color="#4B5563" /></View>
               <Text className="text-[10px] font-bold text-gray-500 mb-1">Active Time</Text>
               <View className="flex-row items-baseline gap-1">
                   <Text className="text-3xl font-black text-slate-800">{Math.round(stats.activeTime)}</Text>
                   <Text className="text-[10px] font-bold text-gray-500 uppercase">mins</Text>
               </View>
            </View>
        </ScrollView>

        {/* Velocity Trend Section -> SPEED OVER TIME */}
        <Animated.View entering={FadeInDown.delay(200)} className={`mx-5 p-5 rounded-[32px] ${neoShadow} bg-[#F2F6F9]`}>
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-[10px] font-bold text-gray-500 tracking-widest">SPEED OVER TIME</Text>
                <View className="flex-row bg-[#E5EDF5] p-1 rounded-full border border-white/60">
                    {['Speed', 'Distance', 'Stops'].map(tab => (
                        <TouchableOpacity 
                           key={tab} 
                           onPress={() => setActiveChartTab(tab as any)}
                           className={`px-3 py-1.5 rounded-full ${activeChartTab === tab ? 'bg-white shadow-sm' : ''}`}
                        >
                            <Text className={`text-[10px] font-bold ${activeChartTab === tab ? 'text-slate-800' : 'text-slate-400'}`}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            {renderSpeedChart()}
        </Animated.View>

        {/* Recent Locations */}
        <Animated.View entering={FadeInUp.delay(300)} className="mx-5 mt-6 pb-2">
            <Text className="text-[10px] font-bold text-gray-500 tracking-widest mb-4">RECENT LOCATIONS</Text>
            
            {data.length === 0 && (
                <Text className="text-xs text-gray-400 text-center py-4">No recent locations to display.</Text>
            )}

            {data.slice().reverse().filter(d => d.roadName || d.address || d.city).slice(0, 10).map((item, index) => (
                <TouchableOpacity 
                    key={index} 
                    activeOpacity={0.7}
                    onPress={() => {
                        if (item.location) {
                            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${item.location.latitude},${item.location.longitude}`);
                        }
                    }}
                    className={`p-4 rounded-[28px] flex-row items-center ${neoShadow} bg-[#F2F6F9] mb-4`}
                >
                    <View className="w-12 h-12 bg-[#E5EDF5] rounded-full items-center justify-center mr-4 border border-white shadow-inner">
                        <Ionicons name="location" size={20} color="#374151" />
                    </View>
                    <View className="flex-1 mr-2">
                        <Text className="text-[18px] font-black text-slate-800 mb-0.5">
                            {Math.round(item.speed)} <Text className="text-xs font-bold text-gray-500 uppercase">KM/H</Text>
                        </Text>
                        <Text className="text-sm font-semibold text-gray-600 mb-1" numberOfLines={1}>
                            {item.roadName || item.address || item.city || 'Unknown Location'}
                        </Text>
                        <Text className="text-[10px] font-medium text-gray-400">
                            Time: {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                    
                    {/* Tailwind Map Thumbnail */}
                    <View className="w-[72px] h-[52px] bg-emerald-100 rounded-xl overflow-hidden border border-white shadow-sm items-center justify-center relative">
                        <View className="absolute inset-0 bg-[#d1fae5]" style={{ opacity: 0.5 }}>
                            <Ionicons name="grid-outline" size={40} color="#6ee7b7" style={{ position: 'absolute', top: -10, left: 0, opacity: 0.5, transform: [{rotate: '45deg'}] }} />
                            <Ionicons name="grid-outline" size={40} color="#6ee7b7" style={{ position: 'absolute', top: 10, left: 20, opacity: 0.5, transform: [{rotate: '45deg'}] }} />
                        </View>
                        <Ionicons name="location" size={18} color="#EF4444" style={{ zIndex: 1, marginTop: -8 }} />
                        <View className="absolute bottom-0 inset-x-0 bg-slate-800 items-center justify-center py-1">
                           <Text className="text-[8px] font-bold text-white tracking-widest">View Map</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            ))}
        </Animated.View>

      </ScrollView>

      {/* Floating View Route Button */}
      <View className="absolute bottom-8 inset-x-0 px-20 items-center">
         <TouchableOpacity activeOpacity={0.8} className={`px-24 py-4 rounded-full flex-row items-center justify-center gap-2 ${neoShadow} bg-[#F2F6F9]`}>
             <Ionicons name="location" size={18} color="#374151" />
             <Text className="text-[15px] font-black tracking-tight text-slate-800">View Route</Text>
         </TouchableOpacity>
      </View>
    </View>
  );
}
