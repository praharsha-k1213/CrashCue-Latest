import React from 'react';
import { Text, View } from 'react-native';

export const MapView = ({ children, style }: any) => (
    <View className="bg-[#1A1A1A] justify-center items-center rounded-xl border border-white/10" style={style}>
        <Text className="text-white/50 text-sm font-bold">[ Map Interface Offline on Web ]</Text>
        {children}
    </View>
);

export const Marker = ({ children }: any) => <View>{children}</View>;
export const Polyline = () => null;
export const PROVIDER_GOOGLE = 'google';

export default MapView;
