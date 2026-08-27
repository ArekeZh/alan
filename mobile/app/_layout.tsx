import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '../constants/theme';
import { LanguageProvider, useLanguage } from '../i18n/LanguageContext';
import { ProgressProvider } from '../hooks/useLessonProgress';
import { VoiceListeningProvider } from '../hooks/useVoiceListening';
import { ListeningMicBadge } from '../components/ListeningMicBadge';

function RootNavigator() {
  const { isReady } = useLanguage();

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      />
      <ListeningMicBadge />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ProgressProvider>
          <VoiceListeningProvider>
            <RootNavigator />
          </VoiceListeningProvider>
        </ProgressProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
