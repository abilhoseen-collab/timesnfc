import { Helmet } from 'react-helmet-async';

export default function VCardPixelScripts({
  gaId,
  pixelId,
}: {
  gaId?: string | null;
  pixelId?: string | null;
}) {
  if (!gaId && !pixelId) return null;
  return (
    <Helmet>
      {gaId && (
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
      )}
      {gaId && (
        <script>{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}</script>
      )}
      {pixelId && (
        <script>{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}'); fbq('track', 'PageView');
        `}</script>
      )}
    </Helmet>
  );
}
