import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
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
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useGoogleAuth } from "../../utils/googleAuth";
import { TERMS_SECTIONS } from '../../constants/Terms';

export default function LoginScreen() {
    const router = useRouter();
    const { signIn, resetPassword, signInWithGoogle, user } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

    const { colors } = useTheme();
    const textPrimary = useThemeColor({}, 'textPrimary') as string;
    const textSecondary = useThemeColor({}, 'textSecondary') as string;
    const primary = colors.primary as string;
    const accent = colors.accent as string;
    const background = useThemeColor({}, 'background') as string;
    const backgroundCard = useThemeColor({}, 'backgroundCard') as string;
    const border = useThemeColor({}, 'border') as string;
    const insets = useSafeAreaInsets();

    // Reanimated Values
    const pulseValue = useSharedValue(1);
    const glowValue = useSharedValue(0);

    useEffect(() => {
        pulseValue.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration: 2000 }),
                withTiming(1, { duration: 2000 })
            ),
            -1,
            true
        );
        glowValue.value = withRepeat(
            withTiming(1, { duration: 3000 }),
            -1,
            true
        );
    }, []);

    const animatedGlow = useAnimatedStyle(() => ({
        opacity: 0.3 + (glowValue.value * 0.4),
        transform: [{ scale: pulseValue.value }]
    }));

    const { promptAsync } = useGoogleAuth();
    const handleGoogleSignIn = async () => {
        if (!termsAccepted) {
            Alert.alert('Terms Required', 'Please accept the Terms and Conditions to continue.');
            return;
        }
        try {
            setIsLoading(true);
            console.log('🔥 Starting Google Sign-In...');
            await promptAsync();
            console.log('✅ Google Sign-In completed');
        } catch (error: any) {
            console.error('❌ Google Sign-In error:', error);
            Alert.alert('Sign In Failed', 'Google Sign-In failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Missing Info', 'Please provide your email and password.');
            return;
        }
        if (!termsAccepted) {
            Alert.alert('Terms Required', 'Please accept the Terms and Conditions to proceed.');
            return;
        }
        setIsLoading(true);
        try {
            await signIn(email, password);
        } catch (error: any) {
            const expectedErrors = ['Invalid email', 'Incorrect password', 'No account found', 'Too many failed attempts'];
            if (expectedErrors.some(msg => error.message.includes(msg))) {
                console.warn('⚠️ Login warning:', error.message);
            } else {
                console.error('❌ Login error:', error);
            }
            let errorMessage = 'An error occurred during sign in.';
            if (error.message.includes('user-not-found')) {
                errorMessage = 'No account found with this email. Please check your email or sign up.';
            } else if (error.message.includes('wrong-password') || error.message.includes('invalid-credential')) {
                errorMessage = 'Incorrect password. Please try again.';
            } else if (error.message.includes('too-many-requests')) {
                errorMessage = 'Too many failed attempts. Please try again later.';
            } else if (error.message.includes('invalid-email')) {
                errorMessage = 'Please enter a valid email address.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            Alert.alert('Login Failed', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            Alert.alert('Email Required', 'Please enter your email address first.');
            return;
        }
        try {
            await resetPassword(email);
            Alert.alert('Password Reset', 'Password reset email sent. Please check your inbox.');
        } catch (error: any) {
            Alert.alert('Reset Failed', error.message || 'Failed to send password reset email.');
        }
    };

    return (
        <View className="flex-1 md:items-center md:justify-center" style={{ backgroundColor: background }}>
            <View className="flex-1 w-full md:max-w-md md:h-full md:shadow-2xl md:overflow-hidden" style={{ backgroundColor: background }}>
                <StatusBar barStyle="light-content" />
                {colors.gradientColors && (
                    <LinearGradient
                        colors={colors.gradientColors as any}
                        start={colors.gradientStart}
                        end={colors.gradientEnd}
                        className="absolute inset-0"
                    />
                )}

                <View
                    className="absolute w-[300px] h-[300px] rounded-full -top-[100px] -left-[48px]"
                    style={{ backgroundColor: primary + '26' }}
                />
                <View
                    className="absolute w-[300px] h-[300px] rounded-full -bottom-[100px] -right-[48px]"
                    style={{ backgroundColor: accent + '26' }}
                />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 justify-center px-8"
                    style={{ paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 20) }}
                >
                    <Animated.View
                        entering={FadeInDown.duration(800)}
                        className="items-center mb-12"
                    >
                        <View className="w-20 h-20 mb-5 justify-center items-center">
                            <LinearGradient
                                colors={[primary, accent]}
                                className="w-18 h-18 rounded-full justify-center items-center z-10"
                            >
                                <Ionicons name="shield-checkmark" size={40} color="#FFF" />
                            </LinearGradient>
                            <Animated.View
                                className="absolute w-20 h-20 rounded-full z-0"
                                style={[animatedGlow, { backgroundColor: primary + '4D' }]}
                            />
                        </View>
                        <Text className="text-3xl font-bold tracking-widest" style={{ color: textPrimary }}>CRASHCUE</Text>
                        <Text className="text-xs font-black tracking-widest mt-1.5" style={{ color: primary }}>SECURE ACCESS</Text>
                    </Animated.View>

                    <Animated.View
                        entering={FadeInUp.delay(200).duration(800)}
                        className="rounded-3xl p-6 border"
                        style={{
                            backgroundColor: backgroundCard,
                            borderColor: border,
                            // @ts-ignore
                            backdropFilter: Platform.OS === 'web' ? 'blur(20px)' : undefined,
                        }}
                    >
                        <View
                            className="flex-row items-center h-14 rounded-xl mb-4 px-4 border"
                            style={{ backgroundColor: background === '#ffffff' ? '#f3f4f6' : 'rgba(0, 0, 0, 0.3)', borderColor: border }}
                        >
                            <Ionicons name="mail-outline" size={20} color={primary} style={{ marginRight: 12 }} />
                            <TextInput
                                className="flex-1 text-base"
                                style={{ color: textPrimary }}
                                placeholder="Email Address"
                                placeholderTextColor={textSecondary}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View
                            className="flex-row items-center h-14 rounded-xl mb-4 px-4 border"
                            style={{ backgroundColor: background === '#ffffff' ? '#f3f4f6' : 'rgba(0, 0, 0, 0.3)', borderColor: border }}
                        >
                            <Ionicons name="lock-closed-outline" size={20} color={accent} style={{ marginRight: 12 }} />
                            <TextInput
                                className="flex-1 text-base"
                                style={{ color: textPrimary }}
                                placeholder="Password"
                                placeholderTextColor={textSecondary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>
                        <TouchableOpacity
                            className="mb-4"
                            onPress={handleForgotPassword}
                        >
                            <Text className="text-sm text-right" style={{ color: primary }}>
                                Forgot Password?
                            </Text>
                        </TouchableOpacity>

                        {/* Terms Checkbox */}
                        <TouchableOpacity
                            className="flex-row items-center mb-6 px-1 py-1"
                            onPress={() => setTermsAccepted(!termsAccepted)}
                        >
                            <Ionicons
                                name={termsAccepted ? "checkbox" : "square-outline"}
                                size={24}
                                color={termsAccepted ? accent : textSecondary}
                                style={{ marginRight: 12 }}
                            />
                            <View className="flex-1">
                                <Text style={{ color: textSecondary, fontSize: 13 }}>
                                    I agree to the <Text
                                        style={{ color: primary, fontWeight: 'bold' }}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            setShowTerms(true);
                                        }}
                                    >Terms and Conditions</Text>
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="h-14 rounded-xl mt-2.5 mb-6 overflow-hidden"
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={[primary, accent]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="flex-1 justify-center items-center"
                            >
                                {isLoading ? (
                                    <View className="flex-row items-center gap-2.5">
                                        <Text className="text-white text-base font-bold tracking-widest">Logging in...</Text>
                                    </View>
                                ) : (
                                    <Text className="text-white text-base font-bold tracking-widest">LOGIN</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Google Auth Button */}
                        <TouchableOpacity
                            className="h-14 w-full rounded-xl border justify-center items-center flex-row bg-white"
                            style={{ borderColor: border }}
                            onPress={handleGoogleSignIn}
                            disabled={isLoading}
                        >
                            <View className="flex-row items-center justify-center gap-3">
                                <Ionicons name="logo-google" size={20} color="#EA4335" />
                                <Text className="text-black text-base font-bold tracking-widest mt-0.5">
                                    {isLoading ? 'SIGNING IN...' : 'CONTINUE WITH GOOGLE'}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <View className="flex-row justify-center mt-6">
                            <Text className="text-sm" style={{ color: textSecondary }}>New User? </Text>
                            <TouchableOpacity onPress={() => router.push('/auth/signup')}>
                                <Text className="text-sm font-black" style={{ color: primary }}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </KeyboardAvoidingView>

                {/* Terms Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={showTerms}
                    onRequestClose={() => setShowTerms(false)}
                >
                    <View className="flex-1 justify-center items-center bg-black/80 p-5 pt-10">
                        <View
                            className="w-full h-full md:max-w-xl md:h-[90%] rounded-3xl overflow-hidden border"
                            style={{ backgroundColor: background === '#ffffff' ? '#ffffff' : '#1e1e1e', borderColor: border }}
                        >
                            <View
                                className="p-5 border-b flex-row justify-between items-center"
                                style={{ backgroundColor: background === '#ffffff' ? '#f9fafb' : '#27272a', borderBottomColor: border }}
                            >
                                <View>
                                    <Text className="font-black text-xl" style={{ color: textPrimary }}>CrashCue Terms</Text>
                                    <Text className="font-medium text-[10px] tracking-widest mt-1" style={{ color: primary }}>LEGAL AGREEMENT</Text>
                                </View>
                                <TouchableOpacity onPress={() => setShowTerms(false)} className="w-10 h-10 items-center justify-center rounded-full bg-slate-800/10">
                                    <Ionicons name="close" size={24} color={accent} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView 
                                className="flex-1 p-6" 
                                showsVerticalScrollIndicator={false}
                                onScroll={({ nativeEvent }) => {
                                    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                                    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
                                    if (isCloseToBottom && !hasScrolledToBottom) {
                                        setHasScrolledToBottom(true);
                                    }
                                }}
                                scrollEventThrottle={16}
                            >
                                {TERMS_SECTIONS.map((section, idx) => (
                                    <View key={idx} className="mb-6">
                                        <Text className="text-sm font-black mb-2 tracking-wide uppercase" style={{ color: primary }}>
                                            {section.title}
                                        </Text>
                                        <Text className="text-[13px] leading-5 font-medium" style={{ color: textSecondary }}>
                                            {section.content}
                                        </Text>
                                    </View>
                                ))}
                                <View className="h-10" />
                            </ScrollView>
                            <View className="p-5 border-t" style={{ backgroundColor: background === '#ffffff' ? '#f9fafb' : '#27272a', borderTopColor: border }}>
                                <TouchableOpacity
                                    className="py-4 items-center rounded-xl transition-all"
                                    style={{ backgroundColor: hasScrolledToBottom ? primary : '#9CA3AF', opacity: hasScrolledToBottom ? 1 : 0.6 }}
                                    disabled={!hasScrolledToBottom}
                                    onPress={() => {
                                        setTermsAccepted(true);
                                        setShowTerms(false);
                                    }}
                                >
                                    <Text className="text-white tracking-widest font-black">
                                       {hasScrolledToBottom ? 'I AGREE' : 'SCROLL TO READ'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </View>
    );
}