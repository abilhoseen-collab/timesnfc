import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import {
  Users,
  CreditCard,
  Package,
  ArrowUpCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  UserPlus,
  ShoppingCart,
  Loader2,
  Activity,
  BarChart3,
  Eye
} from 'lucide-react';
import { LoadingState } from '@/components/common/LoadingState';
import { bnCurrency, bnDate } from '@/lib/formatters';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DashboardStats {
  totalUsers: number;
  newUsersThisMonth: number;
  totalSubscriptions: number;
  pendingSubscriptions: number;
  approvedSubscriptions: number;
  rejectedSubscriptions: number;
  totalNfcOrders: number;
  pendingNfcOrders: number;
  totalUpgradeRequests: number;
  pendingUpgradeRequests: number;
  totalRevenue: number;
  thisMonthRevenue: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
}

interface RecentActivity {
  type: 'subscription' | 'nfc_order' | 'upgrade' | 'user';
  id: string;
  title: string;
  subtitle: string;
  status: string;
  date: string;
  amount?: number;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    // Fetch all data in parallel
    const [
      profilesRes,
      subscriptionsRes,
      nfcOrdersRes,
      upgradesRes,
    ] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('subscriptions').select('*, packages:package_id (name)'),
      supabase.from('nfc_guest_orders').select('*'),
      supabase.from('upgrade_requests').select('*, packages:target_package_id (name)'),
    ]);

    const profiles = profilesRes.data || [];
    const subscriptions = subscriptionsRes.data || [];
    const nfcOrders = nfcOrdersRes.data || [];
    const upgrades = upgradesRes.data || [];

    // Calculate this month
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Calculate stats
    const newUsersThisMonth = profiles.filter(p => 
      new Date(p.created_at) >= thisMonthStart
    ).length;

    const activeSubscriptions = subscriptions.filter(s => 
      s.status === 'approved' && s.expires_at && new Date(s.expires_at) > now
    ).length;

    const expiredSubscriptions = subscriptions.filter(s => 
      s.status === 'approved' && s.expires_at && new Date(s.expires_at) <= now
    ).length;

    const totalRevenue = subscriptions
      .filter(s => s.status === 'approved')
      .reduce((sum, s) => sum + Number(s.amount || 0), 0) +
      nfcOrders
        .filter(o => o.status === 'approved')
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    const thisMonthRevenue = subscriptions
      .filter(s => s.status === 'approved' && new Date(s.created_at) >= thisMonthStart)
      .reduce((sum, s) => sum + Number(s.amount || 0), 0) +
      nfcOrders
        .filter(o => o.status === 'approved' && new Date(o.created_at) >= thisMonthStart)
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    setStats({
      totalUsers: profiles.length,
      newUsersThisMonth,
      totalSubscriptions: subscriptions.length,
      pendingSubscriptions: subscriptions.filter(s => s.status === 'pending').length,
      approvedSubscriptions: subscriptions.filter(s => s.status === 'approved').length,
      rejectedSubscriptions: subscriptions.filter(s => s.status === 'rejected').length,
      totalNfcOrders: nfcOrders.length,
      pendingNfcOrders: nfcOrders.filter(o => o.status === 'pending').length,
      totalUpgradeRequests: upgrades.length,
      pendingUpgradeRequests: upgrades.filter(u => u.status === 'pending').length,
      totalRevenue,
      thisMonthRevenue,
      activeSubscriptions,
      expiredSubscriptions,
    });

    // Build recent activity
    const activities: RecentActivity[] = [];

    // Add recent subscriptions
    subscriptions.slice(0, 5).forEach(s => {
      activities.push({
        type: 'subscription',
        id: s.id,
        title: s.packages?.name || 'Subscription',
        subtitle: 'Subscription payment',
        status: s.status,
        date: s.created_at,
        amount: s.amount,
      });
    });

    // Add recent NFC orders
    nfcOrders.slice(0, 5).forEach(o => {
      activities.push({
        type: 'nfc_order',
        id: o.id,
        title: o.product_name,
        subtitle: `Order by ${o.full_name}`,
        status: o.status,
        date: o.created_at,
        amount: o.total_amount,
      });
    });

    // Add recent upgrades
    upgrades.slice(0, 5).forEach(u => {
      activities.push({
        type: 'upgrade',
        id: u.id,
        title: u.packages?.name || 'Upgrade',
        subtitle: 'Package upgrade request',
        status: u.status,
        date: u.created_at,
        amount: u.amount,
      });
    });

    // Sort by date and take latest 10
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setRecentActivity(activities.slice(0, 10));

    setLoading(false);
  };

  if (loading) {
    return <LoadingState variant="card" rows={4} label="স্ট্যাটিসটিক্স লোড হচ্ছে..." />;
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      subValue: `+${stats.newUsersThisMonth} this month`,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      trend: stats.newUsersThisMonth > 0 ? 'up' : 'neutral',
    },
    {
      title: 'Total Revenue',
      value: `৳${stats.totalRevenue.toLocaleString()}`,
      subValue: `৳${stats.thisMonthRevenue.toLocaleString()} this month`,
      icon: DollarSign,
      color: 'bg-green-100 text-green-600',
      trend: stats.thisMonthRevenue > 0 ? 'up' : 'neutral',
    },
    {
      title: 'Active Subscriptions',
      value: stats.activeSubscriptions,
      subValue: `${stats.expiredSubscriptions} expired`,
      icon: CreditCard,
      color: 'bg-purple-100 text-purple-600',
      trend: 'neutral',
    },
    {
      title: 'Pending Actions',
      value: stats.pendingSubscriptions + stats.pendingNfcOrders + stats.pendingUpgradeRequests,
      subValue: 'Requires attention',
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-600',
      trend: 'alert',
    },
  ];

  const detailCards = [
    {
      title: 'Subscriptions',
      total: stats.totalSubscriptions,
      pending: stats.pendingSubscriptions,
      approved: stats.approvedSubscriptions,
      rejected: stats.rejectedSubscriptions,
      icon: CreditCard,
    },
    {
      title: 'NFC Orders',
      total: stats.totalNfcOrders,
      pending: stats.pendingNfcOrders,
      approved: stats.totalNfcOrders - stats.pendingNfcOrders,
      icon: Package,
    },
    {
      title: 'Upgrade Requests',
      total: stats.totalUpgradeRequests,
      pending: stats.pendingUpgradeRequests,
      approved: stats.totalUpgradeRequests - stats.pendingUpgradeRequests,
      icon: ArrowUpCircle,
    },
  ];

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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'subscription':
        return <CreditCard size={16} className="text-purple-600" />;
      case 'nfc_order':
        return <Package size={16} className="text-blue-600" />;
      case 'upgrade':
        return <ArrowUpCircle size={16} className="text-green-600" />;
      default:
        return <Activity size={16} className="text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Dashboard Overview</h2>
        <p className="text-muted-foreground">Quick summary of your platform's performance</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card rounded-xl p-5 border border-border hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon size={24} />
              </div>
              {stat.trend === 'up' && (
                <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                  <TrendingUp size={14} />
                  <span>Up</span>
                </div>
              )}
              {stat.trend === 'alert' && (
                <div className="flex items-center gap-1 text-yellow-600 text-xs font-medium">
                  <Clock size={14} />
                  <span>Action needed</span>
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.subValue}</p>
          </motion.div>
        ))}
      </div>

      {/* Detail Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {detailCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="bg-card rounded-xl p-5 border border-border"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <card.icon size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{card.title}</h3>
                <p className="text-xs text-muted-foreground">Total: {card.total}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              {card.pending > 0 && (
                <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Pending</span>
                  </div>
                  <span className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{card.pending}</span>
                </div>
              )}
              <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">Approved</span>
                </div>
                <span className="text-lg font-bold text-green-700 dark:text-green-400">{card.approved}</span>
              </div>
              {card.rejected !== undefined && card.rejected > 0 && (
                <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2">
                    <XCircle size={14} className="text-red-600" />
                    <span className="text-sm font-medium text-red-700 dark:text-red-400">Rejected</span>
                  </div>
                  <span className="text-lg font-bold text-red-700 dark:text-red-400">{card.rejected}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-card rounded-xl border border-border overflow-hidden"
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Recent Activity</h3>
              <p className="text-xs text-muted-foreground">Latest transactions and requests</p>
            </div>
          </div>
        </div>
        
        {recentActivity.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No recent activity
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.map((activity) => (
                <TableRow key={`${activity.type}-${activity.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActivityIcon(activity.type)}
                      <span className="capitalize text-sm">{activity.type.replace('_', ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.subtitle}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {activity.amount ? bnCurrency(activity.amount) : '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(activity.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {bnDate(activity.date)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>
    </div>
  );
}