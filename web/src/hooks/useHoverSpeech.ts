import { useEffect, useRef } from 'react';

import { useLanguage } from '../i18n/LanguageContext';
import { cancelRecording, stopBrowserRecognition } from '../services/audioSession';
import { speakHover, stopHoverSpeech } from '../utils/speech';
import { useVoiceAssistantState } from './VoiceAssistantContext';

const HOVER_DELAY_MS = 320;
const SPEAKABLE =
  'button, a[href], [role="button"], [role="radio"], [data-hover-speak]';

function normalizeText(value: string | null | undefined) {
  return value?.replace(/\s+/g, ' ').trim() ?? '';
}

function getSpeakableLabel(element: HTMLElement) {
  const ariaLabel = normalizeText(element.getAttribute('aria-label'));
  const visibleText = normalizeText(element.innerText);
  return ariaLabel || visibleText;
}

function isAssistantBusy(status: string) {
  return status === 'speaking' || status === 'listening' || status === 'thinking';
}

export function useHoverSpeech() {
  const { language } = useLanguage();
  const { status, audioUnlocked } = useVoiceAssistantState();
  const languageRef = useRef(language);
  const statusRef = useRef(status);

  languageRef.current = language;
  statusRef.current = status;

  useEffect(() => {
    if (isAssistantBusy(status)) {
      stopHoverSpeech();
    }
  }, [status]);

  useEffect(() => {
    if (!audioUnlocked) {
      return;
    }

    let hoverTimer: number | null = null;
    let currentControl: HTMLElement | null = null;

    const clearTimer = () => {
      if (hoverTimer === null) {
        return;
      }

      window.clearTimeout(hoverTimer);
      hoverTimer = null;
    };

    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType === 'touch') {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const control = target.closest(SPEAKABLE);
      if (!(control instanceof HTMLElement) || control === currentControl) {
        return;
      }

      currentControl = control;
      clearTimer();

      hoverTimer = window.setTimeout(() => {
        if (isAssistantBusy(statusRef.current)) {
          return;
        }

        const label = getSpeakableLabel(control);
        if (label) {
          cancelRecording();
          stopBrowserRecognition();
          speakHover(label, languageRef.current);
        }
      }, HOVER_DELAY_MS);
    };

    const onPointerOut = (event: PointerEvent) => {
      if (event.pointerType === 'touch') {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const control = target.closest(SPEAKABLE);
      if (!(control instanceof HTMLElement) || currentControl !== control) {
        return;
      }

      const related = event.relatedTarget;
      const stillInside = related instanceof Node && control.contains(related);
      if (stillInside) {
        return;
      }

      currentControl = null;
      clearTimer();
      stopHoverSpeech();
    };

    document.addEventListener('pointerover', onPointerOver);
    document.addEventListener('pointerout', onPointerOut);

    return () => {
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerout', onPointerOut);
      clearTimer();
      stopHoverSpeech();
    };
  }, [audioUnlocked]);
}
