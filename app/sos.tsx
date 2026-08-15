import { triggerIntenseHeartbeatHaptic, triggerStrongVibration } from '@/utils/hapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
	FadeInDown,
	FadeInUp,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { useTimeBattery } from '../hooks/useTimeBattery';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSpeedHistory } from '../context/SpeedHistoryContext';

export default function SOSScreen() {
	const router = useRouter();
	const { resetCrashDetection } = useSpeedHistory();
	const { timeString } = useTimeBattery();
	const { theme } = useTheme();
	const error = useThemeColor({}, 'error');
	const background = useThemeColor({}, 'background');
	const border = useThemeColor({}, 'border');
	const textPrimary = useThemeColor({}, 'textPrimary');
	const textSecondary = useThemeColor({}, 'textSecondary');
	const [countdown, setCountdown] = useState(10);
	const [torchOn, setTorchOn] = useState(false);
	const [permission, requestPermission] = useCameraPermissions();
	const insets = useSafeAreaInsets();

	const pulseValue = useSharedValue(1);
	const glowValue = useSharedValue(0.4);

	useEffect(() => {
		pulseValue.value = withRepeat(
			withSequence(
				withTiming(1.2, { duration: 500 }),
				withTiming(1, { duration: 500 })
			),
			-1,
			true
		);
		glowValue.value = withRepeat(
			withTiming(1, { duration: 1000 }),
			-1,
			true
		);

		if (!permission || !permission.granted) {
			requestPermission();
		}
	}, [permission]);

	// Flashlight strobe logic
	useEffect(() => {
		let strobe: ReturnType<typeof setInterval>;
		if (countdown > 0) {
			strobe = setInterval(() => {
				setTorchOn(p => !p);
			}, 100);
		} else {
			setTorchOn(false);
		}
		return () => {
			if (strobe) clearInterval(strobe);
		};
	}, [countdown]);

	const animatedTriggerStyle = useAnimatedStyle(() => ({
		transform: [{ scale: pulseValue.value }],
		opacity: interpolate(glowValue.value, [0.4, 1], [0.6, 1])
	}));

	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const clearAutoTrigger = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	}, []);

	const handleConfirm = useCallback(() => {
		clearAutoTrigger();
		router.replace('/emergency-active');
	}, [clearAutoTrigger, router]);

	const handleCancel = useCallback(() => {
		clearAutoTrigger();
		resetCrashDetection();
		router.replace('/(tabs)');
	}, [clearAutoTrigger, router, resetCrashDetection]);

	useEffect(() => {
		if (countdown === 0) {
			handleConfirm();
		}
	}, [countdown, handleConfirm]);

	useEffect(() => {
		clearAutoTrigger();
		timeoutRef.current = setInterval(() => {
			triggerIntenseHeartbeatHaptic();
			setCountdown(prev => {
				if (prev <= 0) return 0;
				return prev - 1;
			});
		}, 1000);

		return clearAutoTrigger;
	}, [clearAutoTrigger]);

	return (
		<View className="flex-1" style={{ backgroundColor: theme === 'light' ? '#FEE2E2' : '#1A0F0F' }}>
			<StatusBar barStyle="light-content" />

			{/* Background Gradient */}
			<LinearGradient
				colors={theme === 'light'
					? ['#FEE2E2', '#FEF2F2', '#FEE2E2']
					: ['#1A0F0F', '#2D1515', '#1A0F0F']
				}
				className="absolute inset-0"
			/>

			{/* Header */}
			<View className="px-5 pb-5 border-b" style={{ paddingTop: Math.max(insets.top + 10, 64), borderBottomColor: '#EF4444' }}>
				<View className="flex-row items-center justify-between">
					<View className="flex-row items-center">
						<View className="w-3 h-3 rounded-full bg-red-600 mr-3 animate-pulse" />
						<Text className="text-sm font-black tracking-widest text-red-600">
							EMERGENCY ALERT
						</Text>
					</View>
					<View className="px-3 py-1.5 rounded-lg bg-red-600/20">
						<Text className="text-xs font-black tracking-widest text-red-600">
							{timeString || '—:—:—'}
						</Text>
					</View>
				</View>
			</View>

			<View className="flex-1 items-center justify-center px-6">
				{/* Pulsing SOS Button */}
				<Animated.View
					entering={FadeInDown.duration(800)}
					className="items-center justify-center mb-12"
				>
					{/* Outer Glow */}
					<Animated.View
						className="absolute rounded-full"
						style={[
							animatedTriggerStyle,
							{
								width: 280,
								height: 280,
								backgroundColor: '#EF4444',
								opacity: 0.2,
							}
						]}
					/>

					{/* Middle Glow */}
					<Animated.View
						className="absolute rounded-full"
						style={[
							animatedTriggerStyle,
							{
								width: 240,
								height: 240,
								backgroundColor: '#EF4444',
								opacity: 0.3,
							}
						]}
					/>

					{/* Main Button */}
					<TouchableOpacity
						activeOpacity={0.8}
						onPress={handleConfirm}
						className="rounded-full border-4 items-center justify-center"
						style={{
							width: 200,
							height: 200,
							borderColor: '#EF4444',
							backgroundColor: theme === 'light' ? '#FFFFFF' : '#1A0F0F',
							shadowColor: '#EF4444',
							shadowOffset: { width: 0, height: 8 },
							shadowOpacity: 0.6,
							shadowRadius: 20,
							elevation: 15,
						}}
					>
						<Ionicons name="warning" size={48} color="#EF4444" style={{ marginBottom: 8 }} />
						<Text className="text-5xl font-black tracking-widest text-red-600">
							SOS
						</Text>
						<Text
							className="text-4xl font-black mt-2"
							style={{
								color: textPrimary,
								fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
							}}
						>
							{countdown}
						</Text>
					</TouchableOpacity>
				</Animated.View>

				{/* Info Card */}
				<Animated.View
					entering={FadeInUp.delay(300).duration(600)}
					className="w-full rounded-3xl p-6 mb-8 border-2"
					style={{
						backgroundColor: theme === 'light' ? '#FFFFFF' : 'rgba(26, 15, 15, 0.8)',
						borderColor: '#EF4444',
					}}
				>
					<View className="flex-row items-center justify-center mb-3">
						<Ionicons name="time" size={20} color="#EF4444" />
						<Text className="text-sm font-black tracking-widest ml-2 text-red-600">
							AUTO-SEND IN {countdown}s
						</Text>
					</View>
					<Text className="text-sm text-center leading-6 font-semibold" style={{ color: textSecondary }}>
						Emergency services will be contacted automatically. Your location will be shared with emergency contacts.
					</Text>
				</Animated.View>

				{/* Action Buttons */}
				<View className="w-full gap-4">
					{/* Cancel Button */}
					<TouchableOpacity
						className="rounded-3xl p-5 items-center border-2"
						style={{
							backgroundColor: theme === 'light' ? '#FFFFFF' : background,
							borderColor: border,
						}}
						onPress={() => {
							triggerStrongVibration(60);
							handleCancel();
						}}
					>
						<Ionicons name="close-circle" size={24} color={textPrimary} style={{ marginBottom: 4 }} />
						<Text className="text-base font-black tracking-wide" style={{ color: textPrimary }}>
							Cancel Emergency
						</Text>
					</TouchableOpacity>

					{/* Send Now Button */}
					<TouchableOpacity
						className="rounded-3xl p-5 items-center"
						style={{
							backgroundColor: '#EF4444',
							shadowColor: '#EF4444',
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.4,
							shadowRadius: 8,
							elevation: 8,
						}}
						onPress={() => {
							triggerStrongVibration(200);
							handleConfirm();
						}}
					>
						<Ionicons name="call" size={24} color="#FFF" style={{ marginBottom: 4 }} />
						<Text className="text-white text-base font-black tracking-wide">
							Send SOS Now
						</Text>
					</TouchableOpacity>
				</View>
			</View>

			{/* Hidden CameraView for Torch Control */}
			{permission?.granted && (
				<CameraView
					style={{ width: 1, height: 1, position: 'absolute', opacity: 0 }}
					enableTorch={torchOn}
					facing="back"
				/>
			)}
		</View>
	);
}
