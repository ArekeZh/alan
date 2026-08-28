import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ListeningMicBadge } from '../components/ListeningMicBadge';
import { TalkBar } from '../components/TalkBar';
import { colors } from '../constants/theme';
import { VoiceAssistantProvider } from '../hooks/VoiceAssistantContext';
import { ProgressProvider } from '../hooks/useLessonProgress';
import { VoiceListeningProvider } from '../hooks/useVoiceListening';
import { LanguageProvider, useLanguage } from '../i18n/LanguageContext';

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
    <VoiceAssistantProvider>
      <View style={styles.root}>
        <StatusBar style="dark" />
        <View style={styles.screens}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'slide_from_right',
            }}
          />
          <ListeningMicBadge />
        </View>
        <TalkBar />
      </View>
    </VoiceAssistantProvider>
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
  screens: {
    flex: 4,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
