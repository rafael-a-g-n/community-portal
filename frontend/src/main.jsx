import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import './index.css';
import './i18n';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <SiteSettingsProvider>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </SiteSettingsProvider>
    </ThemeProvider>
  </StrictMode>,
);
