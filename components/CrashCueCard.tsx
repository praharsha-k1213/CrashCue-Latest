import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';

export interface CrashCueCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  onPress?: () => void;
  variant?: 'default' | 'highlighted' | 'compact';
}

export function CrashCueCard({
  title,
  subtitle,
  description,
  imageUrl,
  onPress,
  variant = 'default',
}: CrashCueCardProps) {
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const containerClasses = [
    "rounded-xl border p-4 my-2 mx-4 shadow-sm",
    variant === 'highlighted' ? "border-2 border-[#0a7ea4] bg-[#f0f8ff]" : "",
    variant === 'compact' ? "p-3 my-1" : ""
  ].join(" ");

  const content = (
    <View
      className={containerClasses}
      style={{
        backgroundColor: variant === 'highlighted' ? '#f0f8ff' : cardBackground,
        borderColor: variant === 'highlighted' ? '#0a7ea4' : borderColor
      }}
    >
      {imageUrl && (
        <Image source={{ uri: imageUrl }} className="w-full h-50 rounded-lg mb-3" resizeMode="cover" />
      )}

      <View className="gap-2">
        <Text className="text-lg font-bold mb-1" style={{ color: textColor }}>
          {title}
        </Text>

        {subtitle && (
          <Text className="font-semibold text-[#687076]">
            {subtitle}
          </Text>
        )}

        {description && (
          <Text className="leading-5" style={{ color: textColor }}>
            {description}
          </Text>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}
