import { useThemeColor } from '@/hooks/useThemeColor';
import { useTimeBattery } from '@/hooks/useTimeBattery';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function LockedScreen() {
	const router = useRouter();
	const [isLocked, setIsLocked] = useState(true);
	const { timeString } = useTimeBattery();
	const insets = useSafeAreaInsets();

	// Theme colors
	const { theme } = useTheme();
	const primary = useThemeColor({}, 'primary');
	const accent = useThemeColor({}, 'accent');
	const border = useThemeColor({}, 'border');
	const background = useThemeColor({}, 'background');
	const textPrimary = useThemeColor({}, 'textPrimary');
	const textSecondary = useThemeColor({}, 'textSecondary');

	const handleUnlock = () => {
		setIsLocked(false);
	};

	const handleLock = () => {
		setIsLocked(true);
	};

	return (
		<View className="flex-1" style={{ backgroundColor: background }}>
			<StatusBar barStyle="light-content" />
			<LinearGradient colors={[background, '#101018', background]} style={StyleSheet.absoluteFill} />

			<View className="flex-row justify-between items-center px-5 pb-5" style={{ paddingTop: Math.max(insets.top + 10, 60) }}>
				<Text className="text-white text-xs font-black tracking-widest opacity-60" style={{ color: textPrimary }}>
					Screen Lock
				</Text>
				<Text
					className="text-sm"
					style={{
						color: primary,
						fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
					}}
				>
					{timeString || '—:—:—'}
				</Text>
			</View>

			<ScrollView contentContainerStyle={{ padding: 20, flex: 1, justifyContent: 'center' }}>
				<Animated.View
					entering={FadeInDown.duration(800)}
					className="rounded-3xl p-8 border items-center"
					style={{
						backgroundColor: 'rgba(255,255,255,0.02)',
						borderColor: isLocked ? 'rgba(255,0,0,0.3)' : 'rgba(0,224,255,0.3)'
					}}
				>
					<View
						className="w-35 h-35 rounded-full items-center justify-center mb-8"
						style={{ backgroundColor: isLocked ? 'rgba(255,0,0,0.05)' : primary + '0D' }}
					>
						<LinearGradient
							colors={[isLocked ? '#FF0000' : primary, 'transparent']}
							className="absolute w-40 h-40 rounded-full border opacity-20"
						/>
						<View
							className="w-25 h-25 rounded-full items-center justify-center border"
							style={{
								backgroundColor: isLocked ? 'rgba(255,0,0,0.1)' : primary + '1A',
								borderColor: 'rgba(255,255,255,0.1)'
							}}
						>
							<Ionicons
								name={isLocked ? "lock-closed" : "lock-open"}
								size={48}
								color={isLocked ? "#FF0000" : primary}
							/>
						</View>
					</View>

					<Text
						className="text-2xl font-black tracking-widest mb-3"
						style={{ color: isLocked ? '#FF0000' : primary }}
					>
						{isLocked ? 'Locked' : 'Unlocked'}
					</Text>
					<Text className="text-sm text-center mb-8" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 22 }}>
						{isLocked
							? 'All vehicle modules are secured. Encrypted lockout active.'
							: 'Authorized access granted. All protocols operational.'
						}
					</Text>

					<View className="flex-row gap-6 mb-10">
						<View className="items-center">
							<Text className="text-xs font-black tracking-wide mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
								IDENTIFIER
							</Text>
							<Text
								className="text-xs font-bold text-white"
								style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
							>
								CrashCue
							</Text>
						</View>
						<View className="items-center">
							<Text className="text-xs font-black tracking-wide mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
								PROTOCOL
							</Text>
							<Text
								className="text-xs font-bold text-white"
								style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
							>
								{isLocked ? 'Secure' : 'Open'}
							</Text>
						</View>
					</View>

					{isLocked ? (
						<TouchableOpacity
							className="w-full rounded-2xl py-4.5 items-center mb-3"
							style={{ backgroundColor: primary }}
							onPress={handleUnlock}
						>
							<Text className="text-xs font-black tracking-widest" style={{ color: background }}>
								Unlock
							</Text>
						</TouchableOpacity>
					) : (
						<TouchableOpacity
							className="w-full rounded-2xl py-4.5 items-center mb-3 bg-red-600"
							onPress={handleLock}
						>
							<Text className="text-white text-xs font-black tracking-widest">
								Lock Screen
							</Text>
						</TouchableOpacity>
					)}

					<TouchableOpacity
						className="w-full rounded-2xl py-4.5 items-center border"
						style={{
							backgroundColor: 'rgba(255,255,255,0.05)',
							borderColor: 'rgba(255,255,255,0.1)'
						}}
						onPress={() => router.replace('/(tabs)')}
					>
						<Text className="text-xs font-black tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>
							Go Back
						</Text>
					</TouchableOpacity>
				</Animated.View>
			</ScrollView>
		</View>
	);
}
