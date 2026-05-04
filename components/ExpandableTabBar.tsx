import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export function ExpandableTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const primaryColor = useThemeColor({}, 'primary');
    const border = useThemeColor({}, 'border');

    // Animation Intermediates
    const rotation = useSharedValue(0);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
        rotation.value = withSpring(isOpen ? 0 : 45); // Rotate icon 45deg when open
    };

    const animatedIconStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }]
    }));

    // Hide if not on Home screen
    const currentRoute = state.routes[state.index];
    if (currentRoute.name !== 'index') return null;

    return (
        <View className="absolute bottom-0 w-full md:max-w-md md:mx-auto left-0 right-0 h-[100px] pointer-events-box-none items-end justify-end px-6 pb-8" pointerEvents="box-none">

            {/* Expanded Menu Items */}
            {isOpen && (
                <View className="absolute bottom-24 right-6 items-end gap-4">
                    {state.routes.map((route, index) => {
                        const { options } = descriptors[route.key];
                        const isFocused = state.index === index;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                            toggleMenu(); // Close after selection
                        };

                        // Icon Mapping
                        let iconName: any = 'help-circle-outline';
                        if (route.name === 'crashcue') iconName = 'shield-checkmark';
                        if (route.name === 'index') iconName = 'home';
                        if (route.name === 'history') iconName = 'time';
                        if (route.name === 'settings') iconName = 'settings';

                        // Fill icons for focus state
                        if (!isFocused) {
                            iconName = iconName + '-outline';
                        }
                        // Special case for 'home-outline' -> no such thing in Ionicons v5 sometimes, use 'home'/'home-outline'
                        if (route.name === 'index' && !isFocused) iconName = 'home-outline';


                        const label = options.title || route.name;

                        // Staggered Animation - Bottom items appear first
                        const delay = (state.routes.length - 1 - index) * 60;

                        return (
                            <Animated.View
                                key={route.key}
                                entering={FadeInDown.delay(delay).springify().damping(15).stiffness(200)}
                                exiting={FadeOutDown.delay(index * 50)}
                                className="flex-row items-center gap-4"
                            >
                                {/* Label Bubble */}
                                <View className="bg-white/90 dark:bg-slate-800/90 px-4 py-2 rounded-2xl shadow-sm shadow-black/10">
                                    <Text className={`text-xs font-bold capitalize ${isFocused ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                        {label === 'index' ? 'Home' : label}
                                    </Text>
                                </View>

                                {/* Icon Bubble */}
                                <TouchableOpacity
                                    onPress={onPress}
                                    activeOpacity={0.7}
                                    className={`w-14 h-14 rounded-full items-center justify-center shadow-lg ${isFocused ? 'shadow-indigo-500/40' : 'shadow-black/10'}`}
                                >
                                    {isFocused ? (
                                        <LinearGradient
                                            colors={['#6366F1', '#4F46E5']} // Indigo Gradient
                                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 9999 }}
                                        />
                                    ) : (
                                        <BlurView intensity={30} tint="light" className="absolute inset-0 rounded-full bg-white/80 dark:bg-slate-900/80 border border-white/40" />
                                    )}

                                    <Ionicons
                                        name={iconName}
                                        size={24}
                                        color={isFocused ? '#FFF' : primaryColor}
                                    />
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })}
                </View>
            )}

            {/* Trigger Button (FAB) */}
            <TouchableOpacity
                onPress={toggleMenu}
                activeOpacity={0.9}
                className="shadow-2xl shadow-indigo-500/50 elevation-10"
            >
                <Animated.View
                    style={[{ width: 64, height: 64, borderRadius: 24, overflow: 'hidden' }, animatedIconStyle]}
                >
                    <LinearGradient
                        colors={['#4F46E5', '#8B5CF6']} // Indigo to Purple
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
                    >
                        <Ionicons name={isOpen ? "close" : "grid-outline"} size={28} color="#FFF" />
                    </LinearGradient>
                </Animated.View>
            </TouchableOpacity>

        </View>
    );
}
