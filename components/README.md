# CrashCue Components

This directory contains React Native components for the CrashCue app, following the established design system and theming patterns.

## Components

### CrashCueCard

A flexible card component that can display various types of content with different variants.

#### Props

- `title` (string, required): The main title of the card
- `subtitle` (string, optional): A subtitle below the main title
- `description` (string, optional): Detailed description text
- `imageUrl` (string, optional): URL for an optional image above the content
- `onPress` (function, optional): Callback function when the card is tapped
- `variant` ('default' | 'highlighted' | 'compact', optional): Visual variant of the card

#### Variants

- **default**: Standard card with normal padding and styling
- **highlighted**: Card with highlighted border and background for important content
- **compact**: Smaller padding for space-efficient layouts

#### Usage Examples

```tsx
import { CrashCueCard } from '@/components';

// Basic card
<CrashCueCard
  title="Card Title"
  subtitle="Card Subtitle"
  description="Card description text"
/>

// Interactive card
<CrashCueCard
  title="Tappable Card"
  onPress={() => console.log('Card tapped!')}
/>

// Highlighted card
<CrashCueCard
  title="Important Card"
  variant="highlighted"
  description="This card draws attention"
/>

// Card with image
<CrashCueCard
  title="Image Card"
  imageUrl="https://example.com/image.jpg"
  description="Card with an image"
/>
```

### CrashCueDemo

A demo screen component that showcases all the different variants and use cases of the CrashCueCard component.

#### Usage

```tsx
import { CrashCueDemo } from '@/components';

// Use in your navigation or as a standalone screen
<CrashCueDemo />
```

## Design System

The components follow the app's established design patterns:

- **Theming**: Uses `useThemeColor` hook for consistent light/dark mode support
- **Typography**: Leverages `ThemedText` component with predefined text styles
- **Layout**: Uses `ThemedView` for consistent background colors
- **Colors**: Follows the color scheme defined in `constants/Colors.ts`
- **Spacing**: Consistent margins, padding, and border radius values
- **Shadows**: Subtle shadows for depth (iOS) and elevation (Android)

## Styling

Components use StyleSheet for performance and maintainability. Key styling features:

- Responsive design with flexible layouts
- Consistent spacing using 8px grid system
- Proper shadow and elevation for cross-platform compatibility
- Border radius and padding that follows modern design principles
- Color schemes that adapt to light/dark themes

## Accessibility

- Touch targets meet minimum size requirements
- Proper contrast ratios for text readability
- Touch feedback with `activeOpacity` for interactive elements
- Semantic structure with proper text hierarchy
