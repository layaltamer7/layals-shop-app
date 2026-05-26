import { SafeAreaView, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';

import { useSettings } from '../providers/SettingsProvider';

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
};

export function Screen({ children, scroll = true, contentStyle }: ScreenProps) {
  const { palette } = useSettings();

  if (scroll) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { backgroundColor: palette.background },
            contentStyle,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <View style={[styles.fill, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  fill: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
});
