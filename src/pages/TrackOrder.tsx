import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getUserFriendlyError } from '@/lib/errorHandler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Search, 
  Package, 
  CreditCard,
  MapPin,
  Loader2,
  Truck,
  Phone,
  Mail,
  ShoppingBag,
  RefreshCw
} from 'lucide-react';
import OrderTimeline from '@/components/OrderTimeline';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { bnCurrency, bnDate } from '@/lib/formatters';
import logo from '@/assets/logo.png';

interface OrderDetails {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  product_name: string;
  quantity: number;
  total_amount: number;
  payment_method: string;
  status: string;
  shipping_status: string | null;
  shipping_address: string;
  shipping_city: string;
  admin_notes: string | null;
  created_at: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const trackSchema = z.object({
  email: z
    .string()
    .trim()
    .email('সঠিক ইমেইল ঠিকানা দিন')
    .max(255, 'ইমেইল অনেক বড়'),
  orderId: z
    .string()
    .trim()
    .regex(UUID_RE, 'সঠিক অর্ডার আইডি দিন (কনফার্মেশন ইমেইলে পাবেন)'),
});

export default function TrackOrder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = trackSchema.safeParse({ email, orderId });
    if (!parsed.success) {
      toast({
        title: 'ইনপুট পরীক্ষা করুন',
        description: parsed.error.errors[0]?.message ?? 'সঠিক তথ্য দিন',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase.rpc('get_guest_order_status', {
        _email: parsed.data.email.toLowerCase(),
        _order_id: parsed.data.orderId,
      });

      if (error) throw error;

      setOrders((data as OrderDetails[]) || []);
    } catch (error: unknown) {
      toast({
        title: 'অর্ডার খুঁজতে সমস্যা হয়েছে',
        description: getUserFriendlyError(error),
        variant: 'destructive',
      });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'verified':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'shipped':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'delivered':
        return 'bg-teal-100 text-teal-700 border-teal-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
      case 'verified':
        return 'যাচাইকৃত';
      case 'pending':
        return 'অপেক্ষমান';
      case 'rejected':
        return 'প্রত্যাখ্যাত';
      case 'cancelled':
        return 'বাতিল';
      case 'shipped':
        return 'শিপ করা হয়েছে';
      case 'delivered':
        return 'ডেলিভারি সম্পন্ন';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-orange-50/30">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            ফিরে যান
          </button>
          <img src={logo} alt="Logo" className="h-10 cursor-pointer" onClick={() => navigate('/')} />
          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <Package size={40} className="text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">অর্ডার ট্র্যাক করুন</h1>
          <p className="text-muted-foreground">
            আপনার NFC কার্ড অর্ডারের স্ট্যাটাস দেখতে অর্ডার আইডি এবং ইমেইল দিন
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSearch}
          className="bg-card rounded-2xl p-6 border border-border shadow-lg mb-8 space-y-3"
        >
          <div className="relative">
            <Package size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="অর্ডার আইডি (কনফার্মেশন ইমেইলে পাবেন)"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                placeholder="অর্ডারের সময় দেওয়া ইমেইল"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Search size={18} />
              )}
              ট্র্যাক করুন
            </Button>
          </div>
        </motion.form>

