import { useState, useRef } from 'react';
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
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Service {
  name: string;
  price: string;
  description?: string;
  image?: string;
  category?: string;
}

interface ServiceCatalogProps {
  services: Service[];
  accentColor?: string;
  ownerName: string;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  whatsappNumber?: string | null;
  bkashNumber?: string | null;
  nagadNumber?: string | null;
  rocketNumber?: string | null;
  bankDetails?: string | null;
  onTrackClick?: (linkName: string) => void;
}

type PaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'bank';

export default function ServiceCatalog({
  services,
  accentColor = 'bg-primary',
  ownerName,
  ownerPhone,
  ownerEmail,
  whatsappNumber,
  bkashNumber,
  nagadNumber,
  rocketNumber,
  bankDetails,
  onTrackClick,
}: ServiceCatalogProps) {
  const { toast } = useToast();
  const [cart, setCart] = useState<{ service: Service; quantity: number }[]>([]);
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
  const screenshotRef = useRef<HTMLInputElement>(null);

  if (!services || services.length === 0) return null;

  // Check if payment methods are available
  const hasPaymentMethods = bkashNumber || nagadNumber || rocketNumber || bankDetails;

  const addToCart = (service: Service) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.service.name === service.name);
      if (existing) {
        return prev.map((item) =>
          item.service.name === service.name
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { service, quantity: 1 }];
    });
    toast({ title: `${service.name} কার্টে যোগ হয়েছে!` });
    onTrackClick?.('add_to_cart');
  };

  const updateQuantity = (serviceName: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.service.name === serviceName
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
    (acc, item) => acc + parsePrice(item.service.price) * item.quantity,
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

      const orderItems = cart.map(item => `${item.service.name} x${item.quantity}`).join(', ');
      
      const { error } = await supabase.from('nfc_guest_orders').insert({
        full_name: orderForm.name,
        phone: orderForm.phone,
        email: orderForm.email || ownerEmail || '',
        shipping_address: orderForm.address,
        shipping_city: orderForm.city,
        product_name: orderItems,
        product_type: 'vcard_service',
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

  const sendToWhatsApp = () => {
    if (!whatsappNumber) {
      toast({ title: 'WhatsApp নম্বর নেই', variant: 'destructive' });
      return;
    }

    const orderDetails = cart
      .map((item) => `• ${item.service.name} x${item.quantity} - ${item.service.price}`)
      .join('\n');

    const message = encodeURIComponent(
      `হাই ${ownerName},\n\nআমি অর্ডার করতে চাই:\n\n${orderDetails}\n\nমোট: ৳${cartTotal.toFixed(2)}\n\nঅনুগ্রহ করে কনফার্ম করুন।`
    );

    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
    onTrackClick?.('order_via_whatsapp');
    setShowCart(false);
    setCart([]);
  };

  const categories = [...new Set(services.map((s) => s.category || 'Services'))];

  return (
    <>
      {/* Service Cards */}
      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category}>
            {categories.length > 1 && (
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {category}
              </h4>
            )}
            <div className="grid gap-3">
              {services
                .filter((s) => (s.category || 'Services') === category)
                .map((service, idx) => (
                  <motion.div
                    key={`${service.name}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex">
                      {service.image && (
                        <div className="w-24 h-24 flex-shrink-0">
                          <img
                            src={service.image}
                            alt={service.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-semibold text-gray-900 text-sm line-clamp-1">
                              {service.name}
                            </h5>
                            <Badge variant="secondary" className="shrink-0 font-bold">
                              {service.price}
                            </Badge>
                          </div>
                          {service.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {service.description}
                            </p>
                          )}
                        </div>

                        <Button
                          size="sm"
                          className={`mt-2 w-full ${accentColor} text-white font-medium`}
                          onClick={() => addToCart(service)}
                        >
                          <ShoppingCart size={14} className="mr-1" />
                          কার্টে যোগ করুন
                        </Button>
                      </div>
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
                  <Badge variant="secondary">{cartItemCount} আইটেম</Badge>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setShowCart(false)}>
                  <X size={20} />
                </Button>
              </div>

              {/* Cart Items */}
              <div className="p-4 overflow-y-auto max-h-[50vh] space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.service.name}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                  >
                    {item.service.image && (
                      <img src={item.service.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {item.service.name}
                      </p>
                      <p className="text-xs text-gray-500">{item.service.price}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.service.name, -1)}
                      >
                        <Minus size={14} />
                      </Button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.service.name, 1)}
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

                {hasPaymentMethods ? (
                  <Button
                    className={`w-full ${accentColor} text-white font-semibold py-6`}
                    onClick={() => setShowCheckout(true)}
                  >
                    <CreditCard size={18} className="mr-2" />
                    চেকআউট করুন
                  </Button>
                ) : whatsappNumber ? (
                  <Button
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-6"
                    onClick={sendToWhatsApp}
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp এ অর্ডার করুন
                  </Button>
                ) : (
                  <p className="text-center text-sm text-gray-500">
                    অর্ডার করতে মালিকের সাথে যোগাযোগ করুন
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
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
                  <p className="text-gray-600">আপনার অর্ডার গ্রহণ করা হয়েছে। শীঘ্রই যোগাযোগ করা হবে।</p>
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
                        <div key={item.service.name} className="flex justify-between text-sm py-1">
                          <span>{item.service.name} x{item.quantity}</span>
                          <span>৳{(parsePrice(item.service.price) * item.quantity).toFixed(0)}</span>
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
                        <Label className="text-xs">ইমেইল (ঐচ্ছিক)</Label>
                        <Input
                          value={orderForm.email}
                          onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">ঠিকানা *</Label>
                        <Input
                          value={orderForm.address}
                          onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                          placeholder="বাড়ি নং, রোড, এলাকা"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">শহর *</Label>
                        <Input
                          value={orderForm.city}
                          onChange={(e) => setOrderForm({ ...orderForm, city: e.target.value })}
                          placeholder="ঢাকা"
                        />
                      </div>
                    </div>

                    {/* Payment Methods */}
                    {paymentMethods.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">পেমেন্ট মেথড</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {paymentMethods.map((method) => (
                            <button
                              key={method.id}
                              onClick={() => setSelectedPayment(method.id)}
                              className={`p-3 rounded-xl border-2 transition-all ${
                                selectedPayment === method.id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-full ${method.color} flex items-center justify-center mx-auto mb-2`}>
                                <method.icon size={20} className="text-white" />
                              </div>
                              <p className="text-sm font-medium text-gray-900">{method.name}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Payment Details */}
                    {selectedPayment && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-3"
                      >
                        <div className="bg-blue-50 rounded-xl p-4">
                          <p className="text-sm text-blue-800 mb-2">
                            নিচের নম্বরে ৳{cartTotal.toFixed(0)} পাঠান:
                          </p>
                          <div className="flex items-center justify-between bg-white rounded-lg p-3">
                            <span className="font-mono font-bold text-lg">
                              {paymentMethods.find(m => m.id === selectedPayment)?.number}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyNumber(
                                paymentMethods.find(m => m.id === selectedPayment)?.number || '',
                                selectedPayment
                              )}
                            >
                              {copiedNumber === selectedPayment ? (
                                <Check size={14} className="text-green-500" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Transaction ID *</Label>
                            <Input
                              value={orderForm.transactionId}
                              onChange={(e) => setOrderForm({ ...orderForm, transactionId: e.target.value })}
                              placeholder="TrxID"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">সেন্ডার নম্বর</Label>
                            <Input
                              value={orderForm.senderNumber}
                              onChange={(e) => setOrderForm({ ...orderForm, senderNumber: e.target.value })}
                              placeholder="01XXXXXXXXX"
                            />
                          </div>
                        </div>

                        {/* Screenshot Upload */}
                        <div>
                          <Label className="text-xs">পেমেন্ট স্ক্রিনশট (ঐচ্ছিক)</Label>
                          <input
                            ref={screenshotRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full mt-1"
                            onClick={() => screenshotRef.current?.click()}
                          >
                            <Upload size={14} className="mr-2" />
                            {paymentScreenshot ? paymentScreenshot.name : 'স্ক্রিনশট আপলোড'}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="p-4 border-t border-gray-100">
                    <Button
                      className={`w-full ${accentColor} text-white font-semibold py-6`}
                      onClick={handleSubmitOrder}
                      disabled={submitting || !selectedPayment}
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={18} className="mr-2 animate-spin" />
                          অর্ডার হচ্ছে...
                        </>
                      ) : (
                        <>
                          <Check size={18} className="mr-2" />
                          অর্ডার কনফার্ম করুন
                        </>
                      )}
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
