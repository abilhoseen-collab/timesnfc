import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Plus, 
  CreditCard, 
  Eye, 
  MousePointer, 
  QrCode,
  Nfc,
  Edit,
  Trash2,
  LogOut,
  ShoppingCart,
  Package,
  ExternalLink,
  Copy,
  X,
  TrendingUp,
  Calendar,
  Download,
  Shield,
  Crown,
  Clock,
  CheckCircle,
  ArrowUpCircle,
  HardHat,
  Stethoscope,
  Home,
  Share2,
  Globe,
  Layout,
  BarChart3
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';
import UpgradePackageForm from '@/components/UpgradePackageForm';

interface LandingPage {
  id: string;
  name: string;
  slug: string;
  is_published: boolean;
  total_views: number;
  created_at: string;
}

interface Subscription {
  id: string;
  status: string;
  expires_at: string | null;
  package_name: string | null;
}

interface VCard {
  id: string;
  name: string;
  job_title: string;
  company: string;
  template: string;
  is_active: boolean;
  slug: string;
  created_at: string;
  qr_foreground_color: string | null;
  qr_background_color: string | null;
  qr_logo_url: string | null;
}

interface AnalyticsEvent {
  id: string;
  event_type: string;
  link_name: string | null;
  created_at: string;
  vcard_id: string;
}

interface Analytics {
  total_views: number;
  total_clicks: number;
  qr_scans: number;
  nfc_taps: number;
}

