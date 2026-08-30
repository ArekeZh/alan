/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_YANDEX_FOLDER_ID: string;
  readonly VITE_YANDEX_API_KEY: string;
  readonly VITE_GROQ_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
  YT: typeof YT;
  onYouTubeIframeAPIReady?: () => void;
}

declare namespace YT {
  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }

  type PlayerEventMap = {
    onReady: (event: { target: Player }) => void;
    onStateChange: (event: { data: PlayerState; target: Player }) => void;
  };

  type PlayerVars = {
    autoplay?: 0 | 1;
    rel?: 0 | 1;
    modestbranding?: 0 | 1;
    playsinline?: 0 | 1;
    origin?: string;
    fs?: 0 | 1;
  };

  class Player {
    constructor(
      element: string | HTMLElement,
      options: {
        width?: string | number;
        height?: string | number;
        videoId: string;
        playerVars?: PlayerVars;
        events?: Partial<PlayerEventMap>;
      },
    );
    playVideo(): void;
    pauseVideo(): void;
    destroy(): void;
    getCurrentTime(): number;
    getDuration(): number;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
  }
}
