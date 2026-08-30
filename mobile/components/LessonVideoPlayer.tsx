import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import YoutubePlayer, { YoutubeIframeRef } from 'react-native-youtube-iframe';

import { colors, typography } from '../constants/theme';
import { LESSON_VIDEO_SEEK_SECONDS, parseYouTubeVideoId } from '../utils/youtube';

export type LessonVideoPlayerHandle = {
  seekBy: (seconds: number) => void;
};

type LessonVideoPlayerProps = {
  url: string;
  paused: boolean;
  title: string;
  rewindLabel: string;
  forwardLabel: string;
  onEnded: () => void;
};

const SEEK_BUTTON_WIDTH = 84;
const ROW_GAP = 8;

function clampSeek(current: number, delta: number, duration: number) {
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : Number.POSITIVE_INFINITY;
  return Math.min(Math.max(0, current + delta), Math.max(0, safeDuration - 0.25));
}

export const LessonVideoPlayer = forwardRef<LessonVideoPlayerHandle, LessonVideoPlayerProps>(
  function LessonVideoPlayer({ url, paused, title, rewindLabel, forwardLabel, onEnded }, ref) {
    const { width: windowWidth } = useWindowDimensions();
    const playerRef = useRef<YoutubeIframeRef | null>(null);
    const videoId = parseYouTubeVideoId(url);
    const playerWidth = Math.max(
      windowWidth - 48 - SEEK_BUTTON_WIDTH * 2 - ROW_GAP * 2,
      140,
    );
    const playerHeight = Math.round((playerWidth * 9) / 16);

    const webViewProps = useMemo(
      () => ({
        allowsInlineMediaPlayback: true,
        mediaPlaybackRequiresUserAction: false,
        androidLayerType: 'hardware' as const,
      }),
      [],
    );

    const seekBy = useCallback((delta: number) => {
      const player = playerRef.current;
      if (!player) {
        return;
      }

      void (async () => {
        const current = await player.getCurrentTime();
        const duration = await player.getDuration();
        player.seekTo(clampSeek(current, delta, duration), true);
      })();
    }, []);

    useImperativeHandle(ref, () => ({ seekBy }), [seekBy]);

    if (!videoId) {
      return null;
    }

    return (
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={rewindLabel}
          onPress={() => seekBy(-LESSON_VIDEO_SEEK_SECONDS)}
          style={({ pressed }) => [styles.seekButton, { height: playerHeight }, pressed && styles.pressed]}
        >
          <Text style={styles.seekLabel}>−{LESSON_VIDEO_SEEK_SECONDS}</Text>
        </Pressable>

        <View
          accessibilityLabel={title}
          accessibilityRole="none"
          style={[styles.frame, { height: playerHeight, width: playerWidth }]}
        >
          <YoutubePlayer
            ref={playerRef}
            height={playerHeight}
            width={playerWidth}
            play={!paused}
            videoId={videoId}
            forceAndroidAutoplay
            webViewProps={webViewProps}
            initialPlayerParams={{
              rel: false,
              modestbranding: true,
              preventFullScreen: true,
            }}
            onChangeState={(state: string) => {
              if (state === 'ended') {
                onEnded();
              }
            }}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={forwardLabel}
          onPress={() => seekBy(LESSON_VIDEO_SEEK_SECONDS)}
          style={({ pressed }) => [styles.seekButton, { height: playerHeight }, pressed && styles.pressed]}
        >
          <Text style={styles.seekLabel}>+{LESSON_VIDEO_SEEK_SECONDS}</Text>
        </Pressable>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: ROW_GAP,
    marginBottom: 16,
  },
  frame: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  seekButton: {
    width: SEEK_BUTTON_WIDTH,
    minWidth: SEEK_BUTTON_WIDTH,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekLabel: {
    color: '#FFFFFF',
    fontSize: typography.heading,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.85,
  },
});
