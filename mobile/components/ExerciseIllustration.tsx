import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

type ExerciseIllustrationProps = {
  code: string | null;
  label: string;
};

export function ExerciseIllustration({ code, label }: ExerciseIllustrationProps) {
  const html = useMemo(() => {
    if (!code) {
      return '';
    }

    return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: transparent;
        overflow: hidden;
      }
      svg {
        display: block;
        width: 100%;
        height: auto;
      }
    </style>
  </head>
  <body>${code}</body>
</html>`;
  }, [code]);

  if (!code) {
    return null;
  }

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        scrollEnabled={false}
        style={styles.webview}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 112,
    marginBottom: 16,
  },
  webview: {
    flex: 1,
    minHeight: 112,
    backgroundColor: 'transparent',
  },
});
