import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { TERMS_SECTIONS } from '../../constants/Terms';

export default function SignupScreen() {
    const router = useRouter();
    const { signUp } = useAuth(); // Move this to the top level

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [bloodGroup, setBloodGroup] = useState('');
    const [medicalRecords, setMedicalRecords] = useState('');
    const [medicalCondition, setMedicalCondition] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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
    const backgroundHeader = useThemeColor({}, 'backgroundHeader') as string;
    const border = useThemeColor({}, 'border') as string;
    const insets = useSafeAreaInsets();

    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    const handleSignup = async () => {
        if (
            !firstName ||
            !lastName ||
            !email ||
            !age ||
            !gender ||
            !bloodGroup ||
            !medicalRecords ||
            !medicalCondition ||
            !password ||
            !confirmPassword
        ) {
            Alert.alert('Missing Data', 'Please fill all fields.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Password Mismatch', 'Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
            return;
        }

        if (!termsAccepted) {
            Alert.alert('Terms Required', 'Please accept the Terms and Conditions to proceed.');
            return;
        }

        setIsLoading(true);
        try {
            const fullName = `${firstName.trim()} ${lastName.trim()}`;

            // Use Firebase authentication and Firestore
            await signUp(email.trim(), password, fullName, {
                firstName,
                lastName,
                age,
                gender,
                bloodGroup,
                medicalRecords,
                medicalCondition,
                phone: '' // Can be added later
            });

            // Clear form
            setFirstName('');
            setLastName('');
            setEmail('');
            setAge('');
            setGender('');
            setBloodGroup('');
            setMedicalRecords('');
            setMedicalCondition('');
            setPassword('');
            setConfirmPassword('');
            setTermsAccepted(false);

            // Navigate smoothly to login without dialog interruption
            router.replace('/auth/login');
        } catch (error: any) {
            console.error('❌ Signup error:', error);

            // Handle specific error cases
            let errorMessage = 'Could not create account. Please try again.';

            if (error.message.includes('email already exists') || error.message.includes('email-already-in-use')) {
                errorMessage = 'An account with this email already exists. Please use a different email or try logging in.';
            } else if (error.message.includes('weak-password')) {
                errorMessage = 'Password is too weak. Please use at least 6 characters.';
            } else if (error.message.includes('invalid-email')) {
                errorMessage = 'Please enter a valid email address.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            Alert.alert('Signup Failed', errorMessage);
            // Don't navigate - stay on signup screen to fix the issue
        } finally {
            setIsLoading(false);
        }
    };

    const renderInput = (
        icon: any,
        placeholder: string,
        value: string,
        onChangeText: (v: string) => void,
        keyName: string,
        keyboardType: any = 'default',
        secure = false
    ) => (
        <View
            className="flex-row items-center h-14 rounded-xl mb-4 px-4 border"
            style={{ backgroundColor: background === '#ffffff' ? '#f3f4f6' : 'rgba(0, 0, 0, 0.3)', borderColor: focusedInput === keyName ? primary : border }}
        >
            <Ionicons name={icon} size={20} color={primary} style={{ marginRight: 12 }} />
            <TextInput
                className="flex-1 text-base"
                style={{ color: textPrimary }}
                placeholder={placeholder}
                placeholderTextColor={textSecondary}
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                secureTextEntry={secure}
                onFocus={() => setFocusedInput(keyName)}
                onBlur={() => setFocusedInput(null)}
            />
        </View>
    );

    return (
        <View className="flex-1 md:items-center md:justify-center" style={{ backgroundColor: background }}>
            <View className="flex-1 w-full md:max-w-xl md:h-full md:shadow-2xl md:overflow-hidden" style={{ backgroundColor: background }}>
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
                    className="flex-1"
                >
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 100), paddingHorizontal: 32, paddingTop: Math.max(insets.top + 20, 48) }}
                    >
                        <Animated.View entering={FadeInDown.duration(700)} className="items-center mb-10 pt-4">
                            <TouchableOpacity className="absolute left-0 top-5" onPress={() => router.back()}>
                                <Ionicons name="chevron-back" size={24} color={primary} />
                            </TouchableOpacity>
                            <Text className="text-3xl font-black tracking-widest mt-4" style={{ color: textPrimary }}>
                                CRASHCUE
                            </Text>
                            <Text className="text-xs font-black tracking-widest mt-1.5" style={{ color: primary }}>
                                CREATE ACCOUNT
                            </Text>
                        </Animated.View>

                        <View 
                            className="rounded-3xl p-6 border mb-8"
                            style={{ 
                                backgroundColor: backgroundCard, 
                                borderColor: border,
                                // @ts-ignore
                                backdropFilter: Platform.OS === 'web' ? 'blur(20px)' : undefined, 
                            }}
                        >
                            {renderInput('person-outline', 'First Name', firstName, setFirstName, 'firstName')}
                            {renderInput('person-outline', 'Last Name', lastName, setLastName, 'lastName')}
                            {renderInput('mail-outline', 'Email Address', email, setEmail, 'email', 'email-address')}
                            {renderInput('calendar-outline', 'Age', age, setAge, 'age', 'number-pad')}

                            {/* Gender Dropdown */}
                            <View
                                className="h-14 rounded-xl mb-4 px-4 border justify-center"
                                style={{ backgroundColor: background === '#ffffff' ? '#f3f4f6' : 'rgba(0, 0, 0, 0.3)', borderColor: focusedInput === 'gender' ? accent : border }}
                            >
                                <Picker
                                    selectedValue={gender}
                                    onValueChange={(value) => setGender(value)}
                                    dropdownIconColor={accent}
                                    style={{ color: textPrimary }}
                                >
                                    <Picker.Item label="Select Gender" value="" />
                                    {genderOptions.map((g) => (
                                        <Picker.Item key={g} label={g} value={g} />
                                    ))}
                                </Picker>
                            </View>

                            {/* Blood Group Dropdown */}
                            <View
                                className="h-14 rounded-xl mb-4 px-4 border justify-center"
                                style={{ backgroundColor: background === '#ffffff' ? '#f3f4f6' : 'rgba(0, 0, 0, 0.3)', borderColor: focusedInput === 'bloodGroup' ? accent : border }}
                            >
                                <Picker
                                    selectedValue={bloodGroup}
                                    onValueChange={(value) => setBloodGroup(value)}
                                    dropdownIconColor={accent}
                                    style={{ color: textPrimary }}
                                >
                                    <Picker.Item label="Select Blood Group" value="" />
                                    {bloodGroups.map((bg) => (
                                        <Picker.Item key={bg} label={bg} value={bg} />
                                    ))}
                                </Picker>
                            </View>

                            {renderInput('document-text-outline', 'Medical Records', medicalRecords, setMedicalRecords, 'medicalRecords')}
                            {renderInput('medkit-outline', 'Medical Condition', medicalCondition, setMedicalCondition, 'medicalCondition')}
                            {renderInput('lock-closed-outline', 'Password', password, setPassword, 'password', 'default', true)}
                            {renderInput('shield-checkmark-outline', 'Confirm Password', confirmPassword, setConfirmPassword, 'confirmPassword', 'default', true)}

                            {/* Terms Checkbox */}
                            <TouchableOpacity
                                className="flex-row items-center mb-4 px-2 py-2"
                                onPress={() => setTermsAccepted(!termsAccepted)}
                            >
                                <Ionicons
                                    name={termsAccepted ? "checkbox" : "square-outline"}
                                    size={24}
                                    color={termsAccepted ? accent : textSecondary}
                                    style={{ marginRight: 12 }}
                                />
                                <View className="flex-1">
                                    <Text style={{ color: textSecondary }}>
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

                            <TouchableOpacity className="h-14 rounded-xl mt-4 border border-transparent overflow-hidden" onPress={handleSignup} disabled={isLoading}>
                                <LinearGradient
                                    colors={[primary, accent]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="flex-1 justify-center items-center"
                                >
                                    <Text className="text-white font-bold tracking-widest text-base">
                                        {isLoading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row justify-center pb-8 border-t border-transparent">
                            <Text style={{ color: textSecondary }}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => router.push('/auth/login')}>
                                <Text style={{ color: primary, fontWeight: 'bold' }}>Log In</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
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
