import { useThemeColor } from '@/hooks/useThemeColor';
import { triggerHaptic, triggerSuccessVibration } from '@/utils/hapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import * as IntentLauncher from 'expo-intent-launcher';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Linking, PermissionsAndroid, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useLocalStore } from '../store/LocalStore';
import { useAuth } from '../context/AuthContext';
import { useSpeedHistory } from '../context/SpeedHistoryContext';

// Define a simple type for the Firebase User to avoid lint errors
interface FirebaseUser {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    uid: string;
}

export default function User() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { family, setFamily, doctor, setDoctor, userProfile, setUserProfile, userNumbers, setUserNumbers } = useLocalStore();
    const { currentSpeed: speed, crashDetected: crashed } = useSpeedHistory();
    const { user, userProfile: firebaseProfile, signOut, isLoading } = useAuth();

    React.useEffect(() => {
        if (user && firebaseProfile) {
            setUserProfile({
                name: firebaseProfile.displayName || user.displayName || 'User',
                phone: firebaseProfile.phone || '',
                photoURL: user.photoURL
            });
        }
    }, [user, firebaseProfile]);

    const primary = useThemeColor({}, 'primary');
    const background = useThemeColor({}, 'background');
    const backgroundHeader = useThemeColor({}, 'backgroundHeader');
    const backgroundCard = useThemeColor({}, 'backgroundCard');
    const text = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const border = useThemeColor({}, 'border');
    const error = useThemeColor({}, 'error');
    // const [phone, setPhone] = useState(''); // REMOVED (Fetched from DB)
    const [doctorNameInput, setDoctorNameInput] = useState('');
    const [doctorPhoneInput, setDoctorPhoneInput] = useState('');

    // User Numbers State
    const [nameInput, setNameInput] = useState('');
    const [numberInput, setNumberInput] = useState('');

    // Local state for user profile editing
    const [myPhone, setMyPhone] = useState(userProfile?.phone || '');
    const [myName, setMyName] = useState(userProfile?.name || '');

    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    // Sync state when store loads
    React.useEffect(() => {
        if (userProfile) {
            setMyName(userProfile.name || '');
            setMyPhone(userProfile.phone || '');
        }
    }, [userProfile]);

    const saveMyProfile = () => {
        if (!myPhone.trim() || !myName.trim()) {
            Alert.alert("Error", "Please enter your name and phone number.");
            return;
        }
        setUserProfile({ name: myName, phone: myPhone });
        Alert.alert("Success", "Driver profile saved successfully!");
    };

    const removeMember = (id: string) => {
        setFamily(family.filter((member: { id: string; name: string; relation: string }) => member.id !== id));
    };

    const addNumber = () => {
        if (!nameInput.trim()) {
            Alert.alert('Error', 'Please enter a contact name.');
            return;
        }
        const cleaned = numberInput.replace(/[\s\-\(\)]/g, '');
        if (!cleaned || !/^[+0-9]{7,15}$/.test(cleaned)) {
            Alert.alert('Error', 'Please enter a valid phone number.');
            return;
        }
        setUserNumbers([...userNumbers, { name: nameInput.trim(), phone: cleaned }]);
        setNameInput('');
        setNumberInput('');
        Alert.alert('Success', `${nameInput.trim()} added to emergency contacts!`);
    };

    const removeNumber = (index: number) => {
        setUserNumbers(userNumbers.filter((_: { name: string; phone: string }, i: number) => i !== index));
    };

    const handleCallMember = async (phoneNumber: string) => {
        if (!phoneNumber) return;
        const cleaned = phoneNumber.replace(/[^+\d]/g, '');
        const telUrl = `tel:${cleaned}`;
        try {
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CALL_PHONE,
                    {
                        title: "Phone Call Permission",
                        message: "CrashCue needs access to make phone calls directly.",
                        buttonNeutral: "Ask Me Later",
                        buttonNegative: "Cancel",
                        buttonPositive: "OK"
                    }
                );
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    await Linking.openURL(telUrl);
                    return;
                }
                const activityAction = 'android.intent.action.CALL';
                await IntentLauncher.startActivityAsync(activityAction, {
                    data: telUrl,
                });
                return;
            }
            await Linking.openURL(telUrl);
        } catch (error) {
            Alert.alert("Error", "Could not initiate call.");
        }
    };

    // Always use 👤 icon
    const getRelationIcon = (_relation: string) => '👤';

    return (
        <View className="flex-1" style={{ backgroundColor: background }}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={[background, backgroundHeader, background]} className="absolute inset-0" />

            {/* Header */}
            <View
                className="flex-row items-center px-5 pb-6 border-b"
                style={{ paddingTop: Math.max(insets.top + 10, 60), borderBottomColor: border, backgroundColor: backgroundHeader }}
            >
                <TouchableOpacity
                    onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
                    className="p-2 mr-3"
                >
                    <Ionicons name="chevron-back" size={24} color={primary} />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-base font-black tracking-widest" style={{ color: text }}>Driver Profile</Text>
                    <Text className="text-xs tracking-wide mt-1" style={{ color: textSecondary }}>Manage authorized personnel and emergency protocols</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 24, paddingHorizontal: 20 }}>

                {/* Driver Info Setup Card */}
                <Animated.View entering={FadeInDown.delay(100).duration(600)} className="mb-8">
                    <Text className="text-xs font-black tracking-widest mb-2" style={{ color: primary }}>My Profile</Text>

                    {user ? (
                        <View
                            className="rounded-3xl p-6 border shadow-sm items-center"
                            style={{
                                borderColor: border,
                                shadowColor: primary,
                                backgroundColor: backgroundCard,
                            }}
                        >
                            <View className="mb-4 shadow-lg shadow-black/20">
                                {user.photoURL ? (
                                    <Image
                                        source={{ uri: user.photoURL }}
                                        style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: primary }}
                                    />
                                ) : (
                                    <View className="w-20 h-20 rounded-full bg-indigo-100 items-center justify-center border-2" style={{ borderColor: primary }}>
                                        <Text className="text-3xl">👤</Text>
                                    </View>
                                )}
                            </View>
                            <Text className="text-xl font-black mb-1" style={{ color: text }}>{user.displayName || firebaseProfile?.displayName}</Text>
                            <Text className="text-sm font-medium mb-6 opacity-60" style={{ color: textSecondary }}>{user.email}</Text>

                            <TouchableOpacity
                                className="py-3 px-8 rounded-xl items-center shadow-lg border bg-red-50"
                                style={{ borderColor: '#FFCDD2' }}
                                onPress={async () => {
                                    await triggerHaptic('medium');
                                    try {
                                        await signOut();
                                        Alert.alert('Success', 'You have been signed out successfully.');
                                        router.replace('/auth/login');
                                    } catch (error: any) {
                                        Alert.alert('Error', 'Failed to sign out. Please try again.');
                                    }
                                }}
                            >
                                <Text className="text-red-500 font-bold text-base tracking-wide">Sign Out</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View
                            className="rounded-3xl p-6 border shadow-sm"
                            style={{
                                borderColor: border,
                                shadowColor: primary,
                                backgroundColor: backgroundCard,
                            }}
                        >
                            <View className="items-center mb-6">
                                <Text className="text-center text-sm font-medium leading-6 mb-4" style={{ color: textSecondary }}>
                                    Sign in to access your profile and emergency contacts.
                                </Text>
                                <TouchableOpacity
                                    className="py-4 px-6 rounded-xl items-center flex-row justify-center gap-3 shadow-lg w-full"
                                    style={{ backgroundColor: primary, shadowColor: primary, elevation: 2 }}
                                    onPress={() => router.push('/auth/login')}
                                    disabled={isLoading}
                                >
                                    <Ionicons name="log-in-outline" size={24} color="#000" />
                                    <Text className="text-black font-bold text-base tracking-wide">
                                        Sign In
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View className="flex-row items-center mb-6">
                                <View className="flex-1 h-[1px] bg-gray-200" />
                                <Text className="mx-4 text-xs font-bold text-gray-400">OR EDIT MANUALLY</Text>
                                <View className="flex-1 h-[1px] bg-gray-200" />
                            </View>

                            <View className="mb-5">
                                <Text className="text-xs font-black tracking-wide mb-2" style={{ color: textSecondary }}>Your Phone</Text>
                                <TextInput
                                    placeholder="Enter phone (e.g., +91...)"
                                    placeholderTextColor={textSecondary}
                                    value={myPhone}
                                    onChangeText={setMyPhone}
                                    keyboardType="phone-pad"
                                    className="rounded-xl p-4 border text-sm"
                                    style={{
                                        color: text,
                                        backgroundColor: background,
                                        borderColor: focusedInput === 'myPhone' ? primary : border
                                    }}
                                    onFocus={() => setFocusedInput('myPhone')}
                                    onBlur={() => setFocusedInput(null)}
                                />
                            </View>
                            <View className="mb-5">
                                <Text className="text-xs font-black tracking-wide mb-2" style={{ color: textSecondary }}>Your Name</Text>
                                <TextInput
                                    placeholder="Enter full name"
                                    placeholderTextColor={textSecondary}
                                    value={myName}
                                    onChangeText={setMyName}
                                    className="rounded-xl p-4 border text-sm"
                                    style={{
                                        color: text,
                                        backgroundColor: background,
                                        borderColor: focusedInput === 'myName' ? primary : border
                                    }}
                                    onFocus={() => setFocusedInput('myName')}
                                    onBlur={() => setFocusedInput(null)}
                                />
                            </View>
                            <TouchableOpacity
                                className="py-4 rounded-xl items-center shadow-lg"
                                style={{ backgroundColor: primary, shadowColor: primary }}
                                onPress={async () => {
                                    await triggerSuccessVibration();
                                    saveMyProfile();
                                }}
                            >
                                <Text className="text-black font-black text-base tracking-widest">Save Profile</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </Animated.View>

                {/* Speed Monitor Card */}
                <View
                    className="rounded-3xl p-6 border mb-6 shadow-sm"
                    style={{
                        borderColor: border,
                        backgroundColor: backgroundCard,
                        shadowColor: primary
                    }}
                >
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-[10px] font-black tracking-widest" style={{ color: textSecondary }}>Current Speed</Text>
                        {crashed && (
                            <View className="px-3 py-1.5 rounded-xl shadow-md" style={{ backgroundColor: error, shadowColor: error }}>
                                <Text className="text-black text-[10px] font-black">🚨 CRASH</Text>
                            </View>
                        )}
                    </View>
                    <View className="flex-row items-baseline mb-5 justify-center">
                        <Text
                            className="text-6xl font-bold shadow-sm"
                            style={{
                                color: text,
                                fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                                textShadowColor: primary,
                                textShadowRadius: 12
                            }}
                        >
                            {speed.toFixed(0)}
                        </Text>
                        <Text className="text-2xl ml-2" style={{ color: textSecondary }}>km/h</Text>
                    </View>
                    <View className="h-1.5 rounded-full overflow-hidden mt-2 bg-white/5">
                        <View
                            className="h-full rounded-full shadow-sm"
                            style={{
                                width: `${Math.min(speed, 120) / 120 * 100}%`,
                                backgroundColor: primary,
                                shadowColor: primary
                            }}
                        />
                    </View>
                </View>

                {/* Family Members Section */}
                <View className="mb-8">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-xs font-black tracking-widest" style={{ color: primary }}>Emergency Contacts</Text>
                        <View className="px-2 py-1 rounded-full items-center justify-center" style={{ backgroundColor: primary }}>
                            <Text className="text-black font-black text-xs">{family.length}/6</Text>
                        </View>
                    </View>

                    {family.length === 0 ? (
                        <Animated.View entering={FadeInUp} className="border p-8 rounded-3xl items-center justify-center bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                            <Text className="text-6xl mb-4">👥</Text>
                            <Text className="text-lg font-bold mb-2" style={{ color: text }}>No Contacts Added</Text>
                            <Text className="text-sm opacity-70 text-center" style={{ color: textSecondary }}>
                                Assign family members to your emergency protocol.
                            </Text>
                        </Animated.View>
                    ) : (
                        <View className="gap-4">
                            {family.map((item: any, index: number) => (
                                <Animated.View
                                    key={item.id}
                                    entering={FadeInDown.delay(index * 100).duration(600)}
                                    className="flex-row items-center rounded-2xl p-4 border shadow-sm"
                                    style={{
                                        borderColor: border,
                                        shadowColor: primary,
                                        backgroundColor: backgroundCard,
                                    }}
                                >
                                    <View
                                        className="w-14 h-14 rounded-full items-center justify-center mr-4 border-2 bg-white/5"
                                        style={{ borderColor: primary }}
                                    >
                                        <Text className="text-2xl">{getRelationIcon(item.relation)}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-lg font-bold" style={{ color: text }}>{item.name}</Text>
                                        <Text className="text-xs font-black mt-1" style={{ color: primary }}>{item.relation.toUpperCase()}</Text>
                                        <Text className="text-sm mt-1 opacity-80" style={{ color: textSecondary }}>📞 {item.phone || 'N/A'}</Text>
                                    </View>
                                    <TouchableOpacity
                                        className="w-10 h-10 rounded-full items-center justify-center border ml-2 bg-green-500/10"
                                        style={{ borderColor: '#10B981' }}
                                        onPress={async () => {
                                            await triggerHaptic('medium');
                                            handleCallMember(item.phone);
                                        }}
                                    >
                                        <Ionicons name="call" size={20} color="#10B981" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        className="w-10 h-10 rounded-full items-center justify-center border ml-2 bg-red-500/10"
                                        style={{ borderColor: '#f87171' }}
                                        onPress={async () => {
                                            await triggerHaptic('medium');
                                            removeMember(item.id);
                                        }}
                                    >
                                        <Ionicons name="close" size={24} color="#f87171" />
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Family Doctor Section */}
                <Animated.View entering={FadeInDown.delay(400).duration(600)} className="mb-8">
                    <Text className="text-xs font-black tracking-widest mb-4" style={{ color: primary }}>Family Doctor</Text>

                    {doctor?.name && doctor?.phone ? (
                        <View
                            className="flex-row items-center rounded-2xl p-4 border shadow-sm"
                            style={{
                                borderColor: border,
                                shadowColor: primary,
                                backgroundColor: backgroundCard,
                            }}
                        >
                            <View
                                className="w-14 h-14 rounded-full items-center justify-center mr-4 border-2 bg-white/5"
                                style={{ borderColor: primary }}
                            >
                                <Text className="text-2xl">👨‍⚕️</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-lg font-bold" style={{ color: text }}>{doctor.name}</Text>
                                <Text className="text-sm mt-1 opacity-80" style={{ color: textSecondary }}>📞 {doctor.phone}</Text>
                            </View>
                            <TouchableOpacity
                                className="w-10 h-10 rounded-full items-center justify-center border ml-2 bg-green-500/10"
                                style={{ borderColor: '#10B981' }}
                                onPress={async () => {
                                    await triggerHaptic('medium');
                                    handleCallMember(doctor.phone);
                                }}
                            >
                                <Ionicons name="call" size={20} color="#10B981" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="w-10 h-10 rounded-full items-center justify-center border ml-2 bg-red-500/10"
                                style={{ borderColor: '#f87171' }}
                                onPress={() => setDoctor({ name: '', phone: '' })}
                            >
                                <Ionicons name="close" size={24} color="#f87171" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View
                            className="rounded-3xl p-6 border shadow-sm"
                            style={{
                                borderColor: border,
                                shadowColor: primary,
                                backgroundColor: backgroundCard,
                            }}
                        >
                            <View className="mb-5">
                                <Text className="text-xs font-black tracking-wide mb-2" style={{ color: textSecondary }}>Doctor Name</Text>
                                <TextInput
                                    placeholder="Doctor's name"
                                    placeholderTextColor={textSecondary}
                                    value={doctorNameInput}
                                    onChangeText={setDoctorNameInput}
                                    onFocus={() => setFocusedInput('doctorName')}
                                    onBlur={() => setFocusedInput(null)}
                                    className="rounded-xl p-4 border text-base"
                                    style={{
                                        color: text,
                                        backgroundColor: background,
                                        borderColor: focusedInput === 'doctorName' ? primary : border
                                    }}
                                />
                            </View>
                            <View className="mb-5">
                                <Text className="text-xs font-black tracking-wide mb-2" style={{ color: textSecondary }}>Doctor Phone</Text>
                                <TextInput
                                    placeholder="Emergency hotline"
                                    placeholderTextColor={textSecondary}
                                    value={doctorPhoneInput}
                                    onChangeText={setDoctorPhoneInput}
                                    onFocus={() => setFocusedInput('doctorPhone')}
                                    onBlur={() => setFocusedInput(null)}
                                    keyboardType="phone-pad"
                                    className="rounded-xl p-4 border text-base"
                                    style={{
                                        color: text,
                                        backgroundColor: background,
                                        borderColor: focusedInput === 'doctorPhone' ? primary : border
                                    }}
                                />
                            </View>
                            <TouchableOpacity
                                className="py-4 rounded-xl items-center flex-row justify-center gap-2 shadow-lg"
                                style={[
                                    { backgroundColor: primary, shadowColor: primary },
                                    (!doctorNameInput.trim() || !doctorPhoneInput.trim()) && { backgroundColor: 'rgba(255,255,255,0.1)', shadowOpacity: 0 }
                                ]}
                                onPress={async () => {
                                    await triggerSuccessVibration();
                                    setDoctor({ name: doctorNameInput.trim(), phone: doctorPhoneInput.trim() });
                                    setDoctorNameInput('');
                                    setDoctorPhoneInput('');
                                    Alert.alert("Success", "Family doctor saved successfully!");
                                }}
                                disabled={!doctorNameInput.trim() || !doctorPhoneInput.trim()}
                            >
                                <Ionicons name="medical" size={20} color="#000" />
                                <Text className="text-black text-lg font-black tracking-widest">Add Doctor</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </Animated.View>

                {/* Info Card */}
                <View
                    className="mt-3 p-4 border rounded-2xl shadow-sm"
                    style={{
                        borderColor: primary,
                        shadowColor: primary,
                        backgroundColor: backgroundCard
                    }}
                >
                    <View className="flex-row items-center mb-2">
                        <Text className="text-base mr-2">💡</Text>
                        <Text className="text-base" style={{ color: text }}>Emergency Contact Info</Text>
                    </View>
                    <Text className="text-sm leading-6" style={{ color: textSecondary }}>
                        These contacts will be automatically notified with your location if a crash is detected or if you trigger a panic alert.
                    </Text>
                </View>

                {/* User Numbers Section */}
                <Animated.View entering={FadeInDown.delay(500).duration(600)} className="mt-8 mb-8">
                    <Text className="text-xs font-black tracking-widest mb-4" style={{ color: primary }}>My Numbers</Text>

                    {/* Display Numbers */}
                    {userNumbers.length > 0 && (
                        <View className="mb-4 gap-3">
                            {userNumbers.map((contact: { name: string; phone: string }, index: number) => (
                                <Animated.View
                                    key={index}
                                    entering={FadeInDown.delay(index * 50).duration(400)}
                                    className="flex-row items-center rounded-2xl p-4 border shadow-sm"
                                    style={{
                                        borderColor: border,
                                        shadowColor: primary,
                                        backgroundColor: backgroundCard,
                                    }}
                                >
                                    <View
                                        className="w-12 h-12 rounded-full items-center justify-center mr-4 border-2 bg-white/5"
                                        style={{ borderColor: primary }}
                                    >
                                        <Ionicons name="person" size={22} color={primary} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-base font-bold" style={{ color: text }}>{contact.name}</Text>
                                        <Text className="text-sm mt-0.5" style={{ color: textSecondary }}>📞 {contact.phone}</Text>
                                    </View>
                                    <TouchableOpacity
                                        className="w-10 h-10 rounded-full items-center justify-center border mr-2 bg-green-500/10"
                                        style={{ borderColor: '#10B981' }}
                                        onPress={async () => {
                                            await triggerHaptic('medium');
                                            handleCallMember(contact.phone);
                                        }}
                                    >
                                        <Ionicons name="call" size={18} color="#10B981" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        className="w-10 h-10 rounded-full items-center justify-center border bg-red-500/10"
                                        style={{ borderColor: '#f87171' }}
                                        onPress={async () => {
                                            await triggerHaptic('medium');
                                            removeNumber(index);
                                        }}
                                    >
                                        <Ionicons name="trash" size={18} color="#f87171" />
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}
                        </View>
                    )}

                    {/* Add Contact Form */}
                    <View
                        className="rounded-3xl p-6 border shadow-sm"
                        style={{
                            borderColor: border,
                            shadowColor: primary,
                            backgroundColor: backgroundCard,
                        }}
                    >
                        <Text className="text-xs font-black tracking-widest mb-5" style={{ color: textSecondary }}>ADD EMERGENCY CONTACT</Text>

                        <View className="mb-4">
                            <Text className="text-xs font-black tracking-wide mb-2" style={{ color: textSecondary }}>Contact Name</Text>
                            <TextInput
                                placeholder="e.g., Mom, Brother, Friend..."
                                placeholderTextColor={textSecondary}
                                value={nameInput}
                                onChangeText={setNameInput}
                                onFocus={() => setFocusedInput('nameInput')}
                                onBlur={() => setFocusedInput(null)}
                                className="rounded-xl p-4 border text-base"
                                style={{
                                    color: text,
                                    backgroundColor: background,
                                    borderColor: focusedInput === 'nameInput' ? primary : border
                                }}
                            />
                        </View>

                        <View className="mb-5">
                            <Text className="text-xs font-black tracking-wide mb-2" style={{ color: textSecondary }}>Phone Number</Text>
                            <TextInput
                                placeholder="e.g., +91 98765 43210"
                                placeholderTextColor={textSecondary}
                                value={numberInput}
                                onChangeText={setNumberInput}
                                onFocus={() => setFocusedInput('numberInput')}
                                onBlur={() => setFocusedInput(null)}
                                keyboardType="phone-pad"
                                className="rounded-xl p-4 border text-base"
                                style={{
                                    color: text,
                                    backgroundColor: background,
                                    borderColor: focusedInput === 'numberInput' ? primary : border
                                }}
                            />
                            <Text className="text-[10px] mt-1 opacity-60" style={{ color: textSecondary }}>
                                This contact will be alerted via call, SMS and WhatsApp during a crash.
                            </Text>
                        </View>

                        <TouchableOpacity
                            className="py-4 rounded-xl items-center flex-row justify-center gap-2 shadow-lg"
                            style={[
                                { backgroundColor: primary, shadowColor: primary },
                                (!nameInput.trim() || !numberInput.trim()) && { backgroundColor: 'rgba(255,255,255,0.1)', shadowOpacity: 0 }
                            ]}
                            onPress={async () => {
                                await triggerSuccessVibration();
                                addNumber();
                            }}
                            disabled={!nameInput.trim() || !numberInput.trim()}
                        >
                            <Ionicons name="person-add" size={20} color="#000" />
                            <Text className="text-black text-lg font-black tracking-widest">Add Contact</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                <View className="h-10" />
            </ScrollView>
        </View >
    );
}