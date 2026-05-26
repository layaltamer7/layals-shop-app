import { StyleSheet, Text, View } from 'react-native';

import { useSettings } from '../providers/SettingsProvider';

type BannerProps = {
  title: string;
  tone?: 'info' | 'warning' | 'success';
};

export function Banner({ title, tone = 'info' }: BannerProps) {
  const { palette } = useSettings();
  const accent = tone === 'warning' ? palette.secondary : tone === 'success' ? palette.success : palette.primary;

  return (
    <View style={[styles.banner, { backgroundColor: palette.banner, borderColor: accent }]}>
      <Text style={[styles.text, { color: palette.text }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
