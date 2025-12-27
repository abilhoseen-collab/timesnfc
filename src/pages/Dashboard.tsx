import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  CreditCard, 
  BarChart3, 
  Eye, 
  MousePointer, 
  QrCode,
  Nfc,
  Edit,
  Trash2,
  LogOut,
  ShoppingCart,
  Package
} from 'lucide-react';
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

interface Analytics {
  total_views: number;
  total_clicks: number;
  qr_scans: number;
  nfc_taps: number;
}

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [vcards, setVcards] = useState<VCard[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    total_views: 0,
    total_clicks: 0,
    qr_scans: 0,
    nfc_taps: 0,
  });
  const [loading, setLoading] = useState(true);

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
    const { data, error } = await supabase
      .from('vcard_analytics')
      .select('event_type, vcard_id')
      .in('vcard_id', (await supabase.from('vcards').select('id').eq('user_id', user?.id)).data?.map(v => v.id) || []);

    if (!error && data) {
      setAnalytics({
        total_views: data.filter(a => a.event_type === 'view').length,
        total_clicks: data.filter(a => a.event_type === 'link_click').length,
        qr_scans: data.filter(a => a.event_type === 'qr_scan').length,
        nfc_taps: data.filter(a => a.event_type === 'nfc_tap').length,
      });
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
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
              onClick={() => navigate('/editor')}
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
                onClick={() => navigate('/editor')}
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

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => navigate(`/editor/${card.id}`)}
                      >
                        <Edit size={14} className="mr-1" />
                        Edit
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
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
