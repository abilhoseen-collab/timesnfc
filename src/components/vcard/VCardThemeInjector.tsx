import { useEffect } from 'react';

interface Props {
  brandColor?: string | null;
  accentColor?: string | null;
  animated?: boolean | null;
  customFont?: string | null;
}

const GOOGLE_FONTS: Record<string, string> = {
  Poppins: 'Poppins:wght@400;600;700',
  'Playfair Display': 'Playfair+Display:wght@400;700',
  'Space Grotesk': 'Space+Grotesk:wght@400;600;700',
  'Bebas Neue': 'Bebas+Neue',
  'Hind Siliguri': 'Hind+Siliguri:wght@400;600;700',
  'Tiro Bangla': 'Tiro+Bangla',
};

export default function VCardThemeInjector({ brandColor, accentColor, animated, customFont }: Props) {
  useEffect(() => {
    if (!customFont || !GOOGLE_FONTS[customFont]) return;
    const id = `font-${customFont.replace(/\s/g, '-')}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${GOOGLE_FONTS[customFont]}&display=swap`;
    document.head.appendChild(link);
  }, [customFont]);

  return (
    <style>{`
      :root {
        ${brandColor ? `--vcard-brand: ${brandColor};` : ''}
        ${accentColor ? `--vcard-accent: ${accentColor};` : ''}
      }
      .vcard-themed-bg {
        ${brandColor && accentColor ? `background: linear-gradient(135deg, ${brandColor}, ${accentColor}) !important;` : ''}
        ${animated ? `background-size: 200% 200% !important; animation: vcardGradient 12s ease infinite;` : ''}
      }
      ${customFont ? `.vcard-themed { font-family: '${customFont}', sans-serif !important; }` : ''}
      @keyframes vcardGradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `}</style>
  );
}
