import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Share2, Link, Check } from 'lucide-react';
import { cn } from '../lib/utils';

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const PLATFORMS = {
  twitter: { label: 'X', color: 'hover:bg-black hover:text-white', icon: XIcon },
  facebook: { label: 'Facebook', color: 'hover:bg-[#1877F2] hover:text-white', icon: FacebookIcon },
  whatsapp: { label: 'WhatsApp', color: 'hover:bg-[#25D366] hover:text-white', icon: Share2 },
};

function shareUrl(platform, url, title) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  switch (platform) {
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case 'whatsapp':
      return `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
    default:
      return url;
  }
}

export default function ShareButtons({ title, description, photo, url }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <>
      <Helmet>
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        {photo && <meta property="og:image" content={photo} />}
        <meta property="og:type" content="article" />
      </Helmet>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-5">
          {t('share.title')}
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          {Object.entries(PLATFORMS).map(([key, platform]) => {
            const Icon = platform.icon;
            return (
              <a
                key={key}
                href={shareUrl(key, url, title)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('share.shareOn', { platform: platform.label })}
                className={cn(
                  'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200',
                  'text-sm font-semibold text-gray-700 bg-white',
                  'transition-all duration-200 hover:shadow-md',
                  platform.color,
                )}
              >
                <Icon />
                {platform.label}
              </a>
            );
          })}

          <button
            onClick={handleCopyLink}
            aria-label={t('share.copyLink')}
            className={cn(
              'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200',
              'text-sm font-semibold transition-all duration-200 hover:shadow-md',
              copied
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'text-gray-700 bg-white hover:bg-gray-50',
            )}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                {t('share.copied')}
              </>
            ) : (
              <>
                <Link className="w-4 h-4" />
                {t('share.copyLink')}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
