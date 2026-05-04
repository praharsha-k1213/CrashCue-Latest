import { useThemeColor } from '@/hooks/useThemeColor';
import { triggerStrongVibration } from '@/utils/hapticFeedback';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect } from 'react';
import { Dimensions, Platform, Text, TouchableOpacity, View } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 80;

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const primaryColor = useThemeColor({}, 'primary');
    const backgroundColor = '#FFFFFF';
    const inactiveColor = '#9CA3AF';
    const activeIconColor = '#EF4444';

    const tabWidth = width / 5;
    const highlightPosX = useSharedValue(state.index * tabWidth);

    useEffect(() => {
        highlightPosX.value = withSpring(state.index * tabWidth, { damping: 20, stiffness: 150 });
    }, [state.index]);

    const highlightStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: highlightPosX.value }],
    }));

    const onGestureEvent = (event: any) => {
        const { translationX, state: gestureState } = event.nativeEvent;
        if (gestureState === State.END) {
            if (translationX < -50 && state.index < state.routes.length - 1) {
                // Swipe Left -> Next Tab
                triggerStrongVibration(50);
                navigation.navigate(state.routes[state.index + 1].name);
            } else if (translationX > 50 && state.index > 0) {
                // Swipe Right -> Prev Tab
                triggerStrongVibration(50);
                navigation.navigate(state.routes[state.index - 1].name);
            }
        }
    };

    // Hide if not on Home screen
    const currentRoute = state.routes[state.index];
    if (currentRoute.name !== 'index') return null;

    return (
        <PanGestureHandler onHandlerStateChange={onGestureEvent}>
            <View className="absolute bottom-0 w-full md:max-w-md md:mx-auto left-0 right-0 bg-transparent" style={{ height: TAB_BAR_HEIGHT + 10 }}>
                {/* Curved Background SVG */}
                <View className="absolute bottom-0 w-full">
                    <Svg width={width} height={TAB_BAR_HEIGHT + 20} viewBox={`0 0 ${width} ${TAB_BAR_HEIGHT + 20}`}>
                        <Path
                            d={`M0,20 Q${width / 2},-10 ${width},20 L${width},${TAB_BAR_HEIGHT + 20} L0,${TAB_BAR_HEIGHT + 20} Z`}
                            fill={backgroundColor}
                            stroke="#F3F4F6"
                            strokeWidth="0.5"
                        />
                    </Svg>
                </View>

                {/* Animated Highlight */}
                <Animated.View
                    className="absolute h-1 rounded-sm"
                    style={[
                        { bottom: Platform.OS === 'ios' ? 20 : 0, width: tabWidth, backgroundColor: activeIconColor },
                        highlightStyle
                    ]}
                />

                <View className="flex-row items-center justify-around h-[80px]" style={{ paddingBottom: Platform.OS === 'ios' ? 20 : 10 }}>
                    {state.routes.map((route, index) => {
                        const { options } = descriptors[route.key];
                        const label =
                            options.tabBarLabel !== undefined
                                ? options.tabBarLabel
                                : options.title !== undefined
                                    ? options.title
                                    : route.name;

                        const isFocused = state.index === index;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                triggerStrongVibration(80);
                                navigation.navigate(route.name);
                            }
                        };

                        // Get icon based on route name matching app pages
                        let iconName: any = 'help-circle-outline';
                        if (route.name === 'crashcue') iconName = 'shield-checkmark-outline';
                        if (route.name === 'index') iconName = 'apps'; // The "Home" abcd icon
                        if (route.name === 'history') iconName = 'time-outline';
                        if (route.name === 'settings') iconName = 'settings-outline';

                        if (route.name === 'index') {
                            return (
                                <TouchableOpacity
                                    key={route.key}
                                    activeOpacity={0.8}
                                    onPress={onPress}
                                    className="flex-1 items-center justify-center -mt-8"
                                >
                                    <View
                                        className="w-14 h-14 rounded-full items-center justify-center shadow-lg border-2 border-white mb-2"
                                        style={{
                                            backgroundColor: activeIconColor,
                                            shadowColor: '#EF4444',
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.3,
                                            shadowRadius: 6,
                                            elevation: 8,
                                        }}
                                    >
                                        <Ionicons name={iconName} size={28} color="#FFFFFF" />
                                    </View>
                                    <Text className="text-xs font-bold" style={{ color: activeIconColor }}>Home</Text>
                                </TouchableOpacity>
                            );
                        }

                        return (
                            <TouchableOpacity
                                key={route.key}
                                activeOpacity={0.7}
                                onPress={onPress}
                                className="flex-1 items-center justify-center gap-1 mt-4"
                            >
                                <Ionicons
                                    name={iconName}
                                    size={24}
                                    color={isFocused ? primaryColor : inactiveColor}
                                />
                                <Text className="text-[11px] font-medium" style={{ color: isFocused ? primaryColor : inactiveColor }}>
                                    {label as string}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </PanGestureHandler>
    );
}
