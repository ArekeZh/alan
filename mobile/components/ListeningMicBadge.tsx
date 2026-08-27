import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useVoiceListening } from '../hooks/useVoiceListening';
import { useLanguage } from '../i18n/LanguageContext';

export function ListeningMicBadge() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { isListening } = useVoiceListening();
  const appear = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(appear, {
      toValue: isListening ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [appear, isListening]);

  useEffect(() => {
    if (!isListening) {
      pulse.stopAnimation();
      pulse.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [isListening, pulse]);

  const translateY = appear.interpolate({
    inputRange: [0, 1],
    outputRange: [-18, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden={!isListening}
      importantForAccessibility={isListening ? 'yes' : 'no-hide-descendants'}
      style={[
        styles.wrap,
        {
          top: insets.top + 8,
          opacity: appear,
          transform: [{ translateY }, { scale: pulse }],
        },
      ]}
    >
      {isListening ? (
        <View
          accessible
          accessibilityRole="image"
          accessibilityLiveRegion="polite"
          accessibilityLabel={t('voice.micOn')}
          style={styles.badge}
        >
          <Ionicons name="mic" size={28} color="#FFFFFF" />
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 16,
    zIndex: 50,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#166534',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
});
