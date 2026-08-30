import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { LESSON_VIDEO_SEEK_SECONDS, parseYouTubeVideoId } from '../utils/youtube';

export type LessonVideoPlayerHandle = {
  seekBy: (seconds: number) => void;
};

type LessonVideoPlayerProps = {
  url: string;
  paused: boolean;
  title: string;
  playLabel: string;
  rewindLabel: string;
  forwardLabel: string;
  onEnded: () => void;
};

const YOUTUBE_API_SRC = 'https://www.youtube.com/iframe_api';

function loadYouTubeIframeApi() {
  if (window.YT?.Player) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve();
    };

    const alreadyLoading = document.querySelector(`script[src="${YOUTUBE_API_SRC}"]`);
    if (alreadyLoading) {
      return;
    }

    const tag = document.createElement('script');
    tag.src = YOUTUBE_API_SRC;
    document.head.appendChild(tag);
  });
}

function clampSeek(current: number, delta: number, duration: number) {
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : Number.POSITIVE_INFINITY;
  return Math.min(Math.max(0, current + delta), Math.max(0, safeDuration - 0.25));
}

export const LessonVideoPlayer = forwardRef<LessonVideoPlayerHandle, LessonVideoPlayerProps>(
  function LessonVideoPlayer(
    { url, paused, title, playLabel, rewindLabel, forwardLabel, onEnded },
    ref,
  ) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const playerRef = useRef<YT.Player | null>(null);
    const pausedRef = useRef(paused);
    const onEndedRef = useRef(onEnded);
    const [hasStarted, setHasStarted] = useState(false);
    const [isReady, setIsReady] = useState(false);

    const videoId = parseYouTubeVideoId(url);

    pausedRef.current = paused;
    onEndedRef.current = onEnded;

    const seekBy = (delta: number) => {
      const player = playerRef.current;
      if (!player) {
        return;
      }

      const current = player.getCurrentTime() || 0;
      const duration = player.getDuration() || 0;
      player.seekTo(clampSeek(current, delta, duration), true);
    };

    useImperativeHandle(ref, () => ({ seekBy }));

    useEffect(() => {
      if (!videoId || !hostRef.current) {
        return;
      }

      let cancelled = false;

      void (async () => {
        await loadYouTubeIframeApi();
        if (cancelled || !hostRef.current || !window.YT?.Player) {
          return;
        }

        playerRef.current = new window.YT.Player(hostRef.current, {
          width: '100%',
          height: '100%',
          videoId,
          playerVars: {
            autoplay: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            origin: window.location.origin,
            fs: 0,
          },
          events: {
            onReady: (event) => {
              if (cancelled) {
                return;
              }

              setIsReady(true);
              if (pausedRef.current) {
                event.target.pauseVideo();
                return;
              }

              event.target.playVideo();
            },
            onStateChange: (event) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setHasStarted(true);
              }

              if (event.data === window.YT.PlayerState.ENDED) {
                onEndedRef.current();
              }
            },
          },
        });
      })();

      return () => {
        cancelled = true;
        setIsReady(false);
        setHasStarted(false);
        playerRef.current?.destroy();
        playerRef.current = null;
      };
    }, [videoId]);

    useEffect(() => {
      const player = playerRef.current;
      if (!player || !isReady) {
        return;
      }

      if (paused) {
        player.pauseVideo();
        return;
      }

      player.playVideo();
    }, [isReady, paused]);

    if (!videoId) {
      return null;
    }

    return (
      <div className="lesson-video-row">
        <button
          type="button"
          className="lesson-seek-button"
          aria-label={rewindLabel}
          onClick={() => seekBy(-LESSON_VIDEO_SEEK_SECONDS)}
        >
          −{LESSON_VIDEO_SEEK_SECONDS}
        </button>

        <div className="lesson-video" aria-label={title}>
          <div className="lesson-video-host">
            <div ref={hostRef} />
          </div>
          <div className="lesson-video-overlay">
            {!hasStarted ? (
              <button
                type="button"
                className="lesson-video-play"
                onClick={() => playerRef.current?.playVideo()}
                aria-label={playLabel}
              >
                {playLabel}
              </button>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          className="lesson-seek-button"
          aria-label={forwardLabel}
          onClick={() => seekBy(LESSON_VIDEO_SEEK_SECONDS)}
        >
          +{LESSON_VIDEO_SEEK_SECONDS}
        </button>
      </div>
    );
  },
);
