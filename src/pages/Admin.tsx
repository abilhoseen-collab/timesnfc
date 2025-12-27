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
  AlertTriangle
} from 'lucide-react';
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

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

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
      fetchSubscriptions();
    }
  }, [isAdmin, filter]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    
    // First fetch subscriptions with packages
    let query = supabase
      .from('subscriptions')
      .select(`
        *,
        packages:package_id (name, duration_days)
      `)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data: subsData, error: subsError } = await query;

    if (subsError || !subsData) {
      setLoading(false);
      return;
    }

    // Fetch profiles for all unique user_ids
    const userIds = [...new Set(subsData.map(s => s.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    // Merge profiles into subscriptions
    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
    const enrichedSubs = subsData.map(sub => ({
      ...sub,
      user_profile: profilesMap.get(sub.user_id) || null
    }));

    setSubscriptions(enrichedSubs as Subscription[]);
    setLoading(false);
  };

  const getSignedImageUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from('payment-screenshots')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

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

  const handleApprove = async (sub: Subscription) => {
    setProcessing(true);
    
    const expiresAt = new Date();
    const durationDays = sub.packages?.duration_days || 30;
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'approved',
        expires_at: expiresAt.toISOString(),
        admin_notes: adminNotes || null,
      })
      .eq('id', sub.id);

    if (error) {
      toast({ title: 'Failed to approve', variant: 'destructive' });
    } else {
      toast({ title: 'Subscription approved!' });
      setShowDetailsModal(false);
      fetchSubscriptions();
    }
    setProcessing(false);
  };

  const handleReject = async (sub: Subscription) => {
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
      toast({ title: 'Subscription rejected' });
      setShowDetailsModal(false);
      fetchSubscriptions();
    }
    setProcessing(false);
  };

  const openDetails = (sub: Subscription) => {
    setSelectedSub(sub);
    setAdminNotes(sub.admin_notes || '');
    setShowDetailsModal(true);
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

  const stats = {
    total: subscriptions.length,
    pending: subscriptions.filter(s => s.status === 'pending').length,
    approved: subscriptions.filter(s => s.status === 'approved').length,
    rejected: subscriptions.filter(s => s.status === 'rejected').length,
  };

  if (authLoading || adminLoading || (loading && subscriptions.length === 0)) {
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
        <div className="container-custom flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={20} />
              Dashboard
            </button>
          </div>
          <img src={logo} alt="Logo" className="h-10" onClick={() => navigate('/')} />
          <div className="flex items-center gap-2 text-primary">
            <Shield size={20} />
            <span className="font-semibold">Admin Panel</span>
          </div>
        </div>
      </header>

      <main className="container-custom py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Payment Verification</h1>
          <p className="text-muted-foreground mb-8">Review and approve pending subscription payments</p>

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

          {/* Subscriptions Table */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : subscriptions.length === 0 ? (
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
                          <Button size="sm" variant="outline" onClick={() => openDetails(sub)}>
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
        </motion.div>
      </main>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
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
                {selectedSub.bank_name && (
                  <div>
                    <p className="text-xs text-muted-foreground">Bank Name</p>
                    <p className="font-medium">{selectedSub.bank_name}</p>
                  </div>
                )}
                {selectedSub.account_holder_name && (
                  <div>
                    <p className="text-xs text-muted-foreground">Account Holder</p>
                    <p className="font-medium">{selectedSub.account_holder_name}</p>
                  </div>
                )}
              </div>

              {selectedSub.payment_screenshot_url && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Payment Screenshot</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => viewScreenshot(selectedSub.payment_screenshot_url!)}
                  >
                    <Eye size={14} className="mr-1" />
                    View Screenshot
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
                    onClick={() => handleApprove(selectedSub)}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="animate-spin mr-2" size={16} /> : <CheckCircle size={16} className="mr-2" />}
                    Approve
                  </Button>
                  <Button 
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleReject(selectedSub)}
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