        {/* Results */}
        {loading && <LoadingState variant="list" rows={2} label="অর্ডার খোঁজা হচ্ছে..." />}
        {searched && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {orders.length > 0 ? (
              <div className="space-y-8">
                {/* Orders Count */}
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">
                    <span className="font-bold text-foreground">{orders.length}</span> টি অর্ডার পাওয়া গেছে
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSearch}
                    className="gap-2"
                  >
                    <RefreshCw size={14} />
                    রিফ্রেশ
                  </Button>
                </div>

                {orders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="space-y-4"
                  >
                    {/* Order Header */}
                    <div className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <ShoppingBag size={20} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">অর্ডার #{order.id.slice(0, 8).toUpperCase()}</p>
                          <p className="text-sm text-muted-foreground">
                            {bnDate(order.created_at)}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    {/* Order Timeline */}
                    <OrderTimeline 
                      status={order.status} 
                      shippingStatus={order.shipping_status}
                      createdAt={order.created_at}
                    />

                    {/* Admin Notes and Refund Guidance for rejected orders */}
                    {order.status === 'rejected' && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                        {order.admin_notes && (
                          <p className="text-sm text-red-800">
                            <strong>প্রত্যাখ্যানের কারণ:</strong> {order.admin_notes}
                          </p>
                        )}
                        <div className="border-t border-red-200 pt-3">
                          <p className="text-sm font-medium text-red-700 mb-2">💰 রিফান্ড গাইড:</p>
                          <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
                            <li>ভুল তথ্য থাকলে সঠিক তথ্য দিয়ে নতুন অর্ডার করুন</li>
                            <li>টাকা কেটে গেলে আমাদের সাথে যোগাযোগ করুন</li>
                            <li>রিফান্ড ৩-৫ কার্যদিবসের মধ্যে প্রক্রিয়া করা হবে</li>
                            <li>যোগাযোগ: support@timescard.com | WhatsApp: 01815726006</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Order Details */}
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                      {/* Product Info */}
                      <div className="p-4 border-b border-border">
                        <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
                          <Package size={16} className="text-primary" />
                          পণ্যের বিবরণ
                        </h4>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-primary to-teal-400 rounded-xl flex items-center justify-center">
                            <CreditCard size={28} className="text-primary-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{order.product_name}</p>
                            <p className="text-sm text-muted-foreground">পরিমাণ: {order.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-foreground">{bnCurrency(order.total_amount)}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {order.payment_method === 'bkash' ? 'বিকাশ' : 
                               order.payment_method === 'nagad' ? 'নগদ' :
                               order.payment_method === 'rocket' ? 'রকেট' : 'ব্যাংক'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Shipping Address */}
                      <div className="p-4 border-b border-border">
                        <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
                          <MapPin size={16} className="text-primary" />
                          শিপিং ঠিকানা
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium text-foreground">{order.full_name}</p>
                          <p className="text-muted-foreground">{order.shipping_address}</p>
                          <p className="text-muted-foreground">{order.shipping_city}</p>
                          <div className="flex items-center gap-2 text-muted-foreground pt-1">
                            <Phone size={14} />
                            <span>{order.phone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Registration CTA for approved orders */}
                      {order.status === 'approved' && (
                        <div className="p-4 bg-green-50">
                          <div className="flex items-center gap-3 mb-3">
                            <Truck size={20} className="text-green-600" />
                            <p className="font-medium text-green-800">রেজিস্ট্রেশন করুন</p>
                          </div>
                          <p className="text-sm text-green-700 mb-4">
                            আপনার পেমেন্ট অনুমোদিত হয়েছে! ডিজিটাল বিজনেস কার্ড ম্যানেজ করতে অ্যাকাউন্ট তৈরি করুন।
                          </p>
                          <Button 
                            onClick={() => navigate(`/auth?email=${encodeURIComponent(order.email)}`)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            এখনই রেজিস্টার করুন
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Package size={32} />}
                title="কোনো অর্ডার পাওয়া যায়নি"
                description="এই ইমেইল ও অর্ডার আইডি দিয়ে কোনো অর্ডার খুঁজে পাওয়া যায়নি।"
                action={{ label: 'NFC কার্ড দেখুন', onClick: () => navigate('/#nfc-store') }}
                className="bg-card rounded-2xl border border-border"
              />
            )}
          </motion.div>
        )}

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-muted/50 rounded-xl p-6 text-center"
        >
          <h3 className="font-bold text-foreground mb-2">সাহায্য প্রয়োজন?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            অর্ডার সম্পর্কে কোনো সমস্যা হলে আমাদের সাথে যোগাযোগ করুন
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="tel:+8801XXXXXXXXX" 
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Phone size={16} />
              +880 1XXX-XXXXXX
            </a>
            <a 
              href="mailto:support@timesnfc.com" 
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Mail size={16} />
              support@timesnfc.com
            </a>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