interface DailyStats {
  date: string;
  views: number;
  clicks: number;
}

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vcards, setVcards] = useState<VCard[]>([]);
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    total_views: 0,
    total_clicks: 0,
    qr_scans: 0,
    nfc_taps: 0,
  });
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<VCard | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchVCards();
      fetchAnalytics();
      fetchSubscription();
      fetchLandingPages();
    }
  }, [user]);

  const fetchLandingPages = async () => {
    const { data, error } = await supabase
      .from('landing_pages')
      .select('id, name, slug, is_published, total_views, created_at')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLandingPages(data);
    }
  };

  const fetchSubscription = async () => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        status,
        expires_at,
        packages:package_id (name)
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setSubscription({
        id: data.id,
        status: data.status || 'pending',
        expires_at: data.expires_at,
        package_name: (data.packages as any)?.name || null
      });
    }
  };

  const fetchVCards = async () => {
    const { data, error } = await supabase
      .from('vcards')
      .select('*')
      .eq('user_id', user?.id)
      .eq('is_active', true) // Only show active cards, not drafts
      .order('created_at', { ascending: false });

    if (!error && data) {
      setVcards(data);
    }
    setLoading(false);
  };

  const fetchAnalytics = async () => {
    // First get user's vcard IDs
    const { data: vcardData } = await supabase
      .from('vcards')
      .select('id')
      .eq('user_id', user?.id);

    if (!vcardData || vcardData.length === 0) return;

    const vcardIds = vcardData.map(v => v.id);

    const { data, error } = await supabase
      .from('vcard_analytics')
      .select('*')
      .in('vcard_id', vcardIds)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAnalyticsEvents(data);
      
      setAnalytics({
        total_views: data.filter(a => a.event_type === 'view').length,
        total_clicks: data.filter(a => a.event_type === 'link_click').length,
        qr_scans: data.filter(a => a.event_type === 'qr_scan').length,
        nfc_taps: data.filter(a => a.event_type === 'nfc_tap').length,
      });

      // Calculate daily stats for last 7 days
      const last7Days: DailyStats[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayEvents = data.filter(e => e.created_at.startsWith(dateStr));
        last7Days.push({
          date: dateStr,
          views: dayEvents.filter(e => e.event_type === 'view').length,
          clicks: dayEvents.filter(e => e.event_type === 'link_click').length,
        });
      }
      setDailyStats(last7Days);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this card?')) {
      const { error } = await supabase
        .from('vcards')
        .delete()
        .eq('id', id);

      if (!error) {
        setVcards(vcards.filter(v => v.id !== id));
        toast({ title: 'Card deleted successfully' });
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getCardUrl = (slug: string) => {
    return `${window.location.origin}/c/${slug}`;
  };

  const copyCardUrl = (slug: string) => {
    navigator.clipboard.writeText(getCardUrl(slug));
    toast({ title: 'Link copied to clipboard!' });
  };

  const downloadQRCode = (card: VCard) => {
    const svg = document.getElementById(`qr-${card.id}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${card.name.replace(/\s+/g, '_')}_QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Views', value: analytics.total_views, icon: Eye, color: 'text-primary' },
    { label: 'Link Clicks', value: analytics.total_clicks, icon: MousePointer, color: 'text-secondary' },
    { label: 'QR Scans', value: analytics.qr_scans, icon: QrCode, color: 'text-primary' },
    { label: 'NFC Taps', value: analytics.nfc_taps, icon: Nfc, color: 'text-secondary' },
  ];

  const maxDailyValue = Math.max(...dailyStats.map(d => d.views + d.clicks), 1);

  // Get top clicked links
  const linkClicks = analyticsEvents
    .filter(e => e.event_type === 'link_click' && e.link_name)
    .reduce((acc, e) => {
      acc[e.link_name!] = (acc[e.link_name!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topLinks = Object.entries(linkClicks)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-orange-50/30">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-50">
        <div className="container-custom flex items-center justify-between h-16">
          <img 
            src={logo} 
            alt="Times Digital" 
            className="h-10 cursor-pointer" 
            onClick={() => navigate('/')}
          />
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/admin')}
                className="text-primary"
              >
                <Shield size={18} className="mr-2" />
                Admin
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/cart')}
              className="relative"
            >
              <ShoppingCart size={20} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/orders')}
            >
              <Package size={20} />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut size={18} className="mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container-custom py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.user_metadata?.full_name || 'there'}!
          </h1>
          <p className="text-muted-foreground">
            Manage your digital business cards and track their performance.
          </p>
        </motion.div>

        {/* Quick Access Templates - Only for Subscribed Users */}
        {subscription?.status === 'approved' && subscription.expires_at && new Date(subscription.expires_at) > new Date() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Crown size={20} className="text-primary" />
              Premium Templates
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {/* Construction Template */}
              <div className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                    <HardHat size={24} className="text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Construction</h3>
                    <p className="text-xs text-muted-foreground">নির্মাণ ব্যবসা</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => navigate('/templates/construction')}
                  >
                    <Edit size={14} className="mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      const url = `${window.location.origin}/p/construction/${user?.id}`;
                      navigator.clipboard.writeText(url);
                      toast({ title: 'Public link copied!' });
                    }}
                  >
                    <Share2 size={14} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.open(`/p/construction/${user?.id}`, '_blank')}
                  >
                    <ExternalLink size={14} />
                  </Button>
                </div>
              </div>

              {/* Doctor Template */}
              <div className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Stethoscope size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Doctor</h3>
                    <p className="text-xs text-muted-foreground">ডাক্তার প্রোফাইল</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => navigate('/templates/doctor')}
                  >
                    <Edit size={14} className="mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      const url = `${window.location.origin}/p/doctor/${user?.id}`;
                      navigator.clipboard.writeText(url);
                      toast({ title: 'Public link copied!' });
                    }}
                  >
                    <Share2 size={14} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.open(`/p/doctor/${user?.id}`, '_blank')}
                  >
                    <ExternalLink size={14} />
                  </Button>
                </div>
              </div>

              {/* Real Estate Template */}
              <div className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <Home size={24} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Real Estate</h3>
                    <p className="text-xs text-muted-foreground">রিয়েল এস্টেট</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => navigate('/templates/realestate')}
                  >
                    <Edit size={14} className="mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      const url = `${window.location.origin}/p/realestate/${user?.id}`;
                      navigator.clipboard.writeText(url);
                      toast({ title: 'Public link copied!' });
                    }}
                  >
                    <Share2 size={14} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.open(`/p/realestate/${user?.id}`, '_blank')}
                  >
                    <ExternalLink size={14} />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Subscription Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          {subscription ? (
            <div className={`rounded-2xl p-6 border ${
              subscription.status === 'approved' && subscription.expires_at && new Date(subscription.expires_at) > new Date()
                ? 'bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20'
                : subscription.status === 'pending'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-muted border-border'
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    subscription.status === 'approved' ? 'bg-primary/20 text-primary' : 
                    subscription.status === 'pending' ? 'bg-yellow-200 text-yellow-700' : 
                    'bg-muted-foreground/20 text-muted-foreground'
                  }`}>
                    {subscription.status === 'approved' ? <Crown size={24} /> : 
                     subscription.status === 'pending' ? <Clock size={24} /> : 
                     <CreditCard size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground">
                        {subscription.package_name || 'Subscription'}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        subscription.status === 'approved' ? 'bg-green-100 text-green-700' :
                        subscription.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        subscription.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {subscription.status === 'approved' ? 'Active' : 
                         subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                      </span>
                    </div>
                    {subscription.status === 'approved' && subscription.expires_at && (
                      <p className="text-sm text-muted-foreground">
                        Expires: {new Date(subscription.expires_at).toLocaleDateString('en-US', { 
                          year: 'numeric', month: 'long', day: 'numeric' 
                        })}
                      </p>
                    )}
                    {subscription.status === 'pending' && (
                      <p className="text-sm text-yellow-700">
                        Your payment is being verified
                      </p>
                    )}
                    {subscription.status === 'rejected' && (
                      <p className="text-sm text-red-600">
                        Payment was rejected. Please try again.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {subscription.status === 'approved' && subscription.package_name && (
                    <UpgradePackageForm
                      userId={user!.id}
                      currentSubscriptionId={subscription.id}
                      currentPackageName={subscription.package_name}
                      onSuccess={fetchSubscription}
                    />
                  )}
                  {subscription.status !== 'approved' && (
                    <Button variant="secondary" onClick={() => navigate('/payment')}>
                      {subscription.status === 'rejected' ? 'Try Again' : 'View Plans'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Crown size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Upgrade to Premium</h3>
                    <p className="text-sm text-muted-foreground">
                      Unlock premium features and unlimited cards
                    </p>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => navigate('/payment')}>
                  View Plans
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-card rounded-2xl p-6 border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-accent flex items-center justify-center ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Analytics Section */}
        {analyticsEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid lg:grid-cols-2 gap-6 mb-8"
          >
            {/* Weekly Chart */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={20} className="text-primary" />
                <h3 className="font-bold text-foreground">Last 7 Days</h3>
              </div>
              <div className="flex items-end justify-between h-40 gap-2">
                {dailyStats.map((day, index) => {
                  const total = day.views + day.clicks;
                  const height = (total / maxDailyValue) * 100;
                  const viewHeight = total > 0 ? (day.views / total) * height : 0;
                  const clickHeight = total > 0 ? (day.clicks / total) * height : 0;
                  
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col-reverse h-32">
                        <div 
                          className="w-full bg-primary/80 rounded-t transition-all"
                          style={{ height: `${viewHeight}%` }}
                          title={`${day.views} views`}
                        />
                        <div 
                          className="w-full bg-secondary/80 rounded-t transition-all"
                          style={{ height: `${clickHeight}%` }}
                          title={`${day.clicks} clicks`}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-primary/80" />
                  <span className="text-xs text-muted-foreground">Views</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-secondary/80" />
                  <span className="text-xs text-muted-foreground">Clicks</span>
                </div>
              </div>
            </div>

            {/* Top Links */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-center gap-2 mb-6">
                <MousePointer size={20} className="text-primary" />
                <h3 className="font-bold text-foreground">Top Clicked Links</h3>
              </div>
              {topLinks.length > 0 ? (
                <div className="space-y-3">
                  {topLinks.map(([name, count], index) => (
                    <div key={name} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-foreground">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground capitalize">{name}</span>
                          <span className="text-sm text-muted-foreground">{count} clicks</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                            style={{ width: `${(count / topLinks[0][1]) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No link clicks yet
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Landing Pages Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Globe size={24} className="text-primary" />
              Your Landing Pages
            </h2>
            <Button 
              variant="secondary" 
              onClick={() => navigate('/landing-builder')}
              className="font-semibold"
            >
              <Plus size={18} className="mr-2" />
              Create Landing Page
            </Button>
          </div>

          {landingPages.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 border border-border text-center">
              <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center">
                <Layout size={32} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">No landing pages yet</h3>
              <p className="text-muted-foreground mb-6">
                Build professional websites with custom domains and SSL
              </p>
              <Button 
                variant="secondary" 
                onClick={() => navigate('/landing-builder')}
                className="font-semibold"
              >
                <Plus size={18} className="mr-2" />
                Create Your First Landing Page
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {landingPages.map((page, index) => (
                <motion.div
                  key={page.id}
                  className="bg-card rounded-2xl border border-border overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + index * 0.05 }}
                  whileHover={{ y: -5, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Globe size={20} className="text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">{page.name}</h3>
                          <p className="text-xs text-muted-foreground">/site/{page.slug}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        page.is_published 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {page.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <BarChart3 size={14} />
                        <span>{page.total_views} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{new Date(page.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => navigate(`/landing-builder/${page.id}`)}
                      >
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          const url = `${window.location.origin}/site/${page.slug}`;
                          navigator.clipboard.writeText(url);
                          toast({ title: 'Link copied!' });
                        }}
                      >
                        <Copy size={14} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.open(`/site/${page.slug}`, '_blank')}
                      >
                        <ExternalLink size={14} />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Cards Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <CreditCard size={24} className="text-primary" />
              Your Business Cards
            </h2>
            <Button 
              variant="secondary" 
              onClick={() => {
                const hasActiveSubscription = subscription?.status === 'approved' && 
                  subscription.expires_at && 
                  new Date(subscription.expires_at) > new Date();
                if (!hasActiveSubscription) {
                  toast({ 
                    title: 'Subscription Required',
                    description: 'Please purchase a package to create cards.',
                    variant: 'destructive'
                  });
                  navigate('/payment');
                  return;
                }
                navigate('/vcard/new');
              }}
              className="font-semibold"
            >
              <Plus size={18} className="mr-2" />
              Create Business Card
            </Button>
          </div>

          {vcards.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 border border-border text-center">
              <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center">
                <CreditCard size={32} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">No business cards yet</h3>
              <p className="text-muted-foreground mb-6">
                Create professional digital business cards with QR codes
              </p>
              <Button 
                variant="secondary" 
                onClick={() => {
                  const hasActiveSubscription = subscription?.status === 'approved' && 
                    subscription.expires_at && 
                    new Date(subscription.expires_at) > new Date();
                  if (!hasActiveSubscription) {
                    toast({ 
                      title: 'Subscription Required',
                      description: 'Please purchase a package to create cards.',
                      variant: 'destructive'
                    });
                    navigate('/payment');
                    return;
                  }
                  navigate('/vcard/new');
                }}
                className="font-semibold"
              >
                <Plus size={18} className="mr-2" />
                Create Your First Business Card
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vcards.map((card, index) => {
                // Get analytics for this card
                const cardViews = analyticsEvents.filter(e => e.vcard_id === card.id && e.event_type === 'view').length;
                
                return (
                  <motion.div
                    key={card.id}
                    className="bg-card rounded-2xl border border-border overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    whileHover={{ y: -5, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <CreditCard size={20} className="text-primary" />
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground">{card.name}</h3>
                            <p className="text-xs text-muted-foreground">/c/{card.slug}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          card.is_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {card.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <BarChart3 size={14} />
                          <span>{cardViews} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{new Date(card.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Template Badge */}
                      <div className="mb-4">
                        <span className="px-2 py-1 bg-accent text-accent-foreground text-xs font-medium rounded-md capitalize">
                          {card.template} Template
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => navigate(`/vcard/${card.id}`)}
                        >
                          <Edit size={14} className="mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedCard(card);
                            setShowQRModal(true);
                          }}
                        >
                          <QrCode size={14} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyCardUrl(card.slug)}
                        >
                          <Copy size={14} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(getCardUrl(card.slug), '_blank')}
                        >
                          <ExternalLink size={14} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(card.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">QR Code for {selectedCard?.name}</DialogTitle>
          </DialogHeader>
          {selectedCard?.slug && (
            <div className="flex flex-col items-center py-6">
              <div className="p-6 bg-white rounded-2xl shadow-lg border border-border mb-6">
                <QRCodeSVG 
                  id={`qr-modal-${selectedCard.id}`}
                  value={getCardUrl(selectedCard.slug)} 
                  size={200}
                  level="H"
                  includeMargin
                  fgColor={selectedCard.qr_foreground_color || '#000000'}
                  bgColor={selectedCard.qr_background_color || '#FFFFFF'}
                  imageSettings={selectedCard.qr_logo_url ? {
                    src: selectedCard.qr_logo_url,
                    height: 50,
                    width: 50,
                    excavate: true,
                  } : undefined}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Scan this QR code to view the digital business card
              </p>
              <div className="flex gap-3 w-full">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => copyCardUrl(selectedCard.slug)}
                >
                  <Copy size={16} className="mr-2" />
                  Copy Link
                </Button>
                <Button 
                  variant="secondary" 
                  className="flex-1"
                  onClick={() => {
                    const svg = document.getElementById(`qr-modal-${selectedCard.id}`);
                    if (!svg) return;
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const img = new Image();
                    img.onload = () => {
                      canvas.width = img.width;
                      canvas.height = img.height;
                      ctx?.drawImage(img, 0, 0);
                      const pngFile = canvas.toDataURL('image/png');
                      const downloadLink = document.createElement('a');
                      downloadLink.download = `${selectedCard.name.replace(/\s+/g, '_')}_QR.png`;
                      downloadLink.href = pngFile;
                      downloadLink.click();
                    };
                    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                  }}
                >
                  <Download size={16} className="mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}