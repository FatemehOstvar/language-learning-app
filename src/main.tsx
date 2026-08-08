import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguagePreferencesProvider } from '@/features/settings/context/LanguagePreferencesContext';
import { TutorialProvider } from '@/features/tutorial/context/TutorialContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguagePreferencesProvider>
      <TutorialProvider>
        <App />
      </TutorialProvider>
    </LanguagePreferencesProvider>
  </StrictMode>
);
