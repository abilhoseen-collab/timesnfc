import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Eye,
  MousePointerClick,
  Users,
  Clock,
  TrendingUp,
  RefreshCw,
  Loader2,
  BarChart3,
  Calendar,
  Link2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import AdvancedAnalytics from './AdvancedAnalytics';

interface AnalyticsData {
  id: string;
  event_type: string;
  link_name: string | null;
  created_at: string;
  visitor_id: string | null;
  session_id: string | null;
  is_unique: boolean | null;
  time_on_page: number | null;
  referrer: string | null;
  user_agent: string | null;
  country: string | null;
  city: string | null;
}

interface VCardAnalyticsDashboardProps {
  vcardId: string;
}

export default function VCardAnalyticsDashboard({ vcardId }: VCardAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState(7); // Days

  const fetchData = async () => {
    const startDate = subDays(new Date(), dateRange).toISOString();

    const [analyticsRes, appointmentsRes] = await Promise.all([
      supabase
        .from('vcard_analytics')
        .select('*')
        .eq('vcard_id', vcardId)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false }),
      supabase
        .from('vcard_appointments')
        .select('*')
        .eq('vcard_id', vcardId)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false }),
    ]);

    setAnalytics(analyticsRes.data || []);
    setAppointments(appointmentsRes.data || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, [vcardId, dateRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Calculate stats
  const stats = useMemo(() => {
    const views = analytics.filter(a => a.event_type === 'view');
    const clicks = analytics.filter(a => a.event_type === 'link_click');
    const uniqueVisitors = new Set(views.filter(v => v.is_unique).map(v => v.visitor_id)).size;
    const totalVisitors = new Set(views.map(v => v.visitor_id)).size;
    const returningVisitors = totalVisitors - uniqueVisitors;
    
    // Bounce rate (sessions < 10 seconds)
    const sessions = views.filter(v => v.time_on_page !== null);
    const bounces = sessions.filter(v => (v.time_on_page || 0) < 10).length;
    const bounceRate = sessions.length > 0 ? (bounces / sessions.length) * 100 : 0;
    
    // Average time on page
    const avgTimeOnPage = sessions.length > 0
      ? sessions.reduce((acc, v) => acc + (v.time_on_page || 0), 0) / sessions.length
      : 0;

    return {
      totalViews: views.length,
      uniqueVisitors,
      returningVisitors,
      totalClicks: clicks.length,
      bounceRate: Math.round(bounceRate),
      avgTimeOnPage: Math.round(avgTimeOnPage),
      appointmentsCount: appointments.length,
      pendingAppointments: appointments.filter(a => a.status === 'pending').length,
      confirmedAppointments: appointments.filter(a => a.status === 'confirmed').length,
    };
  }, [analytics, appointments]);

  // Daily chart data
  const chartData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), dateRange - 1),
      end: new Date(),
    });

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayViews = analytics.filter(
        a => a.event_type === 'view' && format(new Date(a.created_at), 'yyyy-MM-dd') === dayStr
      );
      const dayClicks = analytics.filter(
        a => a.event_type === 'link_click' && format(new Date(a.created_at), 'yyyy-MM-dd') === dayStr
      );
      const dayAppointments = appointments.filter(
        a => format(new Date(a.created_at), 'yyyy-MM-dd') === dayStr
      );

      return {
        date: format(day, 'MMM dd'),
        views: dayViews.length,
        clicks: dayClicks.length,
        appointments: dayAppointments.length,
      };
    });
  }, [analytics, appointments, dateRange]);

  // Top clicked links
  const topLinks = useMemo(() => {
    const clicks = analytics.filter(a => a.event_type === 'link_click' && a.link_name);
    const linkCounts: Record<string, number> = {};
    clicks.forEach(c => {
      const name = c.link_name || 'Unknown';
      linkCounts[name] = (linkCounts[name] || 0) + 1;
    });
    return Object.entries(linkCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [analytics]);

  // Referrer sources
  const referrerData = useMemo(() => {
    const views = analytics.filter(a => a.event_type === 'view');
    const refCounts: Record<string, number> = {};
    views.forEach(v => {
      let source = 'Direct';
      if (v.referrer) {
        try {
          const url = new URL(v.referrer);
          source = url.hostname.replace('www.', '');
        } catch {
          source = 'Other';
        }
      }
      refCounts[source] = (refCounts[source] || 0) + 1;
    });
    return Object.entries(refCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [analytics]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-primary" />
          <h3 className="font-bold text-foreground">Analytics Dashboard</h3>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="h-9 px-3 rounded-lg border border-border bg-background text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Eye}
          label="Total Views"
          value={stats.totalViews}
          color="text-blue-500"
          bgColor="bg-blue-500/10"
        />
        <StatCard
          icon={Users}
          label="Unique Visitors"
          value={stats.uniqueVisitors}
          subValue={`${stats.returningVisitors} returning`}
          color="text-green-500"
          bgColor="bg-green-500/10"
        />
        <StatCard
          icon={MousePointerClick}
          label="Link Clicks"
          value={stats.totalClicks}
          color="text-purple-500"
          bgColor="bg-purple-500/10"
        />
        <StatCard
          icon={Calendar}
          label="Appointments"
          value={stats.appointmentsCount}
          subValue={`${stats.pendingAppointments} pending`}
          color="text-orange-500"
          bgColor="bg-orange-500/10"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp size={16} />
            <span className="text-sm">Bounce Rate</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{stats.bounceRate}%</span>
            {stats.bounceRate < 50 ? (
              <span className="text-xs text-green-500 flex items-center">
                <ArrowDownRight size={12} /> Good
              </span>
            ) : (
              <span className="text-xs text-red-500 flex items-center">
                <ArrowUpRight size={12} /> High
              </span>
            )}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock size={16} />
            <span className="text-sm">Avg. Time on Page</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats.avgTimeOnPage < 60
              ? `${stats.avgTimeOnPage}s`
              : `${Math.floor(stats.avgTimeOnPage / 60)}m ${stats.avgTimeOnPage % 60}s`}
          </div>
        </div>
      </div>

      {/* Views & Clicks Chart */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h4 className="font-semibold text-foreground mb-4">Daily Trends</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorViews)"
                strokeWidth={2}
                name="Views"
              />
              <Area
                type="monotone"
                dataKey="clicks"
                stroke="hsl(var(--chart-2))"
                fillOpacity={1}
                fill="url(#colorClicks)"
                strokeWidth={2}
                name="Clicks"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Views</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
            <span className="text-muted-foreground">Clicks</span>
          </div>
        </div>
      </div>

      {/* Top Links & Traffic Sources */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top Clicked Links */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Link2 size={16} />
            Top Clicked Links
          </h4>
          {topLinks.length > 0 ? (
            <div className="space-y-3">
              {topLinks.map((link, idx) => (
                <div key={link.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground capitalize truncate">
                      {link.name.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-primary">{link.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No link clicks yet</p>
          )}
        </div>

        {/* Traffic Sources */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="font-semibold text-foreground mb-4">Traffic Sources</h4>
          {referrerData.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={referrerData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {referrerData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {referrerData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-muted-foreground truncate flex-1">{item.name}</span>
                    <span className="font-medium text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No traffic data yet</p>
          )}
        </div>
      </div>

      {/* Advanced analytics: device, browser, source, country, funnel */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-primary" /> অ্যাডভান্সড অ্যানালিটিক্স
        </h3>
        <AdvancedAnalytics analytics={analytics as any} />
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
  bgColor,
}: {
  icon: any;
  label: string;
  value: number;
  subValue?: string;
  color: string;
  bgColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4"
    >
      <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center mb-3`}>
        <Icon size={20} className={color} />
      </div>
      <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
    </motion.div>
  );
}
