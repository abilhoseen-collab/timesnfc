import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
  Download
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';

interface VCard {
  id: string;
  name: string;
  job_title: string;
  company: string;
  template: string;
  is_active: boolean;
  slug: string;
  created_at: string;
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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchVCards();
      fetchAnalytics();
    }
  }, [user]);

  const fetchVCards = async () => {
    const { data, error } = await supabase
      .from('vcards')
      .select('*')
      .eq('user_id', user?.id)
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

        {/* Cards Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <CreditCard size={24} className="text-primary" />
              Your Business Cards
            </h2>
            <Button 
              variant="secondary" 
              onClick={() => navigate('/vcard/new')}
              className="font-semibold"
            >
              <Plus size={18} className="mr-2" />
              Create New Card
            </Button>
          </div>

          {vcards.length === 0 ? (
            <motion.div 
              className="bg-card rounded-2xl p-12 border border-border text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center">
                <CreditCard size={32} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">No cards yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first digital business card to get started
              </p>
              <Button 
                variant="secondary" 
                onClick={() => navigate('/vcard/new')}
                className="font-semibold"
              >
                <Plus size={18} className="mr-2" />
                Create Your First Card
              </Button>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vcards.map((card, index) => (
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
                      <div>
                        <h3 className="font-bold text-foreground">{card.name}</h3>
                        <p className="text-sm text-muted-foreground">{card.job_title}</p>
                        {card.company && (
                          <p className="text-sm text-muted-foreground">{card.company}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        card.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {card.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mb-4">
                      Template: <span className="capitalize">{card.template}</span>
                    </div>

                    {/* QR Code Preview */}
                    {card.slug && (
                      <div 
                        className="flex justify-center mb-4 cursor-pointer"
                        onClick={() => {
                          setSelectedCard(card);
                          setShowQRModal(true);
                        }}
                      >
                        <div className="p-3 bg-white rounded-xl shadow-sm border border-border">
                          <QRCodeSVG 
                            id={`qr-${card.id}`}
                            value={getCardUrl(card.slug)} 
                            size={80}
                            level="M"
                          />
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 mb-3">
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
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedCard(card);
                          setShowQRModal(true);
                        }}
                      >
                        <QrCode size={14} />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(card.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>

                    {/* Share Links */}
                    {card.slug && (
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex-1 text-xs"
                          onClick={() => copyCardUrl(card.slug)}
                        >
                          <Copy size={12} className="mr-1" />
                          Copy Link
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex-1 text-xs"
                          onClick={() => window.open(getCardUrl(card.slug), '_blank')}
                        >
                          <ExternalLink size={12} className="mr-1" />
                          View
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
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