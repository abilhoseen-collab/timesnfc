import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import HomePageContentManager from '@/components/admin/HomePageContentManager';
import PackageManager from '@/components/admin/PackageManager';
import DashboardOverview from '@/components/admin/DashboardOverview';
import PaymentSettingsManager from '@/components/admin/PaymentSettingsManager';
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
  Truck,
  Home,
  Search,
  Filter,
  UserCog,
  X,
  LayoutDashboard
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'subscriptions' | 'nfc-orders' | 'upgrades' | 'users' | 'settings' | 'homepage' | 'packages' | 'payment-settings'>('dashboard');

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

  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'moderator' | 'user'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'expired' | 'none'>('all');
  const [roleUpdateLoading, setRoleUpdateLoading] = useState(false);

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
      } else if (activeTab === 'users') {
        fetchUsers();
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

  const fetchUsers = async () => {
    setUsersLoading(true);
    
    // Fetch all profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError || !profilesData) {
      setUsersLoading(false);
      return;
    }

    // Fetch all subscriptions
    const { data: subsData } = await supabase
      .from('subscriptions')
      .select(`*, packages:package_id (name, duration_days)`)
      .eq('status', 'approved');

    // Fetch all user roles
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('*');

    // Create maps for quick lookup
    const subsMap = new Map<string, any>();
    subsData?.forEach(sub => {
      if (!subsMap.has(sub.user_id) || new Date(sub.created_at) > new Date(subsMap.get(sub.user_id).created_at)) {
        subsMap.set(sub.user_id, sub);
      }
    });

    const rolesMap = new Map<string, string[]>();
    rolesData?.forEach(role => {
      const existing = rolesMap.get(role.user_id) || [];
      existing.push(role.role);
      rolesMap.set(role.user_id, existing);
    });

    // Enrich users with subscription and role info
    const enrichedUsers = profilesData.map(profile => ({
      ...profile,
      subscription: subsMap.get(profile.id) || null,
      roles: rolesMap.get(profile.id) || []
    }));

    setUsers(enrichedUsers);
    setUsersLoading(false);
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(u => {
    // Search filter
    const searchLower = userSearchQuery.toLowerCase();
    const matchesSearch = !userSearchQuery || 
      u.full_name?.toLowerCase().includes(searchLower) ||
      u.email?.toLowerCase().includes(searchLower);

    // Role filter
    let matchesRole = true;
    if (userRoleFilter === 'admin') {
      matchesRole = u.roles.includes('admin');
    } else if (userRoleFilter === 'moderator') {
      matchesRole = u.roles.includes('moderator');
    } else if (userRoleFilter === 'user') {
      matchesRole = !u.roles.includes('admin') && !u.roles.includes('moderator');
    }

    // Status filter
    let matchesStatus = true;
    if (userStatusFilter === 'active') {
      matchesStatus = u.subscription && u.subscription.expires_at && new Date(u.subscription.expires_at) > new Date();
    } else if (userStatusFilter === 'expired') {
      matchesStatus = u.subscription && (!u.subscription.expires_at || new Date(u.subscription.expires_at) <= new Date());
    } else if (userStatusFilter === 'none') {
      matchesStatus = !u.subscription;
    }

    return matchesSearch && matchesRole && matchesStatus;
  });

  const assignRole = async (userId: string, role: 'admin' | 'moderator') => {
    setRoleUpdateLoading(true);
    
    // Check if role already exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', role)
      .maybeSingle();

    if (existingRole) {
      toast({ title: `User already has ${role} role`, variant: 'destructive' });
      setRoleUpdateLoading(false);
      return;
    }

    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role });

    if (error) {
      toast({ title: `Failed to assign ${role} role`, variant: 'destructive' });
    } else {
      toast({ title: `${role.charAt(0).toUpperCase() + role.slice(1)} role assigned successfully` });
      fetchUsers();
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({
          ...selectedUser,
          roles: [...selectedUser.roles, role]
        });
      }
    }
    setRoleUpdateLoading(false);
  };

  const removeRole = async (userId: string, role: 'admin' | 'moderator') => {
    setRoleUpdateLoading(true);
    
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);

    if (error) {
      toast({ title: `Failed to remove ${role} role`, variant: 'destructive' });
    } else {
      toast({ title: `${role.charAt(0).toUpperCase() + role.slice(1)} role removed successfully` });
      fetchUsers();
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({
          ...selectedUser,
          roles: selectedUser.roles.filter((r: string) => r !== role)
        });
      }
    }
    setRoleUpdateLoading(false);
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

  // Calculate expected pro-rated amount for validation
  const calculateExpectedProRated = (upgrade: any): { 
    expectedAmount: number; 
    daysRemaining: number; 
    creditAmount: number;
    isValid: boolean;
    difference: number;
  } | null => {
    if (!upgrade.current_subscription_id) {
      return { expectedAmount: upgrade.packages?.price || upgrade.amount, daysRemaining: 0, creditAmount: 0, isValid: true, difference: 0 };
    }

    // Find current subscription details
    const currentSub = subscriptions.find(s => s.id === upgrade.current_subscription_id);
    if (!currentSub || !currentSub.expires_at) {
      return { expectedAmount: upgrade.packages?.price || upgrade.amount, daysRemaining: 0, creditAmount: 0, isValid: true, difference: 0 };
    }

    const now = new Date();
    const expiresAt = new Date(currentSub.expires_at);
    const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    if (daysRemaining <= 0) {
      const expected = upgrade.packages?.price || 0;
      return { expectedAmount: expected, daysRemaining: 0, creditAmount: 0, isValid: Math.abs(upgrade.amount - expected) <= 50, difference: upgrade.amount - expected };
    }

    // Calculate daily rate of current package
    const currentPackagePrice = currentSub.packages?.duration_days ? (currentSub.amount / currentSub.packages.duration_days) : 0;
    const creditAmount = Math.round(currentPackagePrice * daysRemaining);
    const expectedAmount = Math.max(0, (upgrade.packages?.price || 0) - creditAmount);
    
    // Allow ৳50 tolerance for rounding differences
    const difference = upgrade.amount - expectedAmount;
    const isValid = Math.abs(difference) <= 50;

    return { expectedAmount, daysRemaining, creditAmount, isValid, difference };
  };

  const handleApproveUpgrade = async (upgrade: any) => {
    setProcessing(true);

    // Validate pro-rated amount
    const validation = calculateExpectedProRated(upgrade);
    if (validation && !validation.isValid) {
      toast({ 
        title: 'পেমেন্ট ভ্যালিডেশন ব্যর্থ', 
        description: `প্রত্যাশিত: ৳${validation.expectedAmount}, প্রাপ্ত: ৳${upgrade.amount} (পার্থক্য: ৳${Math.abs(validation.difference)})`,
        variant: 'destructive' 
      });
      setProcessing(false);
      return;
    }

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
              onClick={() => { setActiveTab('dashboard'); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-card border border-border text-foreground hover:bg-accent'
              }`}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>
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
              onClick={() => { setActiveTab('users'); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'users'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-card border border-border text-foreground hover:bg-accent'
              }`}
            >
              <Users size={18} />
              Users
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
            <button
              onClick={() => { setActiveTab('homepage'); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'homepage'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-card border border-border text-foreground hover:bg-accent'
              }`}
            >
              <Home size={18} />
              Home Page
            </button>
            <button
              onClick={() => { setActiveTab('packages'); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'packages'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-card border border-border text-foreground hover:bg-accent'
              }`}
            >
              <Package size={18} />
              Packages
            </button>
            <button
              onClick={() => { setActiveTab('payment-settings'); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'payment-settings'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-card border border-border text-foreground hover:bg-accent'
              }`}
            >
              <CreditCard size={18} />
              Payment Settings
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
          {activeTab === 'dashboard' ? (
            <DashboardOverview />
          ) : activeTab === 'packages' ? (
            <div className="bg-card rounded-2xl border border-border p-6">
              <PackageManager />
            </div>
          ) : activeTab === 'homepage' ? (
            <div className="bg-card rounded-2xl border border-border p-6">
              <HomePageContentManager />
            </div>
          ) : activeTab === 'payment-settings' ? (
            <div className="bg-card rounded-2xl border border-border p-6">
              <PaymentSettingsManager />
            </div>
          ) : activeTab === 'users' ? (
            <div className="space-y-4">
              {/* Search and Filter Bar */}
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {userSearchQuery && (
                      <button
                        onClick={() => setUserSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  
                  {/* Role Filter */}
                  <Select value={userRoleFilter} onValueChange={(v: any) => setUserRoleFilter(v)}>
                    <SelectTrigger className="w-full md:w-40">
                      <div className="flex items-center gap-2">
                        <UserCog size={16} className="text-muted-foreground" />
                        <SelectValue placeholder="Role" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="user">Regular User</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Status Filter */}
                  <Select value={userStatusFilter} onValueChange={(v: any) => setUserStatusFilter(v)}>
                    <SelectTrigger className="w-full md:w-44">
                      <div className="flex items-center gap-2">
                        <Filter size={16} className="text-muted-foreground" />
                        <SelectValue placeholder="Status" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active Sub</SelectItem>
                      <SelectItem value="expired">Expired Sub</SelectItem>
                      <SelectItem value="none">No Subscription</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Results Count */}
                <div className="mt-3 text-sm text-muted-foreground">
                  Showing {filteredUsers.length} of {users.length} users
                </div>
              </div>
              
              {/* Users Table */}
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                {usersLoading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="animate-spin mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users size={48} className="mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No users found matching your criteria</p>
                    {(userSearchQuery || userRoleFilter !== 'all' || userStatusFilter !== 'all') && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          setUserSearchQuery('');
                          setUserRoleFilter('all');
                          setUserStatusFilter('all');
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">User</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Package</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Expires</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Role</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Joined</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {u.avatar_url ? (
                                  <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-primary font-medium">
                                      {u.full_name?.charAt(0) || u.email?.charAt(0) || '?'}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-foreground">{u.full_name || 'Unknown'}</p>
                                  <p className="text-xs text-muted-foreground">{u.email || ''}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-foreground">
                              {u.subscription?.packages?.name || 'No Package'}
                            </td>
                            <td className="px-4 py-3">
                              {u.subscription ? (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  u.subscription.expires_at && new Date(u.subscription.expires_at) > new Date()
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {u.subscription.expires_at && new Date(u.subscription.expires_at) > new Date()
                                    ? 'Active'
                                    : 'Expired'}
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                  No Sub
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {u.subscription?.expires_at 
                                ? new Date(u.subscription.expires_at).toLocaleDateString()
                                : '-'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1 flex-wrap">
                                {u.roles.includes('admin') && (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                    Admin
                                  </span>
                                )}
                                {u.roles.includes('moderator') && (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                    Moderator
                                  </span>
                                )}
                                {!u.roles.includes('admin') && !u.roles.includes('moderator') && (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                    User
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setShowUserModal(true);
                                }}
                              >
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
            </div>
          ) : activeTab === 'settings' ? (
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

              {/* Pro-rated Validation Info */}
              {selectedUpgrade.status === 'pending' && (() => {
                const validation = calculateExpectedProRated(selectedUpgrade);
                if (!validation) return null;
                return (
                  <div className={`p-4 rounded-lg border ${validation.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {validation.isValid ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <XCircle size={16} className="text-red-600" />
                      )}
                      <span className={`font-medium text-sm ${validation.isValid ? 'text-green-700' : 'text-red-700'}`}>
                        প্রো-রেটেড ভ্যালিডেশন
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">টার্গেট প্যাকেজ মূল্য:</span>
                        <span className="font-medium">৳{selectedUpgrade.packages?.price || 0}</span>
                      </div>
                      {validation.daysRemaining > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>ক্রেডিট ({validation.daysRemaining} দিন বাকি):</span>
                          <span>- ৳{validation.creditAmount}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-medium border-t pt-1 mt-1">
                        <span>প্রত্যাশিত পেমেন্ট:</span>
                        <span className="text-primary">৳{validation.expectedAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>প্রাপ্ত পেমেন্ট:</span>
                        <span className={validation.isValid ? 'text-green-600' : 'text-red-600'}>৳{selectedUpgrade.amount}</span>
                      </div>
                      {!validation.isValid && (
                        <p className="text-xs text-red-600 mt-2">
                          ⚠️ পেমেন্ট পার্থক্য: ৳{Math.abs(validation.difference)} - ৫০ টাকার বেশি পার্থক্য গ্রহণযোগ্য নয়
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

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

      {/* User Details Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details & Role Management</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedUser.avatar_url ? (
                  <img src={selectedUser.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-xl">
                      {selectedUser.full_name?.charAt(0) || selectedUser.email?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg text-foreground">{selectedUser.full_name || 'Unknown'}</h3>
                  <p className="text-muted-foreground">{selectedUser.email || ''}</p>
                  <div className="flex gap-2 mt-1">
                    {selectedUser.roles.includes('admin') && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Admin</span>
                    )}
                    {selectedUser.roles.includes('moderator') && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Moderator</span>
                    )}
                    {!selectedUser.roles.includes('admin') && !selectedUser.roles.includes('moderator') && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">User</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">User ID</p>
                  <p className="font-mono text-sm break-all">{selectedUser.id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Joined</p>
                  <p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Role Management */}
              <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <UserCog size={16} className="text-purple-600" />
                  Role Management
                </h4>
                <div className="space-y-3">
                  {/* Admin Role */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Admin</p>
                      <p className="text-xs text-muted-foreground">Full access to admin panel</p>
                    </div>
                    {selectedUser.roles.includes('admin') ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeRole(selectedUser.id, 'admin')}
                        disabled={roleUpdateLoading}
                      >
                        {roleUpdateLoading ? <Loader2 className="animate-spin" size={14} /> : <X size={14} className="mr-1" />}
                        Remove
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => assignRole(selectedUser.id, 'admin')}
                        disabled={roleUpdateLoading}
                      >
                        {roleUpdateLoading ? <Loader2 className="animate-spin" size={14} /> : <Shield size={14} className="mr-1" />}
                        Assign
                      </Button>
                    )}
                  </div>
                  
                  {/* Moderator Role */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Moderator</p>
                      <p className="text-xs text-muted-foreground">Limited admin access</p>
                    </div>
                    {selectedUser.roles.includes('moderator') ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeRole(selectedUser.id, 'moderator')}
                        disabled={roleUpdateLoading}
                      >
                        {roleUpdateLoading ? <Loader2 className="animate-spin" size={14} /> : <X size={14} className="mr-1" />}
                        Remove
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => assignRole(selectedUser.id, 'moderator')}
                        disabled={roleUpdateLoading}
                      >
                        {roleUpdateLoading ? <Loader2 className="animate-spin" size={14} /> : <UserCog size={14} className="mr-1" />}
                        Assign
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Subscription Info */}
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <CreditCard size={16} className="text-primary" />
                  Subscription
                </h4>
                {selectedUser.subscription ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Package</span>
                      <span className="font-medium">{selectedUser.subscription.packages?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-medium">৳{selectedUser.subscription.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        selectedUser.subscription.expires_at && new Date(selectedUser.subscription.expires_at) > new Date()
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {selectedUser.subscription.expires_at && new Date(selectedUser.subscription.expires_at) > new Date()
                          ? 'Active'
                          : 'Expired'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expires</span>
                      <span className="font-medium">
                        {selectedUser.subscription.expires_at 
                          ? new Date(selectedUser.subscription.expires_at).toLocaleDateString()
                          : '-'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No active subscription</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowUserModal(false);
                    // Focus on subscriptions tab with this user
                    setActiveTab('subscriptions');
                    setFilter('all');
                    toast({ title: 'View subscriptions to manage this user\'s payments' });
                  }}
                >
                  View Subscriptions
                </Button>
              </div>
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
