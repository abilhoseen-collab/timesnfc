import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getUserFriendlyError } from '@/lib/errorHandler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingBag,
  CreditCard,
  MapPin,
  Phone,
  User
} from 'lucide-react';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { bnCurrency } from '@/lib/formatters';
import logo from '@/assets/logo.png';

export default function Cart() {
  const { user } = useAuth();
  const { items, removeFromCart, updateQuantity, clearCart, totalAmount, loading } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [checkoutMode, setCheckoutMode] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    address: '',
    city: '',
    phone: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Shipping info validation schema
  const shippingSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(255, 'Name is too long'),
    address: z.string().min(10, 'Please enter your full address').max(500, 'Address is too long'),
    city: z.string().min(2, 'Please enter your city').max(100, 'City name is too long'),
    phone: z.string().min(10, 'Phone must be at least 10 digits').max(20, 'Phone number is too long').regex(/^[0-9+\-\s]+$/, 'Invalid phone format'),
  });

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/auth');
      return;
    }

    // Validate shipping info with Zod
    const validationResult = shippingSchema.safeParse(shippingInfo);
    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.errors.forEach(err => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setValidationErrors(errors);
      toast({
        title: 'Validation Error',
        description: 'Please check your shipping details',
        variant: 'destructive',
      });
      return;
    }
    setValidationErrors({});

    setOrderLoading(true);

    try {
      // Create order with trimmed and validated data
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: totalAmount,
          shipping_name: shippingInfo.name.trim(),
          shipping_address: shippingInfo.address.trim(),
          shipping_city: shippingInfo.city.trim(),
          shipping_phone: shippingInfo.phone.trim(),
          payment_method: 'cod',
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_name: item.product_name,
        product_type: item.product_type,
        price: item.price,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      await clearCart();

      toast({
        title: 'Order placed!',
        description: 'Your order has been placed successfully. We will contact you soon.',
      });

      navigate('/orders');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getUserFriendlyError(error),
        variant: 'destructive',
      });
    } finally {
      setOrderLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-orange-50/30 flex items-center justify-center p-4">
        <div className="text-center">
          <ShoppingBag size={48} className="mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Please sign in</h2>
          <p className="text-muted-foreground mb-4">You need to be logged in to view your cart</p>
          <Button variant="secondary" onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-orange-50/30">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-50">
        <div className="container-custom flex items-center justify-between h-16">
          <button
            onClick={() => navigate(checkoutMode ? '/cart' : '/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            {checkoutMode ? 'Back to Cart' : 'Continue Shopping'}
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
          <h1 className="text-3xl font-bold text-foreground mb-8">
            {checkoutMode ? 'Checkout' : 'Your Cart'}
          </h1>

          {loading ? (
            <LoadingState variant="list" rows={3} label="কার্ট লোড হচ্ছে..." />
          ) : items.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag size={48} />}
              title="আপনার কার্ট খালি"
              description="আমাদের NFC কার্ড দেখুন এবং কার্টে আইটেম যোগ করুন"
              action={{ label: 'NFC কার্ড দেখুন', onClick: () => navigate('/#nfc-store') }}
              className="bg-card rounded-2xl border border-border"
            />
          ) : !checkoutMode ? (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    className="bg-card rounded-2xl p-6 border border-border"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-primary-foreground font-bold">
                        {item.product_type[0]}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground">{item.product_name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{item.product_type}</p>
                        <p className="text-lg font-bold text-primary mt-1">{bnCurrency(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus size={14} />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus size={14} />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-card rounded-2xl p-6 border border-border sticky top-24">
                  <h2 className="text-lg font-bold text-foreground mb-4">Order Summary</h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">{bnCurrency(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-green-600">Free</span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between">
                        <span className="font-bold text-foreground">Total</span>
                        <span className="font-bold text-foreground">{bnCurrency(totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    variant="secondary" 
                    className="w-full font-semibold"
                    onClick={() => setCheckoutMode(true)}
                  >
                    <CreditCard size={18} className="mr-2" />
                    Proceed to Checkout
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handleCheckout} className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <MapPin size={20} className="text-primary" />
                    Shipping Information
                  </h2>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                          placeholder="John Doe"
                          value={shippingInfo.name}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                          className="pl-10 bg-background"
                          maxLength={255}
                          required
                        />
                      </div>
                      {validationErrors.name && <p className="text-xs text-destructive mt-1">{validationErrors.name}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Address *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                          placeholder="House #, Road #, Area"
                          value={shippingInfo.address}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                          className="pl-10 bg-background"
                          maxLength={500}
                          required
                        />
                      </div>
                      {validationErrors.address && <p className="text-xs text-destructive mt-1">{validationErrors.address}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        City *
                      </label>
                      <Input
                        placeholder="Dhaka"
                        value={shippingInfo.city}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                        className="bg-background"
                        maxLength={100}
                        required
                      />
                      {validationErrors.city && <p className="text-xs text-destructive mt-1">{validationErrors.city}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Phone *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                          placeholder="+880 1XXX-XXXXXX"
                          value={shippingInfo.phone}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                          className="pl-10 bg-background"
                          maxLength={20}
                          required
                        />
                      </div>
                      {validationErrors.phone && <p className="text-xs text-destructive mt-1">{validationErrors.phone}</p>}
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-6 border border-border">
                  <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <CreditCard size={20} className="text-primary" />
                    Payment Method
                  </h2>
                  <div className="p-4 bg-accent rounded-xl border-2 border-primary">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Cash on Delivery (COD)</p>
                        <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-card rounded-2xl p-6 border border-border sticky top-24">
                  <h2 className="text-lg font-bold text-foreground mb-4">Order Summary</h2>
                  
                  <div className="space-y-3 mb-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.product_name} x{item.quantity}
                        </span>
                        <span className="text-foreground">{bnCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-3 mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-green-600">Free</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-foreground">Total</span>
                      <span className="font-bold text-foreground">{bnCurrency(totalAmount)}</span>
                    </div>
                  </div>

                  <Button 
                    type="submit"
                    variant="secondary" 
                    className="w-full font-semibold"
                    disabled={orderLoading}
                  >
                    {orderLoading ? 'Placing Order...' : 'Place Order'}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </motion.div>
      </main>
    </div>
  );
}
