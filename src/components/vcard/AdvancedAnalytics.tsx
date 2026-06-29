import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { Globe, Smartphone, Monitor, Tablet, Link2 } from 'lucide-react';

interface AnalyticsRow {
  event_type: string;
  user_agent: string | null;
  referrer: string | null;
  country: string | null;
  city: string | null;
  visitor_id: string | null;
  is_unique: boolean | null;
}

interface Props { analytics: AnalyticsRow[]; }

const COLORS = ['hsl(var(--primary))', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

function detectDevice(ua: string | null): 'Mobile' | 'Tablet' | 'Desktop' {
  if (!ua) return 'Desktop';
  const u = ua.toLowerCase();
  if (/tablet|ipad/.test(u)) return 'Tablet';
  if (/mobi|android|iphone|ipod/.test(u)) return 'Mobile';
  return 'Desktop';
}

function detectBrowser(ua: string | null): string {
  if (!ua) return 'Other';
  const u = ua.toLowerCase();
  if (u.includes('edg/')) return 'Edge';
  if (u.includes('chrome/') && !u.includes('edg/')) return 'Chrome';
  if (u.includes('firefox/')) return 'Firefox';
  if (u.includes('safari/') && !u.includes('chrome/')) return 'Safari';
  if (u.includes('opera') || u.includes('opr/')) return 'Opera';
  return 'Other';
}

function shortReferrer(ref: string | null): string {
  if (!ref) return 'সরাসরি';
  try {
    const u = new URL(ref);
    return u.hostname.replace(/^www\./, '');
  } catch { return 'অন্যান্য'; }
}

const deviceIcon = { Mobile: Smartphone, Tablet, Desktop: Monitor } as const;

export default function AdvancedAnalytics({ analytics }: Props) {
  const views = useMemo(() => analytics.filter((a) => a.event_type === 'view'), [analytics]);
  const clicks = useMemo(() => analytics.filter((a) => a.event_type === 'click'), [analytics]);

  const devices = useMemo(() => {
    const m = new Map<string, number>();
    views.forEach((v) => {
      const d = detectDevice(v.user_agent);
      m.set(d, (m.get(d) || 0) + 1);
    });
    return Array.from(m, ([name, value]) => ({ name, value }));
  }, [views]);

  const browsers = useMemo(() => {
    const m = new Map<string, number>();
    views.forEach((v) => {
      const b = detectBrowser(v.user_agent);
      m.set(b, (m.get(b) || 0) + 1);
    });
    return Array.from(m, ([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [views]);

  const referrers = useMemo(() => {
    const m = new Map<string, number>();
    views.forEach((v) => {
      const r = shortReferrer(v.referrer);
      m.set(r, (m.get(r) || 0) + 1);
    });
    return Array.from(m, ([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [views]);

  const countries = useMemo(() => {
    const m = new Map<string, number>();
    views.forEach((v) => {
      const c = v.country || 'অজানা';
      m.set(c, (m.get(c) || 0) + 1);
    });
    return Array.from(m, ([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [views]);

  // Conversion funnel: views → unique → clicks
  const uniqueViews = useMemo(
    () => new Set(views.filter((v) => v.is_unique).map((v) => v.visitor_id)).size,
    [views],
  );
  const funnel = [
    { stage: 'মোট ভিউ', value: views.length },
    { stage: 'ইউনিক ভিজিটর', value: uniqueViews },
    { stage: 'ক্লিক', value: clicks.length },
  ];

  const convRate = views.length > 0
    ? ((clicks.length / views.length) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 size={18} /> কনভার্সন ফানেল
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-4 gap-4 mb-4">
            {funnel.map((f) => (
              <div key={f.stage} className="text-center p-4 rounded-xl bg-muted/40">
                <div className="text-3xl font-bold text-primary">{f.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{f.stage}</div>
              </div>
            ))}
            <div className="text-center p-4 rounded-xl bg-primary/10">
              <div className="text-3xl font-bold text-primary">{convRate}%</div>
              <div className="text-xs text-muted-foreground mt-1">কনভার্সন রেট</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={funnel} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" />
              <YAxis dataKey="stage" type="category" />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Devices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone size={18} /> ডিভাইস
            </CardTitle>
          </CardHeader>
          <CardContent>
            {devices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">কোনো ডেটা নেই</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={devices} dataKey="value" nameKey="name" outerRadius={70} label>
                      {devices.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {devices.map((d) => {
                    const Icon = deviceIcon[d.name as keyof typeof deviceIcon] || Monitor;
                    return (
                      <div key={d.name} className="text-center p-2 rounded-lg bg-muted/40">
                        <Icon size={16} className="mx-auto mb-1 text-primary" />
                        <div className="text-sm font-semibold">{d.value}</div>
                        <div className="text-xs text-muted-foreground">{d.name}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Browsers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ব্রাউজার</CardTitle>
          </CardHeader>
          <CardContent>
            {browsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">কোনো ডেটা নেই</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={browsers}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Referrers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 size={18} /> ট্রাফিক সোর্স
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referrers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">কোনো ডেটা নেই</p>
            ) : (
              <div className="space-y-2">
                {referrers.map((r) => {
                  const max = Math.max(...referrers.map((x) => x.value));
                  const pct = (r.value / max) * 100;
                  return (
                    <div key={r.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium truncate">{r.name}</span>
                        <span className="text-muted-foreground">{r.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe size={18} /> দেশ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {countries.length === 0 || countries.every((c) => c.name === 'অজানা') ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                ভৌগোলিক ডেটা এখনো সংগৃহীত হয়নি
              </p>
            ) : (
              <div className="space-y-2">
                {countries.map((c) => {
                  const max = Math.max(...countries.map((x) => x.value));
                  const pct = (c.value / max) * 100;
                  return (
                    <div key={c.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-muted-foreground">{c.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
