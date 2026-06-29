import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Home, Info, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Offline() {
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [swActive, setSwActive] = useState<boolean | null>(null);
  const isDev = !import.meta.env.PROD;

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistration('/sw.js')
        .then((reg) => setSwActive(!!reg?.active))
        .catch(() => setSwActive(false));
    } else {
      setSwActive(false);
    }

    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center max-w-md w-full">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <WifiOff size={40} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">
          {online ? 'অফলাইন পেজ' : 'আপনি অফলাইনে'}
        </h1>
        <p className="text-muted-foreground mb-6">
          {online
            ? 'ইন্টারনেট সংযোগ এখন ঠিক আছে। নিচের বাটন দিয়ে হোমে ফিরে যান।'
            : 'ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না। ক্যাশ-করা পেজগুলো এখনো দেখতে পারবেন।'}
        </p>

        {/* Dev-mode info: SW not registered in preview/dev */}
        {isDev && swActive === false && (
          <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-left">
            <div className="flex items-start gap-2">
              <Info size={18} className="text-amber-500 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold mb-1">ডেভেলপমেন্ট মোড</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Service Worker শুধু production build-এ রেজিস্টার হয়, Lovable preview/dev-এ নয়।
                  অফলাইন caching যাচাই করতে অ্যাপটি publish করে পরীক্ষা করুন।
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Production: SW is active */}
        {!isDev && swActive && (
          <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/5 p-4 text-left">
            <div className="flex items-start gap-2">
              <Activity size={18} className="text-green-500 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Service Worker সক্রিয়</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  ক্যাশ থেকে আগের visit-করা পেজগুলো লোড হবে।
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-center flex-wrap">
          <Button onClick={() => window.location.reload()}>
            <RefreshCw size={16} className="mr-2" /> আবার চেষ্টা করুন
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">
              <Home size={16} className="mr-2" /> হোম
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/pwa-diagnostics">PWA Diagnostics</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
