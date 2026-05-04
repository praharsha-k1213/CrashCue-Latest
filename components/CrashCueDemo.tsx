import React from 'react';
import { Alert, ScrollView } from 'react-native';
import { CrashCueCard } from './CrashCueCard';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

export function CrashCueDemo() {
  const handleCardPress = (title: string) => {
    Alert.alert('Card Pressed', `You tapped on: ${title}`);
  };

  return (
    <ThemedView className="flex-1">
      <ScrollView contentContainerStyle={{ paddingVertical: 20 }}>
        <ThemedText type="title" className="text-center mb-2 mx-4">
          CrashCue Demo
        </ThemedText>

        <ThemedText type="subtitle" className="text-center mb-6 mx-4 text-gray-500">
          Various card examples and variants
        </ThemedText>

        {/* Default Card */}
        <CrashCueCard
          title="Default Card"
          subtitle="Basic card with title and subtitle"
          description="This is a standard card component that follows the app's design system. It includes proper theming and responsive design."
          onPress={() => handleCardPress('Default Card')}
        />

        {/* Highlighted Card */}
        <CrashCueCard
          title="Highlighted Card"
          subtitle="Special attention needed"
          description="This card variant has a highlighted border and background to draw attention to important content."
          variant="highlighted"
          onPress={() => handleCardPress('Highlighted Card')}
        />

        {/* Compact Card */}
        <CrashCueCard
          title="Compact Card"
          subtitle="Space efficient"
          description="A more compact version for lists or when space is limited."
          variant="compact"
          onPress={() => handleCardPress('Compact Card')}
        />

        {/* Card with Image */}
        <CrashCueCard
          title="Card with Image"
          subtitle="Visual content included"
          description="This card includes an optional image that can be displayed above the text content."
          imageUrl="https://via.placeholder.com/400x200/0a7ea4/ffffff?text=CrashCue+Image"
          onPress={() => handleCardPress('Card with Image')}
        />

        {/* Minimal Card */}
        <CrashCueCard
          title="Minimal Card"
          onPress={() => handleCardPress('Minimal Card')}
        />

        {/* Non-interactive Card */}
        <CrashCueCard
          title="Read-only Card"
          subtitle="Information display only"
          description="This card doesn't have an onPress handler, so it's purely for displaying information."
        />
      </ScrollView>
    </ThemedView>
  );
}
