import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useTeamRoles } from '@/hooks/useTeamRoles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  BarChart3,
  Search,
  Filter,
  Settings,
  Receipt,
  LifeBuoy,
  Gift,
  Users as UsersIcon,
  FileSpreadsheet
} from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';
import UpgradePackageForm from '@/components/UpgradePackageForm';
import AnalyticsExport from '@/components/dashboard/AnalyticsExport';
import { UsageLimitsCard } from '@/components/dashboard/UsageLimitsCard';
import { getUserFriendlyError } from '@/lib/errorHandler';

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
  user_id?: string | null;
  team_id?: string | null;
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
  landingViews: number;
}

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canEdit: canEditTeam, canDelete: canDeleteTeam, getRole } = useTeamRoles();
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
  
  // Search and Filter States
  const [vcardSearch, setVcardSearch] = useState('');
  const [vcardFilter, setVcardFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [landingSearch, setLandingSearch] = useState('');
  const [landingFilter, setLandingFilter] = useState<'all' | 'published' | 'draft'>('all');

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
    try {
      const { data, error } = await supabase
        .from('landing_pages')
        .select('id, name, slug, is_published, total_views, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLandingPages(data || []);
    } catch (err) {
      toast({ title: 'ত্রুটি', description: getUserFriendlyError(err), variant: 'destructive' });
    }
  };

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`id, status, expires_at, packages:package_id (name)`)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setSubscription({
          id: data.id,
          status: data.status || 'pending',
          expires_at: data.expires_at,
          package_name: (data.packages as any)?.name || null,
        });
      }
    } catch (err) {
      toast({ title: 'ত্রুটি', description: getUserFriendlyError(err), variant: 'destructive' });
    }
  };

  const fetchVCards = async () => {
    try {
      const { data, error } = await supabase
        .from('vcards')
        .select('id, name, job_title, company, template, is_active, slug, created_at, qr_foreground_color, qr_background_color, qr_logo_url')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setVcards((data as VCard[]) || []);
    } catch (err) {
      toast({ title: 'ত্রুটি', description: getUserFriendlyError(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const { data: vcardData, error: vErr } = await supabase
        .from('vcards')
        .select('id')
        .eq('user_id', user?.id);
      if (vErr) throw vErr;
      if (!vcardData || vcardData.length === 0) return;

      const vcardIds = vcardData.map(v => v.id);
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - 30);

      const { data, error } = await supabase
        .from('vcard_analytics')
        .select('id, event_type, link_name, created_at, vcard_id')
        .in('vcard_id', vcardIds)
        .gte('created_at', sinceDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(5000);
      if (error) throw error;

      const events = data || [];
      setAnalyticsEvents(events);
      setAnalytics({
        total_views: events.filter(a => a.event_type === 'view').length,
        total_clicks: events.filter(a => a.event_type === 'link_click').length,
        qr_scans: events.filter(a => a.event_type === 'qr_scan').length,
        nfc_taps: events.filter(a => a.event_type === 'nfc_tap').length,
      });

      const last7Days: DailyStats[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayEvents = events.filter(e => e.created_at.startsWith(dateStr));
        last7Days.push({
          date: dateStr,
          views: dayEvents.filter(e => e.event_type === 'view').length,
          clicks: dayEvents.filter(e => e.event_type === 'link_click').length,
          landingViews: 0,
        });
      }
      setDailyStats(last7Days);
    } catch (err) {
      toast({ title: 'ত্রুটি', description: getUserFriendlyError(err), variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি এই কার্ডটি মুছে ফেলতে চান?')) return;
    try {
      const { error } = await supabase.from('vcards').delete().eq('id', id);
      if (error) throw error;
      setVcards(prev => prev.filter(v => v.id !== id));
      toast({ title: 'কার্ড সফলভাবে মুছে ফেলা হয়েছে' });
    } catch (err) {
      toast({ title: 'ত্রুটি', description: getUserFriendlyError(err), variant: 'destructive' });
    }
  };

  const handleDeleteLandingPage = async (id: string) => {
    if (!confirm('আপনি কি এই ল্যান্ডিং পেইজটি মুছে ফেলতে চান?')) return;
    try {
      const { error } = await supabase.from('landing_pages').delete().eq('id', id);
      if (error) throw error;
      setLandingPages(prev => prev.filter(p => p.id !== id));
      toast({ title: 'ল্যান্ডিং পেইজ সফলভাবে মুছে ফেলা হয়েছে' });
    } catch (err) {
      toast({ title: 'ত্রুটি', description: getUserFriendlyError(err), variant: 'destructive' });
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

  // Filter VCards (memoized)
  const filteredVcards = useMemo(() => {
    const q = vcardSearch.toLowerCase();
    return vcards.filter(card => {
      const matchesSearch = !q ||
        card.name.toLowerCase().includes(q) ||
        card.slug?.toLowerCase().includes(q) ||
        card.template?.toLowerCase().includes(q);
      const matchesFilter = vcardFilter === 'all' ||
        (vcardFilter === 'active' && card.is_active) ||
        (vcardFilter === 'inactive' && !card.is_active);
      return matchesSearch && matchesFilter;
    });
  }, [vcards, vcardSearch, vcardFilter]);

  // Filter Landing Pages (memoized)
  const filteredLandingPages = useMemo(() => {
    const q = landingSearch.toLowerCase();
    return landingPages.filter(page => {
      const matchesSearch = !q ||
        page.name.toLowerCase().includes(q) ||
        page.slug?.toLowerCase().includes(q);
      const matchesFilter = landingFilter === 'all' ||
        (landingFilter === 'published' && page.is_published) ||
        (landingFilter === 'draft' && !page.is_published);
      return matchesSearch && matchesFilter;
    });
  }, [landingPages, landingSearch, landingFilter]);

  // Total landing page views (memoized)
  const totalLandingViews = useMemo(
    () => landingPages.reduce((sum, page) => sum + (page.total_views || 0), 0),
    [landingPages]
  );

  // Per-vcard view counts (single pass instead of N filters per render)
  const viewsByVcardId = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of analyticsEvents) {
      if (e.event_type === 'view' && e.vcard_id) {
        counts[e.vcard_id] = (counts[e.vcard_id] || 0) + 1;
      }
    }
    return counts;
  }, [analyticsEvents]);

  // Top links (memoized)
  const topLinks = useMemo(() => {
    const linkClicks: Record<string, number> = {};
    for (const e of analyticsEvents) {
      if (e.event_type === 'link_click' && e.link_name) {
        linkClicks[e.link_name] = (linkClicks[e.link_name] || 0) + 1;
      }
    }
    return Object.entries(linkClicks).sort(([, a], [, b]) => b - a).slice(0, 5);
  }, [analyticsEvents]);

  const maxDailyValue = useMemo(
    () => Math.max(...dailyStats.map(d => d.views + d.clicks), 1),
    [dailyStats]
  );

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
          <div className="flex items-center gap-1 sm:gap-2">
            {isAdmin && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/admin')}
                className="text-primary hidden sm:inline-flex"
              >
                <Shield size={18} className="mr-2" />
                Admin
              </Button>
            )}
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={() => navigate('/cart')} title="কার্ট">
              <ShoppingCart size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/orders')} title="অর্ডার">
              <Package size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/billing')} title="বিলিং" className="hidden sm:inline-flex">
              <Receipt size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/support')} title="সাপোর্ট" className="hidden sm:inline-flex">
              <LifeBuoy size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/referrals')} title="রেফারেল" className="hidden sm:inline-flex">
              <Gift size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/leads')} title="Leads / CRM" className="hidden sm:inline-flex">
              <UsersIcon size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/bulk-qr')} title="Bulk QR" className="hidden sm:inline-flex">
              <QrCode size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/bulk-create')} title="Bulk vCard তৈরি (CSV)" className="hidden sm:inline-flex">
              <FileSpreadsheet size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/teams')} title="Team Management" className="hidden sm:inline-flex">
              <UsersIcon size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} title="সেটিংস">
              <Settings size={20} />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} title="লগ আউট">
              <LogOut size={18} />
              <span className="hidden md:inline ml-2">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>


      <OnboardingWizard />
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

        {/* Subscription Status - Prominent Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          {subscription ? (
            (() => {
              const isActive = subscription.status === 'approved' && 
                subscription.expires_at && 
                new Date(subscription.expires_at) > new Date();
              const daysRemaining = subscription.expires_at 
                ? Math.ceil((new Date(subscription.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : 0;
              const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;
              const isExpired = daysRemaining <= 0 && subscription.status === 'approved';

              return (
                <div className={`rounded-2xl p-6 border-2 ${
                  isActive && !isExpiringSoon
                    ? 'bg-gradient-to-r from-primary/10 via-teal-50 to-secondary/10 border-primary/30'
                    : isExpiringSoon
                    ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-300'
                    : isExpired
                    ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-300'
                    : subscription.status === 'pending'
                    ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300'
                    : 'bg-muted border-border'
                }`}>
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                        isActive && !isExpiringSoon ? 'bg-primary text-primary-foreground' : 
                        isExpiringSoon ? 'bg-orange-500 text-white' :
                        isExpired ? 'bg-red-500 text-white' :
                        subscription.status === 'pending' ? 'bg-yellow-500 text-white' : 
                        'bg-muted-foreground/20 text-muted-foreground'
                      }`}>
                        {isActive && !isExpiringSoon ? <Crown size={28} /> : 
                         isExpiringSoon ? <Clock size={28} /> :
                         isExpired ? <CreditCard size={28} /> :
                         subscription.status === 'pending' ? <Clock size={28} /> : 
                         <CreditCard size={28} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-foreground">
                            {subscription.package_name || 'সাবস্ক্রিপশন'}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                            isActive && !isExpiringSoon ? 'bg-green-100 text-green-700' :
                            isExpiringSoon ? 'bg-orange-100 text-orange-700' :
                            isExpired ? 'bg-red-100 text-red-700' :
                            subscription.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            subscription.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {isActive && !isExpiringSoon ? '✓ সক্রিয়' : 
                             isExpiringSoon ? `⚠ ${daysRemaining} দিন বাকি` :
                             isExpired ? '✕ মেয়াদ শেষ' :
                             subscription.status === 'pending' ? '⏳ অপেক্ষমান' :
                             subscription.status === 'rejected' ? '✕ প্রত্যাখ্যাত' :
                             subscription.status}
                          </span>
                        </div>
                        
                        {isActive && subscription.expires_at && (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar size={14} />
                              <span>মেয়াদ শেষ: {new Date(subscription.expires_at).toLocaleDateString('bn-BD', { 
                                year: 'numeric', month: 'long', day: 'numeric' 
                              })}</span>
                            </div>
                            {!isExpiringSoon && (
                              <span className="text-primary font-medium">
                                ({daysRemaining} দিন বাকি)
                              </span>
                            )}
                          </div>
                        )}
                        
                        {isExpired && (
                          <p className="text-sm text-red-600 font-medium">
                            আপনার সাবস্ক্রিপশনের মেয়াদ শেষ হয়ে গেছে। কার্ড তৈরি করতে রিনিউ করুন।
                          </p>
                        )}
                        
                        {subscription.status === 'pending' && (
                          <p className="text-sm text-yellow-700">
                            আপনার পেমেন্ট ভেরিফাই করা হচ্ছে। অনুগ্রহ করে অপেক্ষা করুন।
                          </p>
                        )}
                        
                        {subscription.status === 'rejected' && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                            <p className="text-sm text-red-700 font-medium mb-2">
                              ❌ পেমেন্ট প্রত্যাখ্যাত হয়েছে
                            </p>
                            <div className="text-xs text-red-600 space-y-1">
                              <p>📋 <strong>রিফান্ড প্রসেস:</strong></p>
                              <ul className="list-disc list-inside ml-2 space-y-0.5">
                                <li>ভুল ট্রান্সেকশন আইডি বা তথ্য থাকলে পুনরায় সঠিক তথ্য দিয়ে পেমেন্ট করুন</li>
                                <li>টাকা কেটে গেলে আমাদের সাথে যোগাযোগ করুন - ৩-৫ কার্যদিবসে রিফান্ড পাবেন</li>
                                <li>যোগাযোগ: support@timescard.com বা WhatsApp: 01815726006</li>
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      {(isExpiringSoon || isExpired) && (
                        <Button 
                          variant="secondary" 
                          onClick={() => navigate('/payment')}
                          className="font-semibold"
                        >
                          <ArrowUpCircle size={16} className="mr-2" />
                          {isExpired ? 'রিনিউ করুন' : 'রিনিউ করুন'}
                        </Button>
                      )}
                      {isActive && !isExpiringSoon && subscription.package_name && (
                        <UpgradePackageForm
                          userId={user!.id}
                          currentSubscriptionId={subscription.id}
                          currentPackageName={subscription.package_name}
                          currentExpiresAt={subscription.expires_at || undefined}
                          onSuccess={fetchSubscription}
                        />
                      )}
                      {subscription.status !== 'approved' && (
                        <Button variant="secondary" onClick={() => navigate('/payment')}>
                          {subscription.status === 'rejected' ? 'আবার চেষ্টা করুন' : 'প্যাকেজ দেখুন'}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress bar for active subscriptions */}
                  {isActive && subscription.expires_at && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span>সাবস্ক্রিপশন প্রোগ্রেস</span>
                        <span>{Math.max(0, Math.min(100, Math.round((daysRemaining / 30) * 100)))}% বাকি</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full rounded-full ${
                            isExpiringSoon ? 'bg-orange-500' : 'bg-primary'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(0, Math.min(100, (daysRemaining / 30) * 100))}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="bg-gradient-to-r from-primary/5 via-teal-50/50 to-secondary/5 rounded-2xl p-6 border-2 border-dashed border-primary/30">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Crown size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">সাবস্ক্রিপশন নেই</h3>
                    <p className="text-sm text-muted-foreground">
                      বিজনেস কার্ড তৈরি করতে একটি প্যাকেজ কিনুন
                    </p>
                  </div>
                </div>
                <Button variant="secondary" size="lg" onClick={() => navigate('/payment')} className="font-semibold">
                  <Crown size={18} className="mr-2" />
                  প্যাকেজ কিনুন
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Stats Grid with Usage Limits */}
        <motion.div 
          className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Usage Limits Card - First */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:row-span-2"
          >
            <UsageLimitsCard />
          </motion.div>
          
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

        {/* Combined Analytics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid lg:grid-cols-2 gap-6 mb-8"
        >
          {/* Combined Chart */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp size={20} className="text-primary" />
                <h3 className="font-bold text-foreground">Combined Analytics (Last 7 Days)</h3>
              </div>
              <AnalyticsExport
                data={{
                  totalViews: analytics.total_views,
                  totalClicks: analytics.total_clicks,
                  qrScans: analytics.qr_scans,
                  nfcTaps: analytics.nfc_taps,
                  landingPageViews: totalLandingViews,
                  dailyStats,
                  topLinks,
                  vcards: filteredVcards.map(v => ({
                    name: v.name,
                    views: viewsByVcardId[v.id] || 0,
                    template: v.template,
                  })),
                  landingPages: filteredLandingPages.map(p => ({
                    name: p.name,
                    views: p.total_views,
                    status: p.is_published ? 'Published' : 'Draft',
                  })),
                }}
              />
            </div>
            <div className="flex items-end justify-between h-40 gap-2">
              {dailyStats.map((day, index) => {
                const total = day.views + day.clicks;
                const height = maxDailyValue > 0 ? (total / maxDailyValue) * 100 : 0;
                const viewHeight = total > 0 ? (day.views / total) * height : 0;
                const clickHeight = total > 0 ? (day.clicks / total) * height : 0;
                
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col-reverse h-32">
                      <div 
                        className="w-full bg-primary/80 rounded-t transition-all"
                        style={{ height: `${viewHeight}%` }}
                        title={`${day.views} card views`}
                      />
                      <div 
                        className="w-full bg-secondary/80 rounded-t transition-all"
                        style={{ height: `${clickHeight}%` }}
                        title={`${day.clicks} link clicks`}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 justify-center flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary/80" />
                <span className="text-xs text-muted-foreground">Card Views</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-secondary/80" />
                <span className="text-xs text-muted-foreground">Link Clicks</span>
              </div>
            </div>
            
            {/* Summary Stats */}
            <div className="mt-6 pt-4 border-t border-border grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{analytics.total_views}</p>
                <p className="text-xs text-muted-foreground">Business Card Views</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{totalLandingViews}</p>
                <p className="text-xs text-muted-foreground">Landing Page Views</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{analytics.total_views + totalLandingViews}</p>
                <p className="text-xs text-muted-foreground">Total Views</p>
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

        {/* Landing Pages Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
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

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search landing pages..."
                value={landingSearch}
                onChange={(e) => setLandingSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={landingFilter} onValueChange={(v) => setLandingFilter(v as any)}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter size={14} className="mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredLandingPages.length === 0 && landingPages.length === 0 ? (
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
          ) : filteredLandingPages.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 border border-border text-center">
              <p className="text-muted-foreground">No landing pages match your search</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLandingPages.map((page, index) => (
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
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteLandingPage(page.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 size={14} />
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
          <div className="flex items-center justify-between mb-4">
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

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search business cards..."
                value={vcardSearch}
                onChange={(e) => setVcardSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={vcardFilter} onValueChange={(v) => setVcardFilter(v as any)}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter size={14} className="mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredVcards.length === 0 && vcards.length === 0 ? (
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
          ) : filteredVcards.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 border border-border text-center">
              <p className="text-muted-foreground">No business cards match your search</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVcards.map((card, index) => {
                // Get analytics for this card
                const cardViews = analyticsEvents.filter(e => e.vcard_id === card.id && e.event_type === 'view').length;
                const canEditCard = canEditTeam(card.team_id, card.user_id);
                const canDeleteCard = canDeleteTeam(card.team_id, card.user_id);
                const teamRole = getRole(card.team_id);

                return (
                  <motion.div
                    key={card.id}
                    className="bg-card rounded-2xl border border-border overflow-hidden group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    whileHover={{ y: -5, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {/* QR Code Hover Preview */}
                          <HoverCard openDelay={200} closeDelay={100}>
                            <HoverCardTrigger asChild>
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
                                <CreditCard size={20} className="text-primary" />
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-auto p-4" side="right" align="start">
                              <div className="flex flex-col items-center gap-3">
                                <QRCodeSVG 
                                  id={`qr-hover-${card.id}`}
                                  value={getCardUrl(card.slug)} 
                                  size={120}
                                  level="H"
                                  includeMargin
                                  fgColor={card.qr_foreground_color || '#000000'}
                                  bgColor={card.qr_background_color || '#FFFFFF'}
                                  imageSettings={card.qr_logo_url ? {
                                    src: card.qr_logo_url,
                                    height: 30,
                                    width: 30,
                                    excavate: true,
                                  } : undefined}
                                />
                                <p className="text-xs text-muted-foreground text-center">
                                  Scan to view card
                                </p>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                          <div>
                            <h3 className="font-bold text-foreground">{card.name}</h3>
                            <p className="text-xs text-muted-foreground">/c/{card.slug}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            card.is_active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {card.is_active ? '✓ Published' : '📝 Draft'}
                          </span>
                          {!card.is_active && (
                            <span className="text-xs text-muted-foreground italic">
                              (Public-এ দেখাবে না)
                            </span>
                          )}
                        </div>
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

                      {teamRole && teamRole !== 'owner' && (
                        <div className="mb-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase">
                            Team · {teamRole}
                          </span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => navigate(`/vcard/${card.id}`)}
                          disabled={!canEditCard}
                          title={!canEditCard ? 'অনুমতি নেই' : 'Edit'}
                        >
                          <Edit size={14} className="mr-1" />
                          {canEditCard ? 'Edit' : 'View'}
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
                        {canDeleteCard && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(card.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
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
