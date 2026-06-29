import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { activateUpdate } from '@/pwa/registerSW';
import {
  CheckCircle2, XCircle, RefreshCw, Trash2, Home, Wifi, WifiOff, Database,
} from 'lucide-react';

interface SWInfo {
  supported: boolean;
  controller: boolean;
  scope?: string;
  state?: string;
  scriptURL?: string;
  hasWaiting: boolean;
}

interface CacheEntry {
  name: string;
  count: number;
  urls: string[];
}

export default function PWADiagnostics() {
  const { toast } = useToast();
  const [sw, setSw] = useState<SWInfo>({ supported: false, controller: false, hasWaiting: false });
  const [caches_, setCaches] = useState<CacheEntry[]>([]);
  const [online, setOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    // SW status
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const active = reg?.active;
      setSw({
        supported: true,
        controller: !!navigator.serviceWorker.controller,
        scope: reg?.scope,
        state: active?.state,
        scriptURL: active?.scriptURL,
        hasWaiting: !!reg?.waiting,
      });
    } else {
      setSw({ supported: false, controller: false, hasWaiting: false });
    }

    // Cache contents
    if ('caches' in window) {
      const names = await caches.keys();
      const entries: CacheEntry[] = [];
      for (const name of names) {
        try {
          const c = await caches.open(name);
          const keys = await c.keys();
          entries.push({
            name,
            count: keys.length,
            urls: keys.map((r) => r.url).sort(),
          });
        } catch { /* ignore */ }
      }
      entries.sort((a, b) => a.name.localeCompare(b.name));
      setCaches(entries);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const clearAllCaches = async () => {
    if (!('caches' in window)) return;
    const names = await caches.keys();
    await Promise.all(names.map((n) => caches.delete(n)));
    toast({ title: 'সকল ক্যাশ মুছে ফেলা হয়েছে' });
    refresh();
  };

  const unregisterSW = async () => {
    if (!('serviceWorker' in navigator)) return;
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
    toast({ title: 'Service Worker unregister করা হয়েছে' });
    refresh();
  };

  const totalCachedAssets = caches_.reduce((sum, c) => sum + c.count, 0);
  const precache = caches_.find((c) => /precache/i.test(c.name));

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">PWA Diagnostics</h1>
            <p className="text-sm text-muted-foreground">Service Worker ও cache স্ট্যাটাস</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/"><Home size={14} className="mr-1.5" /> হোম</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} /> রিফ্রেশ
            </Button>
          </div>
        </header>

        {/* Status cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {online ? <Wifi size={16} className="text-green-500" /> : <WifiOff size={16} className="text-red-500" />}
                Network
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={online ? 'default' : 'destructive'}>{online ? 'Online' : 'Offline'}</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {sw.controller ? <CheckCircle2 size={16} className="text-green-500" /> : <XCircle size={16} className="text-muted-foreground" />}
                Service Worker
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <div>Supported: <b>{sw.supported ? 'হ্যাঁ' : 'না'}</b></div>
              <div>Controlling: <b>{sw.controller ? 'হ্যাঁ' : 'না'}</b></div>
              <div>State: <b>{sw.state || '—'}</b></div>
              {sw.hasWaiting && <Badge variant="secondary">Update pending</Badge>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database size={16} className="text-primary" />
                Caches
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <div>Buckets: <b>{caches_.length}</b></div>
              <div>Total entries: <b>{totalCachedAssets}</b></div>
              <div>Precached: <b>{precache?.count ?? 0}</b></div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {sw.hasWaiting && (
            <Button size="sm" onClick={() => activateUpdate()}>
              <RefreshCw size={14} className="mr-1.5" /> নতুন SW activate করুন
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={clearAllCaches}>
            <Trash2 size={14} className="mr-1.5" /> সব cache ক্লিয়ার করুন
          </Button>
          <Button size="sm" variant="outline" onClick={unregisterSW}>
            <XCircle size={14} className="mr-1.5" /> SW unregister
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to="/offline">/offline প্রিভিউ</Link>
          </Button>
        </div>

        {/* SW details */}
        {sw.scriptURL && (
          <Card>
            <CardHeader><CardTitle className="text-sm">SW Script</CardTitle></CardHeader>
            <CardContent className="text-xs font-mono break-all space-y-1">
              <div><span className="text-muted-foreground">scriptURL:</span> {sw.scriptURL}</div>
              <div><span className="text-muted-foreground">scope:</span> {sw.scope}</div>
            </CardContent>
          </Card>
        )}

        {/* Cache entries */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Cached Assets</h2>
          {caches_.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground">কোনো cache পাওয়া যায়নি। প্রোডাকশন বিল্ডে service worker সক্রিয় হলে এখানে দেখা যাবে।</p>
          )}
          {caches_.map((c) => (
            <Card key={c.name}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between gap-2">
                  <span className="font-mono break-all">{c.name}</span>
                  <Badge variant="outline">{c.count}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <details>
                  <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                    সব entry দেখুন ({c.count})
                  </summary>
                  <ul className="mt-2 max-h-64 overflow-auto text-[11px] font-mono space-y-0.5">
                    {c.urls.map((u) => (
                      <li key={u} className="truncate" title={u}>
                        {u.replace(window.location.origin, '')}
                      </li>
                    ))}
                  </ul>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
