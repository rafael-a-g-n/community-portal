import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { getSettings } from '../services/settingsService';
import { useTranslation } from 'react-i18next';

// Default values to fallback to if the API call fails or before it loads.
const defaultSettings = {
  site_name: "Community Portal",
  site_tagline: "Report issues in your community",
  navbar_brand_text: "Community Portal",
  navbar_cta_text: "New Report",
  hero_title: "Make Your Community Better",
  hero_subtitle: "Help us improve your neighborhood. Report issues, track progress, and stay informed about local improvements.",
  hero_cta_text: "Submit a Report",
  empty_state_title: "No reports found",
  empty_state_body: "Be the first to report an issue in your area.",
  about_title: "About Community Portal",
  about_body: "Community Portal is a community-driven platform designed to bridge the gap between citizens and local authorities. By providing a transparent and easy-to-use interface for reporting infrastructure, safety, and environmental issues, we empower residents to take an active role in improving their neighborhoods.",
  footer_copyright_text: "",
  detail_official_response_label: "Official Response",
  detail_support_title: "Need Help?",
  detail_support_body: "If you have more information about this issue, please contact our community support team."
};

const SiteSettingsContext = createContext({
  settings: defaultSettings,
  loading: true,
  error: null,
  refreshSettings: async () => {} 
});

export function SiteSettingsProvider({ children }) {
  const { i18n } = useTranslation();
  const [rawSettings, setRawSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setRawSettings(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch site settings:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Compute localized settings based on the current language
  const localizedSettings = useMemo(() => {
    if (i18n.language === 'pt') {
      const ptSettings = { ...rawSettings };
      // Map all _pt fields to their base names
      Object.keys(rawSettings).forEach(key => {
        if (key.endsWith('_pt')) {
          const baseKey = key.slice(0, -3);
          // Only override if the Portuguese field has content
          if (rawSettings[key]) {
            ptSettings[baseKey] = rawSettings[key];
          }
        }
      });
      return ptSettings;
    }
    return rawSettings;
  }, [rawSettings, i18n.language]);

  return (
    <SiteSettingsContext.Provider value={{ settings: rawSettings, localizedSettings, loading, error, refreshSettings: fetchSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
