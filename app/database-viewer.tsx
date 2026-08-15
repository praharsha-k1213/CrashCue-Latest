import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';

// Local User Database Service
// We use require to avoid potential circular dependency issues during initialization if any, 
// though standard import should work. Keeping consistent with previous steps.

export default function DatabaseViewer() {
    const router = useRouter();
    const { theme } = useTheme();
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Theme colors
    const primary = useThemeColor({}, 'primary');
    const accent = useThemeColor({}, 'accent');
    const background = useThemeColor({}, 'background');
    const backgroundHeader = useThemeColor({}, 'backgroundHeader');
    const backgroundCard = useThemeColor({}, 'backgroundCard');
    const border = useThemeColor({}, 'border');
    const textPrimary = useThemeColor({}, 'textPrimary');
    const textSecondary = useThemeColor({}, 'textSecondary');

    const fetchUsers = async () => {
        try {
            const { UserDatabase } = require('../services/UserDatabase');
            const localUsers = await UserDatabase.getAllUsers();
            // Map to conform to list expectations if needed, but UserProfile is fine
            setUsers(localUsers);
        } catch (error) {
            console.log('Error fetching local users:', error);
            setUsers([]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchUsers();
    }, []);

    const renderUserItem = ({ item }: { item: any }) => (
        <View
            className="rounded-2xl p-4 mb-3 border"
            style={{ backgroundColor: backgroundCard, borderColor: border }}
        >
            <View className="flex-row items-center">
                <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: primary + '1A' }}
                >
                    <Ionicons name="person" size={20} color={primary} />
                </View>
                <View className="flex-1">
                    <Text className="text-base font-bold" style={{ color: textPrimary }}>{item.name || item.firstName}</Text>
                    <Text className="text-xs" style={{ color: textSecondary }}>{item.email}</Text>
                    {item.uniqueCode ? (
                        <Text className="text-[10px] mt-1 font-black" style={{ color: primary }}>CODE: {item.uniqueCode}</Text>
                    ) : null}
                </View>
                <View
                    className="px-2.5 py-1 rounded-lg"
                    style={{ backgroundColor: textSecondary + '0D' }}
                >
                    <Text className="text-[10px] font-bold" style={{ color: textSecondary + '66' }}>{item.bloodGroup}</Text>
                </View>
            </View>
            <View
                className="flex-row items-center mt-3 pt-3 border-t gap-1.5"
                style={{ borderTopColor: border }}
            >
                <Ionicons name="medical-outline" size={14} color={textSecondary + '66'} />
                <Text className="text-[10px]" style={{ color: textSecondary + '66' }}>Condition: {item.medicalCondition || 'None'}</Text>
            </View>
        </View>
    );

    return (
        <View className="flex-1" style={{ backgroundColor: background }}>
            <LinearGradient colors={[backgroundHeader, background, '#000']} className="absolute inset-0" />

            <View
                className="flex-row items-center justify-between pt-15 px-5 pb-5 border-b"
                style={{ borderBottomColor: border, backgroundColor: backgroundHeader }}
            >
                <TouchableOpacity
                    onPress={() => router.replace('/(tabs)')}
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: primary + '1A' }}
                >
                    <Ionicons name="arrow-back" size={24} color={primary} />
                </TouchableOpacity>
                <Text className="text-xl font-bold tracking-widest" style={{ color: textPrimary }}>Central Database</Text>
                <View className="w-10" />
            </View>

            <View className="flex-row px-5 gap-4 mb-5">
                <View
                    className="flex-1 rounded-2xl p-4 border"
                    style={{ backgroundColor: backgroundCard, borderColor: border }}
                >
                    <Text className="text-xs mb-1.5" style={{ color: textSecondary }}>Total Users</Text>
                    <Text className="text-xl font-bold" style={{ color: primary }}>{users.length}</Text>
                </View>
                <View
                    className="flex-1 rounded-2xl p-4 border"
                    style={{ backgroundColor: backgroundCard, borderColor: border }}
                >
                    <Text className="text-xs mb-1.5" style={{ color: textSecondary }}>Storage Mode</Text>
                    <Text className="text-xl font-bold" style={{ color: accent }}>Local DB</Text>
                </View>
            </View>

            {isLoading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={primary} />
                    <Text className="mt-4 text-base tracking-widest" style={{ color: primary + '99' }}>Accessing Neural Core...</Text>
                </View>
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderUserItem}
                    keyExtractor={(item, index) => item.email || index.toString()}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />
                    }
                    ListEmptyComponent={() => (
                        <View className="items-center mt-25 opacity-50">
                            <Ionicons name="server-outline" size={60} color={textSecondary + '1A'} />
                            <Text className="mt-5 text-base" style={{ color: textPrimary }}>No user records discovered.</Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
}
