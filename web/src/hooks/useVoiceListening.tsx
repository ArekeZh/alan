import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type VoiceListeningContextValue = {
  isListening: boolean;
  setIsListening: (isListening: boolean) => void;
};

const VoiceListeningContext = createContext<VoiceListeningContextValue | null>(null);

export function VoiceListeningProvider({ children }: { children: ReactNode }) {
  const [isListening, setIsListening] = useState(false);
  const value = useMemo(
    () => ({ isListening, setIsListening }),
    [isListening],
  );

  return (
    <VoiceListeningContext.Provider value={value}>
      {children}
    </VoiceListeningContext.Provider>
  );
}

export function useVoiceListening() {
  const context = useContext(VoiceListeningContext);
  if (!context) {
    throw new Error('useVoiceListening must be used within VoiceListeningProvider');
  }
  return context;
}
