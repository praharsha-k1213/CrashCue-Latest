import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getRandomDrivingTip } from '../../constants/drivingTips';
import * as Battery from 'expo-battery';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Linking, Platform, ScrollView, StatusBar, Switch, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line } from 'react-native-svg';
import { useSpeedHistory } from '../../context/SpeedHistoryContext';
import { useScreenAwake } from '../../hooks/useScreenAwake';
import { useLocalStore } from '../../store/LocalStore';
import { makeEmergencyCall, makeSafeCall, sendEmergencySMS, sendEmergencyWhatsApp, sendSafeWhatsApp } from '../../services/twilioService';
import { useAuth } from '../../context/AuthContext';

const AnimatedLine = Animated.createAnimatedComponent(Line);

// Animated Mini Speedometer Icon
const MiniSpeedometer = ({ speed }: { speed: number }) => {
	const size = 36;
	const center = size / 2;
	const strokeWidth = 3;
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;

	// Speed mapping: 0 to 120 km/h -> -135 to 135 degrees (270 degree sweep)
	const getAngle = (spd: number) => {
		const clampedSpeed = Math.min(Math.max(spd, 0), 120);
		return -135 + (clampedSpeed / 120) * 270;
	};

	const needleAngle = useSharedValue(-135);

	useEffect(() => {
		needleAngle.value = withTiming(getAngle(speed), { duration: 500 }); // Smooth 500ms transition
	}, [speed]);

	const animatedProps = useAnimatedProps(() => {
		const angleRad = (needleAngle.value * Math.PI) / 180;
		const needleLen = radius - 2;
		const x2 = center + needleLen * Math.cos(angleRad);
		const y2 = center + needleLen * Math.sin(angleRad);
		return { x2, y2 };
	});

	// Tick marks at 0, 40, 80, 120 (The 4 requested checkpoints)
	const ticks = [0, 40, 80, 120].map(val => {
		const angle = getAngle(val);
		const rad = (angle * Math.PI) / 180;
		// Ticks placed on the arc
		const x = center + radius * Math.cos(rad);
		const y = center + radius * Math.sin(rad);
		return { x, y, val };
	});

	return (
		<View style={{ width: size, height: size }}>
			<Svg width={size} height={size}>
				{/* White Arc (270 degrees) */}
				<Circle
					cx={center}
					cy={center}
					r={radius}
					stroke="white"
					strokeWidth={strokeWidth}
					fill="none"
					strokeLinecap="round"
					strokeDasharray={`${circumference * 0.75} ${circumference}`}
					strokeDashoffset={0}
					rotation={135}
					origin={`${center}, ${center}`}
				/>

				{/* 4 Checkpoints */}
				{ticks.map((t, i) => (
					<Circle
						key={i}
						cx={t.x}
						cy={t.y}
						r={1.5}
						fill={t.val > 100 ? '#EF4444' : '#1e293b'} // Dark tick on white arc
					/>
				))}

				{/* Needle & Pivot */}
				<Circle cx={center} cy={center} r={3} fill="white" />
				<AnimatedLine
					x1={center}
					y1={center}
					stroke="white"
					strokeWidth="3"
					strokeLinecap="round"
					animatedProps={animatedProps}
				/>
			</Svg>
		</View>
	);
};

// Circular Progress Component for Safety Score
const CircularProgress = ({ score, size = 80, strokeWidth = 8, color = '#4F46E5' }: { score: number; size?: number; strokeWidth?: number; color?: string }) => {
	const radius = (size - strokeWidth) / 2;
	const circumference = radius * 2 * Math.PI;
	const strokeDashoffset = circumference - (score / 100) * circumference;

	return (
		<View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
			<Svg width={size} height={size}>
				<Circle
					stroke="#E0E7FF"
					cx={size / 2}
					cy={size / 2}
					r={radius}
					strokeWidth={strokeWidth}
				/>
				<Circle
					stroke={color}
					cx={size / 2}
					cy={size / 2}
					r={radius}
					strokeWidth={strokeWidth}
					strokeDasharray={circumference}
					strokeDashoffset={strokeDashoffset}
					strokeLinecap="round"
					rotation="-90"
					origin={`${size / 2}, ${size / 2}`}
				/>
			</Svg>
			<Text className="absolute text-xl font-bold text-indigo-600">{score}</Text>
		</View>
	);
};

