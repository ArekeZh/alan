import { BrowserRouter, Route, Routes } from 'react-router';

import { ListeningMicBadge } from './components/ListeningMicBadge';
import { StartOverlay } from './components/StartOverlay';
import { VoiceAssistantProvider } from './hooks/VoiceAssistantContext';
import { ProgressProvider } from './hooks/useLessonProgress';
import { VoiceListeningProvider } from './hooks/useVoiceListening';
import { LanguageProvider } from './i18n/LanguageContext';
import { HomePage } from './pages/HomePage';
import { LessonPage } from './pages/LessonPage';
import { ModulePage } from './pages/ModulePage';
import { SectionPage } from './pages/SectionPage';

function AppShell() {
  return (
    <VoiceAssistantProvider>
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
        <ProgressProvider>
          <VoiceListeningProvider>
            <AppShell />
          </VoiceListeningProvider>
        </ProgressProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
