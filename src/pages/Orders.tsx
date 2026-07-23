import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, Clock, Truck, CheckCircle, XCircle } from 'lucide-react';
import logo from '@/assets/logo.png';
import { getUserFriendlyError } from '@/lib/errorHandler';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { bnDateTime, bnCurrency } from '@/lib/formatters';
import { toast } from 'sonner';

interface Order {
  id: string;
  status: string;
  total_amount: number;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_phone: string;
  created_at: string;
  order_items: {
    id: string;
    product_name: string;
    product_type: string;
    price: number;
    quantity: number;
  }[];
}

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pending' },
  processing: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Processing' },
  shipped: { icon: Truck, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Shipped' },
  delivered: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Delivered' },
  cancelled: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Cancelled' },
};

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      if (!ordersData) {
        setOrders([]);
        return;
      }

      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          const { data: itemsData } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);
          return { ...order, order_items: itemsData || [] };
        })
      );

      setOrders(ordersWithItems);
    } catch (err) {
      toast.error(getUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState variant="page" label="অর্ডার লোড হচ্ছে..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-orange-50/30">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-50">
        <div className="container-custom flex items-center justify-between h-16">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <img 
            src={logo} 
            alt="Times Digital" 
            className="h-10 cursor-pointer" 
            onClick={() => navigate('/')}
          />
        </div>
      </header>

      <main className="container-custom py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">আপনার অর্ডার</h1>
          <p className="text-muted-foreground mb-8">
            NFC কার্ড অর্ডারের অবস্থা ও তথ্য দেখুন
          </p>

          {orders.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border">
              <EmptyState
                icon={<Package size={48} className="opacity-40" />}
                title="এখনো কোনো অর্ডার নেই"
                description="আপনি এখনো কোনো অর্ডার করেননি।"
                action={{ label: 'NFC কার্ড দেখুন', onClick: () => navigate('/#nfc-store') }}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order, index) => {
                const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={order.id}
                    className="bg-card rounded-2xl border border-border overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {/* Order Header */}
                    <div className="p-6 border-b border-border">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Order ID</p>
                          <p className="font-mono text-sm text-foreground">{order.id.slice(0, 8)}...</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">তারিখ</p>
                          <p className="text-sm text-foreground">{bnDateTime(order.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">মোট</p>
                          <p className="text-lg font-bold text-foreground">{bnCurrency(order.total_amount)}</p>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 ${status.bg}`}>
                          <StatusIcon size={16} className={status.color} />
                          <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-6 border-b border-border">
                      <h3 className="text-sm font-medium text-muted-foreground mb-4">Items</h3>
                      <div className="space-y-3">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-primary-foreground font-bold text-sm">
                              {item.product_type[0]}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{item.product_name}</p>
                              <p className="text-sm text-muted-foreground capitalize">{item.product_type}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-foreground">৳{item.price}</p>
                              <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping Info */}
                    <div className="p-6 bg-muted/30">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Shipping to</h3>
                      <p className="text-foreground">{order.shipping_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.shipping_address}, {order.shipping_city}
                      </p>
                      <p className="text-sm text-muted-foreground">{order.shipping_phone}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
