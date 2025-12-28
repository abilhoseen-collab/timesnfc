import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Loader2,
  Shield,
  Users,
  CreditCard,
  Package,
  Settings,
  ToggleLeft,
  ToggleRight,
  ArrowUpCircle,
  Truck
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import logo from '@/assets/logo.png';

interface Subscription {
  id: string;
  user_id: string;
  package_id: string;
  payment_method: string;
  transaction_id: string;
  sender_number: string | null;
  amount: number;
  status: string;
  payment_screenshot_url: string | null;
  bank_name: string | null;
  account_holder_name: string | null;
  payment_date: string;
  created_at: string;
  expires_at: string | null;
  admin_notes: string | null;
  packages?: {
    name: string;
    duration_days: number;
  } | null;
  user_profile?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

interface NFCGuestOrder {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  shipping_address: string;
  shipping_city: string;
  product_name: string;
  product_type: string;
  price: number;
  quantity: number;
  total_amount: number;
  payment_method: string;
  transaction_id: string | null;
  sender_number: string | null;
  bank_name: string | null;
  account_holder_name: string | null;
  payment_screenshot_url: string | null;
  status: string;
  shipping_status: string | null;
  admin_notes: string | null;
  created_at: string;
}

const SHIPPING_STATUSES = [
  { value: 'payment_received', label: 'Payment Received', color: 'bg-blue-100 text-blue-700' },
  { value: 'verified', label: 'Verified', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'shipped', label: 'Shipped', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-700' },
];

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Tab management
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'nfc-orders' | 'upgrades' | 'settings'>('subscriptions');

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [showSubsModal, setShowSubsModal] = useState(false);

  // NFC Orders state
  const [nfcOrders, setNfcOrders] = useState<NFCGuestOrder[]>([]);
  const [nfcLoading, setNfcLoading] = useState(true);
  const [selectedNfc, setSelectedNfc] = useState<NFCGuestOrder | null>(null);
  const [showNfcModal, setShowNfcModal] = useState(false);

  // Shared state
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Settings state
  const [templatesVisible, setTemplatesVisible] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Upgrade requests state
  const [upgradeRequests, setUpgradeRequests] = useState<any[]>([]);
  const [upgradesLoading, setUpgradesLoading] = useState(true);
  const [selectedUpgrade, setSelectedUpgrade] = useState<any | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!isAdmin) {
        navigate('/dashboard');
        toast({ 
          title: 'Access Denied', 
          description: 'You do not have admin privileges',
          variant: 'destructive' 
        });
      }
    }
  }, [user, authLoading, isAdmin, adminLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'subscriptions') {
        fetchSubscriptions();
      } else if (activeTab === 'nfc-orders') {
        fetchNfcOrders();
      } else if (activeTab === 'upgrades') {
        fetchUpgradeRequests();
      } else if (activeTab === 'settings') {
        fetchSettings();
      }
    }
  }, [isAdmin, filter, activeTab]);

  const fetchSubscriptions = async () => {
    setSubsLoading(true);
    
    let query = supabase
      .from('subscriptions')
      .select(`*, packages:package_id (name, duration_days)`)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data: subsData, error: subsError } = await query;

    if (subsError || !subsData) {
      setSubsLoading(false);
      return;
    }

    const userIds = [...new Set(subsData.map(s => s.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
    const enrichedSubs = subsData.map(sub => ({
      ...sub,
      user_profile: profilesMap.get(sub.user_id) || null
    }));

    setSubscriptions(enrichedSubs as Subscription[]);
    setSubsLoading(false);
  };

  const fetchNfcOrders = async () => {
    setNfcLoading(true);
    
    let query = supabase
      .from('nfc_guest_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;

    if (!error && data) {
      setNfcOrders(data as NFCGuestOrder[]);
    }
    setNfcLoading(false);
  };

  const getSignedImageUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from('payment-screenshots')
      .createSignedUrl(filePath, 3600);

    if (error) {
      toast({ title: 'Failed to load image', variant: 'destructive' });
      return null;
    }
    return data.signedUrl;
  };

  const viewScreenshot = async (filePath: string) => {
    const url = await getSignedImageUrl(filePath);
    if (url) {
      setImageUrl(url);
      setShowImageModal(true);
    }
  };

  const sendPaymentNotification = async (
    type: 'approved' | 'rejected',
    sub: Subscription,
    expiresAt?: string
  ) => {
    if (!sub.user_profile?.email) return;

    try {
      await supabase.functions.invoke('send-payment-notification', {
        body: {
          type,
          userEmail: sub.user_profile.email,
          userName: sub.user_profile.full_name || 'Valued Customer',
          packageName: sub.packages?.name || 'Premium',
          amount: sub.amount,
          expiresAt,
          adminNotes: adminNotes || undefined,
        },
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const fetchUpgradeRequests = async () => {
    setUpgradesLoading(true);
    let query = supabase
      .from('upgrade_requests')
      .select(`*, packages:target_package_id (name, price, duration_days)`)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;
    if (!error && data) {
      // Fetch user profiles
      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      const enriched = data.map(r => ({
        ...r,
        user_profile: profilesMap.get(r.user_id) || null
      }));
      setUpgradeRequests(enriched);
    }
    setUpgradesLoading(false);
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    const { data } = await supabase
      .from('site_settings')
      .select('*')
      .eq('key', 'templates_visible')
      .single();

    if (data) {
      const value = data.value as { enabled?: boolean } | null;
      setTemplatesVisible(value?.enabled || false);
    }
    setSettingsLoading(false);
  };

  const toggleTemplatesVisible = async () => {
    const newValue = !templatesVisible;
    const { error } = await supabase
      .from('site_settings')
      .update({ value: { enabled: newValue } })
      .eq('key', 'templates_visible');

    if (!error) {
      setTemplatesVisible(newValue);
      toast({ title: `Templates section ${newValue ? 'shown' : 'hidden'}` });
    }
  };

  const handleApproveSub = async (sub: Subscription) => {
    setProcessing(true);
    
    const expiresAt = new Date();
    const durationDays = sub.packages?.duration_days || 30;
    expiresAt.setDate(expiresAt.getDate() + durationDays);
    const expiresAtISO = expiresAt.toISOString();

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'approved',
        expires_at: expiresAtISO,
        admin_notes: adminNotes || null,
      })
      .eq('id', sub.id);

    if (error) {
      toast({ title: 'Failed to approve', variant: 'destructive' });
    } else {
      // Create user account and send credentials
      try {
        await supabase.functions.invoke('create-user-account', {
          body: {
            email: sub.user_profile?.email,
            fullName: sub.user_profile?.full_name || 'Valued Customer',
            packageName: sub.packages?.name || 'Premium',
            amount: sub.amount,
            expiresAt: expiresAtISO,
            subscriptionId: sub.id,
          },
        });
        toast({ title: 'Subscription approved! User account created and email sent.' });
      } catch (e) {
        console.error('User creation failed:', e);
        toast({ title: 'Approved but user creation failed', variant: 'destructive' });
      }
      setShowSubsModal(false);
      fetchSubscriptions();
    }
    setProcessing(false);
  };

  const handleRejectSub = async (sub: Subscription) => {
    if (!adminNotes.trim()) {
      toast({ title: 'Please provide a reason for rejection', variant: 'destructive' });
      return;
    }

    setProcessing(true);
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'rejected',
        admin_notes: adminNotes,
      })
      .eq('id', sub.id);

    if (error) {
      toast({ title: 'Failed to reject', variant: 'destructive' });
    } else {
      await sendPaymentNotification('rejected', sub);
      toast({ title: 'Subscription rejected' });
      setShowSubsModal(false);
      fetchSubscriptions();
    }
    setProcessing(false);
  };

  const handleApproveNfc = async (order: NFCGuestOrder) => {
    setProcessing(true);

    const { error } = await supabase
      .from('nfc_guest_orders')
      .update({
        status: 'approved',
        admin_notes: adminNotes || null,
      })
      .eq('id', order.id);

    if (error) {
      toast({ title: 'Failed to approve', variant: 'destructive' });
    } else {
      // Send notification email
      try {
        await supabase.functions.invoke('send-payment-notification', {
          body: {
            type: 'approved',
            userEmail: order.email,
            userName: order.full_name,
            packageName: order.product_name,
            amount: order.total_amount,
            adminNotes: adminNotes || undefined,
            isNfcOrder: true,
          },
        });
      } catch (e) {
        console.error('Notification failed:', e);
      }
      toast({ title: 'NFC Order approved! User can now register.' });
      setShowNfcModal(false);
      fetchNfcOrders();
    }
    setProcessing(false);
  };

  const handleRejectNfc = async (order: NFCGuestOrder) => {
    if (!adminNotes.trim()) {
      toast({ title: 'Please provide a reason for rejection', variant: 'destructive' });
      return;
    }

    setProcessing(true);
    const { error } = await supabase
      .from('nfc_guest_orders')
      .update({
        status: 'rejected',
        admin_notes: adminNotes,
      })
      .eq('id', order.id);

    if (error) {
      toast({ title: 'Failed to reject', variant: 'destructive' });
    } else {
      try {
        await supabase.functions.invoke('send-payment-notification', {
          body: {
            type: 'rejected',
            userEmail: order.email,
            userName: order.full_name,
            packageName: order.product_name,
            amount: order.total_amount,
            adminNotes: adminNotes,
            isNfcOrder: true,
          },
        });
      } catch (e) {
        console.error('Notification failed:', e);
      }
      toast({ title: 'NFC Order rejected' });
      setShowNfcModal(false);
      fetchNfcOrders();
    }
    setProcessing(false);
  };

  const handleUpdateShippingStatus = async (order: NFCGuestOrder, newStatus: string) => {
    setProcessing(true);
    const { error } = await supabase
      .from('nfc_guest_orders')
      .update({ shipping_status: newStatus })
      .eq('id', order.id);

    if (error) {
      toast({ title: 'Failed to update shipping status', variant: 'destructive' });
    } else {
      toast({ title: `Shipping status updated to ${newStatus}` });
      setSelectedNfc({ ...order, shipping_status: newStatus });
      fetchNfcOrders();
    }
    setProcessing(false);
  };

  const openSubDetails = (sub: Subscription) => {
    setSelectedSub(sub);
    setAdminNotes(sub.admin_notes || '');
    setShowSubsModal(true);
  };

  const openNfcDetails = (order: NFCGuestOrder) => {
    setSelectedNfc(order);
    setAdminNotes(order.admin_notes || '');
    setShowNfcModal(true);
  };

  const openUpgradeDetails = (upgrade: any) => {
    setSelectedUpgrade(upgrade);
    setAdminNotes(upgrade.admin_notes || '');
    setShowUpgradeModal(true);
  };

  const handleApproveUpgrade = async (upgrade: any) => {
    setProcessing(true);

    // Calculate new expiry date based on target package duration
    const expiresAt = new Date();
    const durationDays = upgrade.packages?.duration_days || 30;
    expiresAt.setDate(expiresAt.getDate() + durationDays);
    const expiresAtISO = expiresAt.toISOString();

    // Update the user's subscription to the new package
    if (upgrade.current_subscription_id) {
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({
          package_id: upgrade.target_package_id,
          amount: upgrade.packages?.price || upgrade.amount,
          expires_at: expiresAtISO,
          status: 'approved',
        })
        .eq('id', upgrade.current_subscription_id);

      if (subError) {
        toast({ title: 'Failed to update subscription', variant: 'destructive' });
        setProcessing(false);
        return;
      }
    }

    // Update upgrade request status
    const { error } = await supabase
      .from('upgrade_requests')
      .update({
        status: 'approved',
        admin_notes: adminNotes || null,
      })
      .eq('id', upgrade.id);

    if (error) {
      toast({ title: 'Failed to approve upgrade', variant: 'destructive' });
    } else {
      // Send notification
      try {
        await supabase.functions.invoke('send-payment-notification', {
          body: {
            type: 'approved',
            userEmail: upgrade.user_profile?.email,
            userName: upgrade.user_profile?.full_name || 'Valued Customer',
            packageName: upgrade.packages?.name || 'Premium',
            amount: upgrade.amount,
            expiresAt: expiresAtISO,
            adminNotes: adminNotes || undefined,
            isUpgrade: true,
          },
        });
      } catch (e) {
        console.error('Notification failed:', e);
      }
      toast({ title: 'Upgrade approved! Subscription updated successfully.' });
      setShowUpgradeModal(false);
      fetchUpgradeRequests();
    }
    setProcessing(false);
  };

  const handleRejectUpgrade = async (upgrade: any) => {
    if (!adminNotes.trim()) {
      toast({ title: 'Please provide a reason for rejection', variant: 'destructive' });
      return;
    }

    setProcessing(true);
    const { error } = await supabase
      .from('upgrade_requests')
      .update({
        status: 'rejected',
        admin_notes: adminNotes,
      })
      .eq('id', upgrade.id);

    if (error) {
      toast({ title: 'Failed to reject upgrade', variant: 'destructive' });
    } else {
      // Send notification
      try {
        await supabase.functions.invoke('send-payment-notification', {
          body: {
            type: 'rejected',
            userEmail: upgrade.user_profile?.email,
            userName: upgrade.user_profile?.full_name || 'Valued Customer',
            packageName: upgrade.packages?.name || 'Premium',
            amount: upgrade.amount,
            adminNotes: adminNotes,
            isUpgrade: true,
          },
        });
      } catch (e) {
        console.error('Notification failed:', e);
      }
      toast({ title: 'Upgrade request rejected' });
      setShowUpgradeModal(false);
      fetchUpgradeRequests();
    }
    setProcessing(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle size={12} /> Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1"><XCircle size={12} /> Rejected</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1"><Clock size={12} /> Pending</span>;
    }
  };

  const subsStats = {
    total: subscriptions.length,
    pending: subscriptions.filter(s => s.status === 'pending').length,
    approved: subscriptions.filter(s => s.status === 'approved').length,
    rejected: subscriptions.filter(s => s.status === 'rejected').length,
  };

  const nfcStats = {
    total: nfcOrders.length,
    pending: nfcOrders.filter(s => s.status === 'pending').length,
    approved: nfcOrders.filter(s => s.status === 'approved').length,
    rejected: nfcOrders.filter(s => s.status === 'rejected').length,
  };

  const stats = activeTab === 'subscriptions' ? subsStats : nfcStats;
  const loading = activeTab === 'subscriptions' ? subsLoading : nfcLoading;

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-orange-50/30">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={20} />
              Dashboard
            </button>
          </div>
          <img src={logo} alt="Logo" className="h-10 cursor-pointer" onClick={() => navigate('/')} />
          <div className="flex items-center gap-2 text-primary">
            <Shield size={20} />
            <span className="font-semibold">Admin Panel</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground mb-2">Payment Verification</h1>
          <p className="text-muted-foreground mb-6">Review and approve pending payments</p>

          {/* Main Tabs */}
          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={() => { setActiveTab('subscriptions'); setFilter('pending'); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'subscriptions'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-card border border-border text-foreground hover:bg-accent'
              }`}
            >
              <CreditCard size={18} />
              Subscriptions
            </button>
            <button
              onClick={() => { setActiveTab('nfc-orders'); setFilter('pending'); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'nfc-orders'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-card border border-border text-foreground hover:bg-accent'
              }`}
            >
              <Package size={18} />
              NFC Orders
            </button>
            <button
              onClick={() => { setActiveTab('upgrades'); setFilter('pending'); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'upgrades'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-card border border-border text-foreground hover:bg-accent'
              }`}
            >
              <ArrowUpCircle size={18} />
              Upgrade Requests
            </button>
            <button
              onClick={() => { setActiveTab('settings'); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-card border border-border text-foreground hover:bg-accent'
              }`}
            >
              <Settings size={18} />
              Site Settings
            </button>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CreditCard size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Clock size={20} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.approved}</p>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <XCircle size={20} className="text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.rejected}</p>
                  <p className="text-xs text-muted-foreground">Rejected</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-foreground hover:bg-accent'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          {activeTab === 'settings' ? (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold text-foreground mb-6 flex items-center gap-2">
                <Settings size={20} className="text-primary" />
                Site Settings
              </h3>
              
              {settingsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Templates Visibility */}
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
                    <div>
                      <p className="font-medium text-foreground">Templates Section</p>
                      <p className="text-sm text-muted-foreground">Show or hide the "Explore Our Templates" section on homepage</p>
                    </div>
                    <button
                      onClick={toggleTemplatesVisible}
                      className={`p-2 rounded-lg transition-colors ${
                        templatesVisible ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {templatesVisible ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'upgrades' ? (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {upgradesLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : upgradeRequests.length === 0 ? (
                <div className="p-8 text-center">
                  <ArrowUpCircle size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No upgrade requests found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">User</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Target Package</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {upgradeRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-foreground">{req.user_profile?.full_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{req.user_profile?.email || ''}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-foreground">{req.packages?.name || 'N/A'}</td>
                          <td className="px-4 py-3 font-medium text-foreground">৳{req.amount}</td>
                          <td className="px-4 py-3">{getStatusBadge(req.status)}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {new Date(req.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <Button size="sm" variant="outline" onClick={() => openUpgradeDetails(req)}>
                              <Eye size={14} className="mr-1" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : activeTab === 'subscriptions' ? (
                subscriptions.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users size={48} className="mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No subscriptions found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">User</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Package</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Method</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {subscriptions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-foreground">{sub.user_profile?.full_name || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">{sub.user_profile?.email || ''}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-foreground">{sub.packages?.name || 'N/A'}</td>
                            <td className="px-4 py-3 font-medium text-foreground">৳{sub.amount}</td>
                            <td className="px-4 py-3 text-foreground capitalize">{sub.payment_method}</td>
                            <td className="px-4 py-3">{getStatusBadge(sub.status)}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {new Date(sub.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <Button size="sm" variant="outline" onClick={() => openSubDetails(sub)}>
                                <Eye size={14} className="mr-1" />
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                nfcOrders.length === 0 ? (
                  <div className="p-8 text-center">
                    <Package size={48} className="mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No NFC orders found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Customer</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Product</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Method</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {nfcOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-foreground">{order.full_name}</p>
                                <p className="text-xs text-muted-foreground">{order.email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-foreground">{order.product_name}</td>
                            <td className="px-4 py-3 font-medium text-foreground">৳{order.total_amount}</td>
                            <td className="px-4 py-3 text-foreground capitalize">{order.payment_method}</td>
                            <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <Button size="sm" variant="outline" onClick={() => openNfcDetails(order)}>
                                <Eye size={14} className="mr-1" />
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          )}
        </motion.div>
      </main>

      {/* Subscription Details Modal */}
      <Dialog open={showSubsModal} onOpenChange={setShowSubsModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Subscription Payment Details</DialogTitle>
          </DialogHeader>
          {selectedSub && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">User</p>
                  <p className="font-medium">{selectedSub.user_profile?.full_name || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">{selectedSub.user_profile?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Package</p>
                  <p className="font-medium">{selectedSub.packages?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedSub.packages?.duration_days} days</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-medium text-lg">৳{selectedSub.amount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment Method</p>
                  <p className="font-medium capitalize">{selectedSub.payment_method}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Transaction ID</p>
                  <p className="font-medium font-mono">{selectedSub.transaction_id}</p>
                </div>
                {selectedSub.sender_number && (
                  <div>
                    <p className="text-xs text-muted-foreground">Sender Number</p>
                    <p className="font-medium">{selectedSub.sender_number}</p>
                  </div>
                )}
              </div>

              {selectedSub.payment_screenshot_url && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Payment Screenshot</p>
                  <Button variant="outline" size="sm" onClick={() => viewScreenshot(selectedSub.payment_screenshot_url!)}>
                    <Eye size={14} className="mr-1" /> View Screenshot
                  </Button>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-2">Admin Notes</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this payment..."
                  rows={3}
                />
              </div>

              {selectedSub.status === 'pending' && (
                <div className="flex gap-3">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApproveSub(selectedSub)}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="animate-spin mr-2" size={16} /> : <CheckCircle size={16} className="mr-2" />}
                    Approve
                  </Button>
                  <Button 
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleRejectSub(selectedSub)}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="animate-spin mr-2" size={16} /> : <XCircle size={16} className="mr-2" />}
                    Reject
                  </Button>
                </div>
              )}

              {selectedSub.status !== 'pending' && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedSub.status === 'approved' ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : (
                      <XCircle size={16} className="text-red-600" />
                    )}
                    <span className="font-medium capitalize">{selectedSub.status}</span>
                  </div>
                  {selectedSub.expires_at && (
                    <p className="text-sm text-muted-foreground">
                      Expires: {new Date(selectedSub.expires_at).toLocaleDateString()}
                    </p>
                  )}
                  {selectedSub.admin_notes && (
                    <p className="text-sm mt-2">{selectedSub.admin_notes}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* NFC Order Details Modal */}
      <Dialog open={showNfcModal} onOpenChange={setShowNfcModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>NFC Order Details</DialogTitle>
          </DialogHeader>
          {selectedNfc && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Customer Name</p>
                  <p className="font-medium">{selectedNfc.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedNfc.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedNfc.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Product</p>
                  <p className="font-medium">{selectedNfc.product_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <p className="font-medium">{selectedNfc.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="font-medium text-lg">৳{selectedNfc.total_amount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment Method</p>
                  <p className="font-medium capitalize">{selectedNfc.payment_method}</p>
                </div>
                {selectedNfc.transaction_id && (
                  <div>
                    <p className="text-xs text-muted-foreground">Transaction ID</p>
                    <p className="font-medium font-mono">{selectedNfc.transaction_id}</p>
                  </div>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Shipping Address</p>
                <p className="text-sm">{selectedNfc.shipping_address}, {selectedNfc.shipping_city}</p>
              </div>

              {/* Shipping Status Control */}
              {selectedNfc.status === 'approved' && (
                <div className="bg-accent/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Truck size={18} className="text-primary" />
                    <p className="font-medium text-foreground">Shipping Status</p>
                  </div>
                  <Select
                    value={selectedNfc.shipping_status || 'payment_received'}
                    onValueChange={(value) => handleUpdateShippingStatus(selectedNfc, value)}
                    disabled={processing}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIPPING_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedNfc.payment_screenshot_url && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Payment Screenshot</p>
                  <Button variant="outline" size="sm" onClick={() => viewScreenshot(selectedNfc.payment_screenshot_url!)}>
                    <Eye size={14} className="mr-1" /> View Screenshot
                  </Button>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-2">Admin Notes</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this order..."
                  rows={3}
                />
              </div>

              {selectedNfc.status === 'pending' && (
                <div className="flex gap-3">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApproveNfc(selectedNfc)}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="animate-spin mr-2" size={16} /> : <CheckCircle size={16} className="mr-2" />}
                    Approve
                  </Button>
                  <Button 
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleRejectNfc(selectedNfc)}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="animate-spin mr-2" size={16} /> : <XCircle size={16} className="mr-2" />}
                    Reject
                  </Button>
                </div>
              )}

              {selectedNfc.status !== 'pending' && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedNfc.status === 'approved' ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : (
                      <XCircle size={16} className="text-red-600" />
                    )}
                    <span className="font-medium capitalize">{selectedNfc.status}</span>
                  </div>
                  {selectedNfc.admin_notes && (
                    <p className="text-sm mt-2">{selectedNfc.admin_notes}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upgrade Details Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upgrade Request Details</DialogTitle>
          </DialogHeader>
          {selectedUpgrade && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">User Name</p>
                  <p className="font-medium">{selectedUpgrade.user_profile?.full_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedUpgrade.user_profile?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Target Package</p>
                  <p className="font-medium">{selectedUpgrade.packages?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-medium text-lg">৳{selectedUpgrade.amount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment Method</p>
                  <p className="font-medium capitalize">{selectedUpgrade.payment_method}</p>
                </div>
                {selectedUpgrade.transaction_id && (
                  <div>
                    <p className="text-xs text-muted-foreground">Transaction ID</p>
                    <p className="font-medium font-mono">{selectedUpgrade.transaction_id}</p>
                  </div>
                )}
                {selectedUpgrade.sender_number && (
                  <div>
                    <p className="text-xs text-muted-foreground">Sender Number</p>
                    <p className="font-medium">{selectedUpgrade.sender_number}</p>
                  </div>
                )}
                {selectedUpgrade.bank_name && (
                  <div>
                    <p className="text-xs text-muted-foreground">Bank Name</p>
                    <p className="font-medium">{selectedUpgrade.bank_name}</p>
                  </div>
                )}
              </div>

              {selectedUpgrade.payment_screenshot_url && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Payment Screenshot</p>
                  <Button variant="outline" size="sm" onClick={() => viewScreenshot(selectedUpgrade.payment_screenshot_url!)}>
                    <Eye size={14} className="mr-1" /> View Screenshot
                  </Button>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-2">Admin Notes</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this upgrade request..."
                  rows={3}
                />
              </div>

              {selectedUpgrade.status === 'pending' && (
                <div className="flex gap-3">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApproveUpgrade(selectedUpgrade)}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="animate-spin mr-2" size={16} /> : <CheckCircle size={16} className="mr-2" />}
                    Approve
                  </Button>
                  <Button 
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleRejectUpgrade(selectedUpgrade)}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="animate-spin mr-2" size={16} /> : <XCircle size={16} className="mr-2" />}
                    Reject
                  </Button>
                </div>
              )}

              {selectedUpgrade.status !== 'pending' && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedUpgrade.status === 'approved' ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : (
                      <XCircle size={16} className="text-red-600" />
                    )}
                    <span className="font-medium capitalize">{selectedUpgrade.status}</span>
                  </div>
                  {selectedUpgrade.admin_notes && (
                    <p className="text-sm mt-2">{selectedUpgrade.admin_notes}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Screenshot</DialogTitle>
          </DialogHeader>
          {imageUrl && (
            <div className="flex justify-center">
              <img src={imageUrl} alt="Payment Screenshot" className="max-h-[70vh] rounded-lg" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
