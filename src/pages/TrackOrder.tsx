import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Search, 
  Package, 
  CreditCard,
  MapPin,
  Loader2,
  Truck
} from 'lucide-react';
import OrderTimeline from '@/components/OrderTimeline';
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

export default function TrackOrder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !email.includes('@')) {
      toast({ title: 'Please enter a valid email address', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase
        .from('nfc_guest_orders')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setOrder(data as OrderDetails);
      } else {
        setOrder(null);
      }
    } catch (error: any) {
      toast({ title: 'Error searching for order', variant: 'destructive' });
    } finally {
      setLoading(false);
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
            Back
          </button>
          <img src={logo} alt="Logo" className="h-10 cursor-pointer" onClick={() => navigate('/')} />
          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Track Your Order</h1>
          <p className="text-muted-foreground">
            Enter your email to check your NFC card order status
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSearch}
          className="bg-card rounded-2xl p-6 border border-border mb-8"
        >
          <div className="flex gap-3">
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Search size={18} className="mr-2" />
                  Track
                </>
              )}
            </Button>
          </div>
        </motion.form>

        {/* Results */}
        {searched && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {order ? (
              <div className="space-y-6">
                {/* Order Timeline */}
                <OrderTimeline 
                  status={order.status} 
                  shippingStatus={order.shipping_status}
                  createdAt={order.created_at}
                />

                {/* Admin Notes for rejected orders */}
                {order.admin_notes && order.status === 'rejected' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm text-red-800">
                      <strong>Note from admin:</strong> {order.admin_notes}
                    </p>
                  </div>
                )}

                {/* Order Details */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="p-6 border-b border-border">
                    <h3 className="font-bold text-foreground mb-4">Order Details</h3>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-teal-400 rounded-xl flex items-center justify-center">
                        <CreditCard size={28} className="text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{order.product_name}</p>
                        <p className="text-sm text-muted-foreground">Quantity: {order.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-foreground">৳{order.total_amount}</p>
                        <p className="text-xs text-muted-foreground capitalize">{order.payment_method}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-b border-border">
                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                      <MapPin size={18} className="text-primary" />
                      Shipping Address
                    </h3>
                    <p className="text-foreground">{order.full_name}</p>
                    <p className="text-muted-foreground">{order.shipping_address}</p>
                    <p className="text-muted-foreground">{order.shipping_city}</p>
                    <p className="text-muted-foreground">{order.phone}</p>
                  </div>

                  {order.status === 'approved' && (
                    <div className="p-6 bg-green-50">
                      <div className="flex items-center gap-3 mb-3">
                        <Truck size={20} className="text-green-600" />
                        <p className="font-medium text-green-800">Ready to Register</p>
                      </div>
                      <p className="text-sm text-green-700 mb-4">
                        Your payment is approved! Create your account to manage your digital business card.
                      </p>
                      <Button 
                        onClick={() => navigate(`/auth?email=${encodeURIComponent(order.email)}`)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Register Now
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border p-8 text-center">
                <Package size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">No Order Found</h3>
                <p className="text-muted-foreground mb-4">
                  We couldn't find any orders with this email address.
                </p>
                <Button variant="outline" onClick={() => navigate('/#nfc-store')}>
                  Browse NFC Cards
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
