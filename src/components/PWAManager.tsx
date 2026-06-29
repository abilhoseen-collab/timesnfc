import { useEffect, useState } from 'react';
import { Download, RefreshCw, X, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { registerSW, activateUpdate } from '@/pwa/registerSW';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAManager() {
  const [updateReady, setUpdateReady] = useState(false);
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine);

  useEffect(() => {
    registerSW(() => setUpdateReady(true));
  }, []);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;
      setInstallEvt(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    };
    const onInstalled = () => {
      setShowInstall(false);
      setInstallEvt(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const install = async () => {
    if (!installEvt) return;
    await installEvt.prompt();
    await installEvt.userChoice;
    setShowInstall(false);
    setInstallEvt(null);
  };

  const dismissInstall = () => {
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
    setShowInstall(false);
  };

  return (
    <>
      {offline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950 text-sm py-1.5 px-4 flex items-center justify-center gap-2 shadow">
          <WifiOff size={14} />
          আপনি অফলাইনে — ক্যাশ থেকে দেখানো হচ্ছে
        </div>
      )}

      {updateReady && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-card border border-primary/40 shadow-xl rounded-xl p-4 flex items-center gap-3 max-w-sm">
          <RefreshCw size={18} className="text-primary" />
          <div className="flex-1">
            <p className="text-sm font-semibold">নতুন ভার্সন প্রস্তুত</p>
            <p className="text-xs text-muted-foreground">আপডেট ইনস্টল করতে রিলোড করুন</p>
          </div>
          <Button size="sm" onClick={() => activateUpdate()}>আপডেট</Button>
        </div>
      )}

      {showInstall && installEvt && (
        <div className="fixed bottom-4 right-4 z-[100] bg-card border border-primary/40 shadow-xl rounded-xl p-4 flex items-start gap-3 max-w-sm">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Download size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">অ্যাপ ইনস্টল করুন</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              হোম স্ক্রিনে যোগ করুন — অফলাইনেও কাজ করবে।
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={install}>ইনস্টল</Button>
              <Button size="sm" variant="ghost" onClick={dismissInstall}>পরে</Button>
            </div>
          </div>
          <button onClick={dismissInstall} className="text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
}
