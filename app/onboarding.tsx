import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
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
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
export default function OnboardingScreen() {
    const router = useRouter();
    const { completeOnboarding, user } = useAuth();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [bloodGroup, setBloodGroup] = useState('');
    const [medicalRecords, setMedicalRecords] = useState('');
    const [medicalCondition, setMedicalCondition] = useState('');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { colors } = useTheme();
    const textPrimary = useThemeColor({}, 'textPrimary') as string;
    const textSecondary = useThemeColor({}, 'textSecondary') as string;
    const primary = colors.primary as string;
    const accent = colors.accent as string;
    const background = useThemeColor({}, 'background') as string;
    const border = useThemeColor({}, 'border') as string;
    const insets = useSafeAreaInsets();
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const handleCompleteOnboarding = async () => {
        if (
            !firstName ||
            !lastName ||
            !age ||
            !gender ||
            !bloodGroup ||
            !medicalRecords ||
            !medicalCondition
        ) {
            Alert.alert('Missing Information', 'Please fill all required fields.');
            return;
        }
        setIsLoading(true);
        try {
            const onboardingData = {
                firstName,
                lastName,
                age,
                gender,
                bloodGroup,
                medicalRecords,
                medicalCondition,
                phone: phone.trim() || undefined
            };
            await completeOnboarding(onboardingData);
            Alert.alert(
                'Welcome to CrashCue!',
                'Your profile has been completed successfully.',
                [
                    {
                        text: 'Continue',
                        onPress: () => router.replace('/(tabs)')
                    }
                ]
            );
        } catch (error: any) {
            console.error('❌ Onboarding error:', error);
            Alert.alert('Error', error.message || 'Failed to complete onboarding. Please try again.');
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
        required = true
    ) => (
        <View
            className="flex-row items-center h-14 rounded-xl mb-4 px-4 border"
            style={{ backgroundColor: background === '#ffffff' ? '#f3f4f6' : 'rgba(0, 0, 0, 0.3)', borderColor: focusedInput === keyName ? primary : border }}
        >
            <Ionicons name={icon} size={20} color={primary} style={{ marginRight: 12 }} />
            <TextInput
                className="flex-1 text-base"
                style={{ color: textPrimary }}
                placeholder={placeholder + (required ? ' *' : '')}
                placeholderTextColor={textSecondary}
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                onFocus={() => setFocusedInput(keyName)}
                onBlur={() => setFocusedInput(null)}
            />
        </View>
    );
    return (
        <View className="flex-1" style={{ backgroundColor: background }}>
            <StatusBar barStyle="light-content" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 100), paddingHorizontal: 32, paddingTop: Math.max(insets.top + 20, 48) }}
                >
                    <Animated.View entering={FadeInDown.duration(700)} className="items-center mb-8">
                        <Text className="text-3xl font-bold" style={{ color: textPrimary }}>
                            COMPLETE YOUR PROFILE
                        </Text>
                        <Text className="text-sm mt-2 text-center" style={{ color: textSecondary }}>
                            Welcome {user?.displayName}! Please provide your medical information for emergency situations.
                        </Text>
                    </Animated.View>
                    {renderInput('person-outline', 'First Name', firstName, setFirstName, 'firstName')}
                    {renderInput('person-outline', 'Last Name', lastName, setLastName, 'lastName')}
                    {renderInput('call-outline', 'Phone Number', phone, setPhone, 'phone', 'phone-pad', false)}
                    {renderInput('calendar-outline', 'Age', age, setAge, 'age', 'number-pad')}
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
                            <Picker.Item label="Select Gender *" value="" />
                            {genderOptions.map((g) => (
                                <Picker.Item key={g} label={g} value={g} />
                            ))}
                        </Picker>
                    </View>
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
                            <Picker.Item label="Select Blood Group *" value="" />
                            {bloodGroups.map((bg) => (
                                <Picker.Item key={bg} label={bg} value={bg} />
                            ))}
                        </Picker>
                    </View>
                    {renderInput('document-text-outline', 'Medical Records', medicalRecords, setMedicalRecords, 'medicalRecords')}
                    {renderInput('medkit-outline', 'Medical Condition', medicalCondition, setMedicalCondition, 'medicalCondition')}
                    <TouchableOpacity
                        className="h-14 rounded-xl mt-4"
                        onPress={handleCompleteOnboarding}
                        disabled={isLoading}
                    >
                        <LinearGradient
                            colors={[accent, primary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="flex-1 justify-center items-center rounded-xl"
                        >
                            <Text className="text-white font-bold text-base">
                                {isLoading ? 'Completing Profile...' : 'COMPLETE PROFILE'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <View className="mt-6 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
                        <Text className="text-yellow-400 text-sm text-center">
                            This information is crucial for emergency responders and will be securely stored.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}