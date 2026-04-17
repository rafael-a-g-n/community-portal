import { useSiteSettings } from '../context/SiteSettingsContext';

export default function AboutPage() {
  const { localizedSettings } = useSiteSettings();

  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <h1 className="text-4xl font-bold mb-6">
        {localizedSettings?.about_title}
      </h1>
      <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-wrap">
        {localizedSettings?.about_body}
      </p>
    </div>
  );
}