// Useful System Status Card
const SystemStatusCard = ({ icon, title, value, color, subValue }: { icon: any; title: string; value: string; color: string; subValue?: string }) => (
	<View className="bg-white rounded-2xl p-4 mr-3 w-36 shadow-sm shadow-gray-100 border border-gray-50">
		<View className="flex-row justify-between items-start mb-2">
			<View className={`w-8 h-8 rounded-full items-center justify-center bg-${color}-50`}>
				<Ionicons name={icon} size={16} color={color === 'indigo' ? '#6366F1' : color === 'emerald' ? '#10B981' : '#F59E0B'} />
			</View>
			<View className={`w-2 h-2 rounded-full ${color === 'emerald' ? 'bg-green-500' : 'bg-gray-300'}`} />
		</View>
		<Text className="text-gray-400 text-[10px] font-bold uppercase mb-0.5">{title}</Text>
		<Text className="text-slate-800 text-sm font-bold">{value}</Text>
		{subValue && <Text className="text-gray-400 text-[10px] mt-1">{subValue}</Text>}
	</View>
);

export default function HomeScreen() {
	useScreenAwake();
	const router = useRouter();
	const { userProfile, lastTrip, setLastTrip, userNumbers, doctor, setUserProfile } = useLocalStore();
	const { user, userProfile: firebaseProfile } = useAuth();
	const { startTracking, safetyScore, currentSpeed: speed, currentLocation: location, crashDetected } = useSpeedHistory();

	const [isHighwayMode, setIsHighwayMode] = useState(false);
	const [address, setAddress] = useState('Locating...');
	const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
	const [gpsAccuracy, setGpsAccuracy] = useState<string>('Waiting');
	const [dailyTip] = useState<string>(() => getRandomDrivingTip());

	const [temperature, setTemperature] = useState<string>('--°C');
	const [weatherCondition, setWeatherCondition] = useState<string>('Checking...');
	const insets = useSafeAreaInsets();

	// Trip Tracking Logic
	const [tripStartTime, setTripStartTime] = useState<number | null>(null);
	const [maxSpeedInTrip, setMaxSpeedInTrip] = useState(0);

	// Sync Firebase user profile to LocalStore
	useEffect(() => {
		if (user && firebaseProfile) {
			setUserProfile({
				name: firebaseProfile.displayName || user.displayName || 'User',
				phone: firebaseProfile.phone || '',
				photoURL: user.photoURL || firebaseProfile.profilePicture
			});
		}
	}, [user, firebaseProfile, setUserProfile]);

	// Unified SOS Button Handler - Voice Call & WhatsApp via Twilio
	const handleSOSAction = async () => {
		try {
			if (!userNumbers || userNumbers.length === 0) {
				Alert.alert('No Contact Found', 'Please add emergency contacts in the User Dashboard first.');
				return;
			}
			if (!location || !location.latitude || !location.longitude) {
				Alert.alert('Location Unavailable', 'Unable to get your current location. Please ensure GPS is enabled.');
				return;
			}

			const userName = userProfile?.name || 'A user';
			const loc = { latitude: location.latitude, longitude: location.longitude };
			const addr = address !== 'Locating...' && address !== 'Waiting for GPS...' ? address : undefined;

			// Build all contacts - user contacts + doctor
			const allContacts: { name: string; phone: string }[] = [...userNumbers];
			if (doctor?.name && doctor?.phone) allContacts.push({ name: doctor.name, phone: doctor.phone });

			const targets = allContacts.map(c => {
				const raw = c.phone.replace(/[\s\-\(\)]/g, '');
				const phone = raw.startsWith('+') ? raw : raw.startsWith('91') && raw.length > 10 ? `+${raw}` : `+91${raw}`;
				return { name: c.name, phone };
			});

			Alert.alert('Initiating SOS', `Alerting ${targets.length} contact(s) via Call and WhatsApp...`);

			await Promise.all([
				...targets.map(t => makeEmergencyCall({ toPhoneNumber: t.phone, userName, location: loc, address: addr }).catch(console.log)),
				...targets.map(t => sendEmergencyWhatsApp({ toPhoneNumber: t.phone, userName, location: loc, address: addr }).catch(console.log))
			]);

			Alert.alert('SOS Sent', `Emergency alerts sent to: ${targets.map(t => t.name).join(', ')}`);
		} catch (error) {
			console.log('Error sending SOS:', error);
			Alert.alert('SOS Failed', 'Failed to initiate SOS. Please check your internet connection.');
		}
	};

	// Safe Button Handler - Automated WhatsApp via Twilio Sandbox
	const handleSafeAlert = async () => {
		try {
			if (!userNumbers || userNumbers.length === 0) {
				Alert.alert('No Contact Found', 'Please add emergency contacts in the User Dashboard first.');
				return;
			}
			if (!location || !location.latitude || !location.longitude) {
				Alert.alert('Location Unavailable', 'Unable to get your current location. Please ensure GPS is enabled.');
				return;
			}

			const userName = userProfile?.name || 'A user';
			const loc = { latitude: location.latitude, longitude: location.longitude };
			const addr = address !== 'Locating...' && address !== 'Waiting for GPS...' ? address : undefined;

			// Safe alerts go to user contacts only (not doctor)
			const targets = userNumbers.map((c: { name: string; phone: string }) => {
				const raw = c.phone.replace(/[\s\-\(\)]/g, '');
				const phone = raw.startsWith('+') ? raw : raw.startsWith('91') && raw.length > 10 ? `+${raw}` : `+91${raw}`;
				return { name: c.name, phone };
			});

			Alert.alert('Sending Safe Status', `Notifying ${targets.length} contact(s) via Call and WhatsApp...`);

			await Promise.all(targets.map(async (t: { name: string; phone: string }) => {
				const params = { toPhoneNumber: t.phone, userName, location: loc, address: addr };
				await Promise.all([
					makeSafeCall(params).catch(e => console.log('Safe call error:', e)),
					sendSafeWhatsApp(params).catch(e => console.log('Safe WhatsApp error:', e)),
				]);
			}));

			Alert.alert('Safe Status Sent', `Your safe status was sent to: ${targets.map((t: { name: string }) => t.name).join(', ')}`);
		} catch (error) {
			console.log('Error sending safe alert:', error);
			Alert.alert('Failed', 'Failed to send your safe status. Please check your connection.');
		}
	};

	// Detect Trip Start/End
	useEffect(() => {
		if (speed > 5 && !tripStartTime) {
			// Trip Started
			setTripStartTime(Date.now());
		} else if (speed <= 1 && tripStartTime) {
			// Trip Ended (if duration > 10 seconds to avoid noise)
			const duration = (Date.now() - tripStartTime) / 60000; // minutes
			if (duration > 0.1) {
				setLastTrip({
					timestamp: Date.now(),
					distance: (duration / 60) * (maxSpeedInTrip * 0.5), // Rough estimate: avg speed ~ half max
					duration: duration
				});
			}
			setTripStartTime(null);
			setMaxSpeedInTrip(0);
		}

		if (speed > maxSpeedInTrip) {
			setMaxSpeedInTrip(speed);
		}
	}, [speed]);

	useEffect(() => {
		// Initialize tracking when Home screen mounts
		startTracking();

		(async () => {
			// Battery
			try {
				const level = await Battery.getBatteryLevelAsync();
				setBatteryLevel(Math.round(level * 100));
			} catch (e) {
				console.log('Battery error', e);
				// Fallback for simulator or web if API fails
				setBatteryLevel(100);
			}

			// Location & Address & Weather
			if (location && location.latitude) {
				try {
					// Determine accuracy based on speed/freshness (mock logic as we don't have raw accuracy in store)
					setGpsAccuracy('High Accuracy');

					// 1. Reverse Geocode - Use Google Maps API for better accuracy
					try {
						// Try Google Maps Geocoding API first (more accurate)
						const googleApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
						if (googleApiKey) {
							const geocodeResponse = await fetch(
								`https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=${googleApiKey}`
							);
							const geocodeData: any = await geocodeResponse.json();

							if (geocodeData.status === 'OK' && geocodeData.results.length > 0) {
								// Get the most detailed result (usually the first one)
								const result = geocodeData.results[0];
								const formattedAddress = result.formatted_address;
								setAddress(formattedAddress);
							} else {
								// Fallback to Expo's reverse geocoding
								throw new Error('Google geocoding failed');
							}
						} else {
							// No Google API key, use Expo's reverse geocoding
							throw new Error('No Google API key');
						}
					} catch (error) {
						// Fallback to Expo's reverse geocoding
						const results = await Location.reverseGeocodeAsync({
							latitude: location.latitude,
							longitude: location.longitude
						});
						if (results.length > 0) {
							const addr = results[0] as any;
							// Create detailed address with ALL available components
							const addressParts = [];
							if (addr.name) addressParts.push(addr.name);
							if (addr.street) addressParts.push(addr.street);
							if (addr.streetNumber) addressParts.push(addr.streetNumber);
							if (addr.sublocality) addressParts.push(addr.sublocality);
							if (addr.district) addressParts.push(addr.district);
							if (addr.city) addressParts.push(addr.city);
							if (addr.region) addressParts.push(addr.region);
							if (addr.postalCode) addressParts.push(addr.postalCode);

							// Set detailed address for display and emergency use
							const detailedAddress = addressParts.length > 0
								? addressParts.join(', ')
								: 'Unknown Location';
							setAddress(detailedAddress);
						}
					}

					// 2. Fetch Weather
					const API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY;
					if (API_KEY) {
						const response = await fetch(
							`https://api.openweathermap.org/data/2.5/weather?lat=${location.latitude}&lon=${location.longitude}&appid=${API_KEY}&units=metric`
						);
						const data: any = await response.json();
						if (data.main && data.main.temp) {
							setTemperature(`${Math.round(data.main.temp)}°C`);
						}
						// Set Weather Condition for Road Status
						if (data.weather && data.weather.length > 0) {
							const main = data.weather[0].main;
							if (['Rain', 'Drizzle', 'Thunderstorm'].includes(main)) setWeatherCondition('Wet Roads');
							else if (['Snow'].includes(main)) setWeatherCondition('Icy Roads');
							else if (['Fog', 'Mist', 'Haze'].includes(main)) setWeatherCondition('Low Visibility');
							else setWeatherCondition('Dry Roads');
						}
					}
				} catch (e) {
					console.log('Location/Weather error', e);
					setAddress('GPS Active');
					setWeatherCondition('Unknown');
				}
			} else {
				setAddress('Waiting for GPS...');
				setGpsAccuracy('Searching...');
			}
		})();
	}, [location]);

	const formatTimeAgo = (timestamp: number) => {
		if (!timestamp) return 'No recent trips';
		const diff = (Date.now() - timestamp) / 60000; // minutes
		if (diff < 1) return 'Just now';
		if (diff < 60) return `${Math.round(diff)}m ago`;
		const hours = Math.round(diff / 60);
		return `${hours}h ago`;
	};

	const bgMain = '#FAFAFA'; // Light gray background

	return (
		<View className="flex-1 bg-[#FAFAFA]">
			<View
				className="flex-1 w-full bg-[#FAFAFA] md:max-w-xl md:mx-auto md:rounded-3xl md:shadow-2xl"
			>
				<StatusBar barStyle="dark-content" backgroundColor={bgMain} />

				{/* Header Section */}
				<View 
					className="pb-4 px-6 flex-row justify-between items-start md:px-10"
					style={{ paddingTop: Math.max(insets.top + 10, 56) }}
				>
					<View className="flex-row items-center flex-1 pr-4">
						{/* Avatar */}
						<View className="w-16 h-16 rounded-full bg-indigo-500 items-center justify-center mr-4 shadow-sm shadow-indigo-200 overflow-hidden">
							{userProfile?.photoURL ? (
								<Image
									source={{ uri: userProfile.photoURL }}
									style={{ width: 64, height: 64, borderRadius: 32 }}
									resizeMode="cover"
								/>
							) : (
								<Ionicons name="person" size={32} color="white" />
							)}
						</View>

						<View className="flex-1">
							<Text className="text-gray-500 text-xs font-bold tracking-wider uppercase mb-0.5">Good Day</Text>
							<View className="flex-row items-center mb-1">
								<Text className="text-2xl font-black text-slate-800 mr-2" numberOfLines={1}>
									{userProfile?.name || 'Krishna'}
								</Text>
							</View>

							<View className="flex-row items-center gap-3 pr-2">
								<TouchableOpacity
									onPress={() => {
										if (location?.latitude && location?.longitude) {
											const url = Platform.select({
												ios: `maps:${location.latitude},${location.longitude}`,
												android: `geo:${location.latitude},${location.longitude}?q=${location.latitude},${location.longitude}`
											});
											Linking.openURL(url || '');
										}
									}}
									className="flex-row items-center bg-indigo-50 px-2 py-1 rounded-lg flex-1"
								>
									<Ionicons name="location-sharp" size={12} color="#6366F1" />
									<Text className="text-indigo-500 text-xs font-bold ml-1 flex-1" numberOfLines={1}>{address}</Text>
								</TouchableOpacity>
								<View className="flex-row items-center bg-amber-50 px-2 py-1 rounded-lg shrink-0">
									<Ionicons name="sunny" size={12} color="#F59E0B" />
									<Text className="text-amber-500 text-xs font-bold ml-1">{temperature}</Text>
								</View>
							</View>
						</View>
					</View>

					{/* Safe Button */}
					<View className="items-center ml-2">
						<TouchableOpacity
							className="w-14 h-14 bg-white rounded-2xl items-center justify-center shadow-sm shadow-gray-200 mb-1 border border-green-100"
							onPress={handleSafeAlert}
						>
							<Ionicons name="shield-checkmark" size={28} color="#10B981" />
						</TouchableOpacity>
						<Text className="text-[10px] font-bold text-emerald-600">I am Safe!</Text>
					</View>
				</View>

				<ScrollView
					className="flex-1 px-6 pt-2 md:px-10"
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{
						paddingBottom: 40,
					}}
				>
					{/* Driving Tips Card (Black) */}
					<Animated.View entering={FadeInDown.delay(100).duration(600)} className="mb-6">
						<View
							className="w-full bg-slate-900 rounded-[30px] p-6 flex-row items-center shadow-lg shadow-slate-300"
						>
							<View className="w-16 h-16 bg-slate-800 rounded-full items-center justify-center mr-5 border border-slate-700 overflow-hidden">
								<Image
									source={require('../../assets/images/logo.png')}
									style={{ width: 52, height: 52, borderRadius: 26 }}
									resizeMode="contain"
								/>
							</View>
							<View className="flex-1">
								<Text className="text-indigo-300 text-xs font-bold tracking-widest uppercase mb-1">💡 DAILY DRIVING TIP</Text>
								<Text className="text-white text-sm font-semibold leading-5">
									{dailyTip}
								</Text>
							</View>
						</View>
					</Animated.View>

					{/* Mode Toggle Card (White) */}
					<Animated.View entering={FadeInDown.delay(200).duration(600)} className="mb-8">
						<View className="bg-white rounded-[24px] p-6 flex-row items-center justify-between shadow-sm shadow-gray-100 border border-gray-50">
							<Text className="text-slate-800 text-base font-bold">City Mode/Highway Mode</Text>
							<Switch
								trackColor={{ false: '#E2E8F0', true: '#E2E8F0' }}
								thumbColor={isHighwayMode ? '#6366F1' : '#F8FAFC'}
								ios_backgroundColor="#E2E8F0"
								onValueChange={() => {
									setIsHighwayMode(!isHighwayMode);
									router.push('/modes');
								}}
								value={isHighwayMode}
								style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
							/>
						</View>
					</Animated.View>

					{/* Action Buttons Row */}
					<Animated.View
						entering={FadeInDown.delay(300).duration(600)}
						className="flex-row justify-center items-center mb-8 px-2 md:px-0 gap-6"
					>
						<View className="items-center min-w-[80px]">
							<TouchableOpacity
								className="w-20 h-20 bg-slate-900 rounded-full items-center justify-center mb-3 shadow-lg shadow-slate-200"
								onPress={() => router.push('/user')}
							>
								<View className="w-10 h-10 border-2 border-yellow-500 rounded-lg grid grid-cols-2 gap-0.5 p-0.5" style={{ opacity: 1 }}>
									<View className="bg-yellow-500 flex-1 rounded-[1px]" />
									<View className="bg-yellow-500 flex-1 rounded-[1px]" />
									<View className="bg-yellow-500 flex-1 rounded-[1px]" />
									<View className="bg-yellow-500 flex-1 rounded-[1px]" />
								</View>
							</TouchableOpacity>
							<Text className="text-slate-600 text-xs font-medium text-center">User</Text>
						</View>

						<View className="items-center min-w-[80px]">
							<TouchableOpacity
								className="w-24 h-24 bg-red-500 rounded-full items-center justify-center mb-3 shadow-xl shadow-red-200 relative"
								onPress={handleSOSAction}
								activeOpacity={0.8}
							>
								{/* Ripple effect rings */}
								<View className="absolute inset-0 bg-red-400 rounded-full opacity-30 scale-110" />
								<View className="absolute inset-0 bg-red-300 rounded-full opacity-20 scale-125" />
								<Ionicons name="warning" size={40} color="#FFFFFF" />
							</TouchableOpacity>
							<Text className="text-red-500 text-sm font-bold text-center">Emergency</Text>
						</View>

						<View className="items-center min-w-[80px]">
							<TouchableOpacity
								className="w-20 h-20 bg-slate-900 rounded-full items-center justify-center mb-3 shadow-lg shadow-slate-200"
								onPress={() => router.push('/history')}
							>
								<MiniSpeedometer speed={speed} />
							</TouchableOpacity>
							<Text className="text-slate-900 text-xs font-bold text-center">{Math.round(speed || 0)} kmph</Text>
						</View>
					</Animated.View>

					{/* Safety Score Card */}
					<Animated.View entering={FadeInDown.delay(400).duration(600)} className="mb-8">
						<View className="bg-white rounded-[32px] p-6 flex-row items-center justify-between shadow-sm shadow-gray-100 border border-gray-50">
							<View>
								<Text className="text-gray-500 text-xs font-bold mb-1">Safety Score</Text>
								<Text className="text-slate-900 text-3xl font-black mb-1">
									{safetyScore >= 95 ? 'Elite Driver' : safetyScore >= 80 ? 'Good Driver' : safetyScore >= 60 ? 'Fair Driver' : 'Careful'}
								</Text>
								<Text className="text-emerald-500 text-xs font-bold">Dynamic Scoring</Text>
							</View>
							<CircularProgress score={Math.round(safetyScore)} size={84} strokeWidth={8} color="#6366F1" />
						</View>
					</Animated.View>

					{/* System Readiness / Stationary Dashboard */}
					<Animated.View entering={FadeInDown.delay(500).duration(600)} className="mb-10 pl-2 md:pl-0">
						<View className="flex-row items-center mb-4">
							<View className={`w-1.5 h-12 rounded-full mr-4 ${speed > 5 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
							<View>
								<Text className="text-slate-900 text-2xl font-black uppercase tracking-tight">
									{speed > 5 ? 'MOVING' : 'STATIONARY'}
								</Text>
								<Text className="text-slate-400 text-sm font-medium">
									{speed > 5 ? 'Trip recording active...' : 'System ready for trip.'}
								</Text>
							</View>
						</View>
						{speed <= 5 && (
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								className="mt-2"
							>
								<SystemStatusCard
									icon="car-sport"
									title="Road Condition"
									value={weatherCondition}
									color={weatherCondition === 'Dry Roads' ? 'emerald' : weatherCondition === 'Wet Roads' ? 'amber' : 'gray'}
									subValue={weatherCondition === 'Dry Roads' ? 'Good Grip' : 'Drive Carefully'}
								/>
								<SystemStatusCard
									icon="location"
									title="GPS Signal"
									value={gpsAccuracy}
									color={gpsAccuracy === 'High Accuracy' ? 'emerald' : 'amber'}
									subValue="Satellite Lock"
								/>
								<SystemStatusCard
									icon="time"
									title="Last Activity"
									value={formatTimeAgo(lastTrip?.timestamp || 0)}
									color="indigo"
									subValue={`${(lastTrip?.distance || 0).toFixed(1)} km Trip`}
								/>
							</ScrollView>
						)}
					</Animated.View>

					<View className="h-24" />
				</ScrollView>
			</View>
		</View>
	);
}
