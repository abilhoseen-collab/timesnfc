import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  ChevronRight,
  CreditCard,
  Smartphone,
  Building2,
  Copy,
  Check,
  Upload,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  name: string;
  price: string;
  description?: string;
  image?: string;
  category?: string;
  originalPrice?: string;
  inStock?: boolean;
}

interface ProductCatalogProps {
  products: Product[];
  accentColor?: string;
  ownerName: string;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  bkashNumber?: string | null;
  nagadNumber?: string | null;
  rocketNumber?: string | null;
  bankDetails?: string | null;
  onTrackClick?: (linkName: string) => void;
}

type PaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'bank';

export default function ProductCatalog({
  products,
  accentColor = 'bg-primary',
  ownerName,
  ownerPhone,
  ownerEmail,
  bkashNumber,
  nagadNumber,
  rocketNumber,
  bankDetails,
  onTrackClick,
}: ProductCatalogProps) {
  const { toast } = useToast();
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [orderForm, setOrderForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    transactionId: '',
    senderNumber: '',
  });
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  if (!products || products.length === 0) return null;

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.name === product.name);
      if (existing) {
        return prev.map((item) =>
          item.product.name === product.name
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast({ title: `${product.name} কার্টে যোগ হয়েছে!` });
    onTrackClick?.('add_to_cart');
  };

  const updateQuantity = (productName: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.name === productName
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const parsePrice = (priceStr: string): number => {
    const num = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const cartTotal = cart.reduce(
    (acc, item) => acc + parsePrice(item.product.price) * item.quantity,
    0
  );

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const copyNumber = (number: string, type: string) => {
    navigator.clipboard.writeText(number);
    setCopiedNumber(type);
    setTimeout(() => setCopiedNumber(null), 2000);
    toast({ title: 'নম্বর কপি হয়েছে!' });
  };

  const paymentMethods = [
    { id: 'bkash' as PaymentMethod, name: 'bKash', number: bkashNumber, color: 'bg-pink-500', icon: Smartphone },
    { id: 'nagad' as PaymentMethod, name: 'Nagad', number: nagadNumber, color: 'bg-orange-500', icon: Smartphone },
    { id: 'rocket' as PaymentMethod, name: 'Rocket', number: rocketNumber, color: 'bg-purple-600', icon: Smartphone },
    { id: 'bank' as PaymentMethod, name: 'Bank Transfer', number: bankDetails, color: 'bg-blue-600', icon: Building2 },
  ].filter(m => m.number);

  const handleSubmitOrder = async () => {
    if (!orderForm.name || !orderForm.phone || !orderForm.address || !orderForm.city) {
      toast({ title: 'সব তথ্য পূরণ করুন', variant: 'destructive' });
      return;
    }
    if (!selectedPayment) {
      toast({ title: 'পেমেন্ট মেথড সিলেক্ট করুন', variant: 'destructive' });
      return;
    }
    if (!orderForm.transactionId) {
      toast({ title: 'Transaction ID দিন', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    let screenshotUrl = null;

    try {
      // Upload payment screenshot if provided
      if (paymentScreenshot) {
        const fileExt = paymentScreenshot.name.split('.').pop();
        const fileName = `orders/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('payment-screenshots')
          .upload(fileName, paymentScreenshot);

        if (!uploadError) {
          const { data } = supabase.storage.from('payment-screenshots').getPublicUrl(fileName);
          screenshotUrl = data.publicUrl;
        }
      }

      // Create order in nfc_guest_orders table
      const orderItems = cart.map(item => `${item.product.name} x${item.quantity}`).join(', ');
      
      const { error } = await supabase.from('nfc_guest_orders').insert({
        full_name: orderForm.name,
        phone: orderForm.phone,
        email: orderForm.email || ownerEmail || '',
        shipping_address: orderForm.address,
        shipping_city: orderForm.city,
        product_name: orderItems,
        product_type: 'vcard_product',
        price: cartTotal,
        quantity: cartItemCount,
        total_amount: cartTotal,
        payment_method: selectedPayment,
        transaction_id: orderForm.transactionId,
        sender_number: orderForm.senderNumber,
        payment_screenshot_url: screenshotUrl,
        status: 'pending',
      });

      if (error) throw error;

      setOrderSuccess(true);
      onTrackClick?.('order_placed');
      toast({ title: 'অর্ডার সফলভাবে সম্পন্ন হয়েছে!' });
      
      // Reset after 3 seconds
      setTimeout(() => {
        setCart([]);
        setShowCheckout(false);
        setShowCart(false);
        setOrderSuccess(false);
        setOrderForm({ name: '', phone: '', email: '', address: '', city: '', transactionId: '', senderNumber: '' });
        setPaymentScreenshot(null);
        setSelectedPayment(null);
      }, 3000);

    } catch (error) {
      console.error('Order error:', error);
      toast({ title: 'অর্ডার করতে সমস্যা হয়েছে', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // Group products by category
  const categories = [...new Set(products.map((p) => p.category || 'Products'))];

  return (
    <>
      {/* Product Cards */}
      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category}>
            {categories.length > 1 && (
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {category}
              </h4>
            )}
            <div className="grid grid-cols-2 gap-3">
              {products
                .filter((p) => (p.category || 'Products') === category)
                .map((product, idx) => (
                  <motion.div
                    key={`${product.name}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Image */}
                    {product.image && (
                      <div className="aspect-square">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-3">
                      <h5 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                        {product.name}
                      </h5>
                      {product.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <Badge variant="secondary" className="font-bold text-xs">
                            {product.price}
                          </Badge>
                          {product.originalPrice && (
                            <span className="text-xs text-gray-400 line-through ml-1">
                              {product.originalPrice}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className={`mt-2 w-full ${accentColor} text-white font-medium text-xs`}
                        onClick={() => addToCart(product)}
                      >
                        <ShoppingCart size={12} className="mr-1" />
                        কার্টে যোগ করুন
                      </Button>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cartItemCount > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setShowCart(true)}
            className={`fixed bottom-24 right-6 z-40 ${accentColor} text-white rounded-full px-5 py-3 shadow-xl flex items-center gap-2 font-semibold`}
          >
            <ShoppingCart size={20} />
            <span>{cartItemCount}</span>
            <span className="hidden sm:inline">- ৳{cartTotal.toFixed(0)}</span>
            <ChevronRight size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && !showCheckout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl max-h-[85vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={20} className="text-primary" />
                  <h3 className="font-bold text-lg text-gray-900">আপনার কার্ট</h3>
                  <Badge variant="secondary">{cartItemCount} items</Badge>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setShowCart(false)}>
                  <X size={20} />
                </Button>
              </div>

              {/* Cart Items */}
              <div className="p-4 overflow-y-auto max-h-[50vh] space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.product.name}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                  >
                    {item.product.image && (
                      <img src={item.product.image} alt="" className="w-14 h-14 rounded-lg object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-gray-500">{item.product.price}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.name, -1)}
                      >
                        <Minus size={14} />
                      </Button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.name, 1)}
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">মোট</span>
                  <span className="text-2xl font-bold text-gray-900">
                    ৳{cartTotal.toFixed(2)}
                  </span>
                </div>

                <Button
                  className={`w-full ${accentColor} text-white font-semibold py-6`}
                  onClick={() => setShowCheckout(true)}
                >
                  <CreditCard size={18} className="mr-2" />
                  চেকআউট করুন
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal with Payment Gateway */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowCheckout(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {orderSuccess ? (
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center"
                  >
                    <Check size={40} className="text-green-600" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">অর্ডার সফল!</h3>
                  <p className="text-gray-600">আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে। শীঘ্রই আপনার সাথে যোগাযোগ করা হবে।</p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <CreditCard size={20} className="text-primary" />
                      <h3 className="font-bold text-lg text-gray-900">চেকআউট</h3>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => setShowCheckout(false)}>
                      <X size={20} />
                    </Button>
                  </div>

                  <div className="p-4 overflow-y-auto max-h-[70vh] space-y-4">
                    {/* Order Summary */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">অর্ডার সামারি</h4>
                      {cart.map((item) => (
                        <div key={item.product.name} className="flex justify-between text-sm py-1">
                          <span>{item.product.name} x{item.quantity}</span>
                          <span>৳{(parsePrice(item.product.price) * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                      <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold">
                        <span>মোট</span>
                        <span>৳{cartTotal.toFixed(0)}</span>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">আপনার তথ্য</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">নাম *</Label>
                          <Input
                            value={orderForm.name}
                            onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })}
                            placeholder="আপনার নাম"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">ফোন *</Label>
                          <Input
                            value={orderForm.phone}
                            onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                            placeholder="01XXXXXXXXX"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">ইমেইল</Label>
                        <Input
                          value={orderForm.email}
                          onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                          placeholder="your@email.com"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">ঠিকানা *</Label>
                        <Textarea
                          value={orderForm.address}
                          onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                          placeholder="পুরো ঠিকানা লিখুন"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">শহর *</Label>
                        <Input
                          value={orderForm.city}
                          onChange={(e) => setOrderForm({ ...orderForm, city: e.target.value })}
                          placeholder="ঢাকা, চট্টগ্রাম..."
                        />
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">পেমেন্ট মেথড</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {paymentMethods.map((method) => (
                          <button
                            key={method.id}
                            onClick={() => setSelectedPayment(method.id)}
                            className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                              selectedPayment === method.id
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full ${method.color} flex items-center justify-center`}>
                              <method.icon size={16} className="text-white" />
                            </div>
                            <span className="font-medium text-sm">{method.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Payment Details */}
                    {selectedPayment && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-3 bg-gray-50 rounded-xl p-4"
                      >
                        <h4 className="font-semibold text-gray-900">পেমেন্ট করুন</h4>
                        
                        {/* Show payment number */}
                        {selectedPayment !== 'bank' && (
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <div>
                              <p className="text-xs text-gray-500">Send Money to:</p>
                              <p className="font-bold text-lg">
                                {paymentMethods.find(m => m.id === selectedPayment)?.number}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyNumber(paymentMethods.find(m => m.id === selectedPayment)?.number || '', selectedPayment)}
                            >
                              {copiedNumber === selectedPayment ? <Check size={14} /> : <Copy size={14} />}
                            </Button>
                          </div>
                        )}

                        {/* Bank details */}
                        {selectedPayment === 'bank' && bankDetails && (
                          <div className="p-3 bg-white rounded-lg border">
                            <p className="text-xs text-gray-500 mb-1">Bank Details:</p>
                            <p className="text-sm whitespace-pre-wrap">{bankDetails}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Transaction ID *</Label>
                            <Input
                              value={orderForm.transactionId}
                              onChange={(e) => setOrderForm({ ...orderForm, transactionId: e.target.value })}
                              placeholder="TRX12345..."
                            />
                          </div>
                          <div>
                            <Label className="text-xs">প্রেরকের নম্বর</Label>
                            <Input
                              value={orderForm.senderNumber}
                              onChange={(e) => setOrderForm({ ...orderForm, senderNumber: e.target.value })}
                              placeholder="01XXXXXXXXX"
                            />
                          </div>
                        </div>

                        {/* Screenshot upload */}
                        <div>
                          <Label className="text-xs">পেমেন্ট স্ক্রিনশট (ঐচ্ছিক)</Label>
                          <div className="mt-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
                              className="hidden"
                              id="payment-screenshot"
                            />
                            <label
                              htmlFor="payment-screenshot"
                              className="flex items-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors"
                            >
                              <Upload size={18} className="text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {paymentScreenshot ? paymentScreenshot.name : 'স্ক্রিনশট আপলোড করুন'}
                              </span>
                            </label>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="p-4 border-t border-gray-100">
                    <Button
                      className={`w-full ${accentColor} text-white font-semibold py-6`}
                      onClick={handleSubmitOrder}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <Loader2 size={18} className="animate-spin mr-2" />
                      ) : (
                        <Check size={18} className="mr-2" />
                      )}
                      অর্ডার কনফার্ম করুন
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
