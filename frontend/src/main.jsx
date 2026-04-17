import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import './index.css';
import './i18n';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SiteSettingsProvider>
      <App />
    </SiteSettingsProvider>
  </StrictMode>,
);
