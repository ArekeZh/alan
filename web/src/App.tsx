import { BrowserRouter, Route, Routes } from 'react-router';

import { ListeningMicBadge } from './components/ListeningMicBadge';
import { StartOverlay } from './components/StartOverlay';
import { AuthProvider, ProgressSyncProvider } from './hooks/AuthContext';
import { ContentProvider } from './hooks/ContentContext';
import { VoiceAssistantProvider } from './hooks/VoiceAssistantContext';
import { useHoverSpeech } from './hooks/useHoverSpeech';
import { ProgressProvider } from './hooks/useLessonProgress';
import { VoiceListeningProvider } from './hooks/useVoiceListening';
import { LanguageProvider } from './i18n/LanguageContext';
import { HomePage } from './pages/HomePage';
import { LessonPage } from './pages/LessonPage';
import { ModulePage } from './pages/ModulePage';
import { SectionPage } from './pages/SectionPage';

function HoverSpeechListener() {
  useHoverSpeech();
  return null;
}

function AppShell() {
  return (
    <VoiceAssistantProvider>
      <HoverSpeechListener />
      <div className="app">
        <StartOverlay />
        <ListeningMicBadge />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/module/:id" element={<ModulePage />} />
          <Route path="/section/:id" element={<SectionPage />} />
          <Route path="/lesson/:id" element={<LessonPage />} />
        </Routes>
      </div>
    </VoiceAssistantProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <ProgressSyncProvider>
            <ContentProvider>
              <ProgressProvider>
                <VoiceListeningProvider>
                  <AppShell />
                </VoiceListeningProvider>
              </ProgressProvider>
            </ContentProvider>
          </ProgressSyncProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
