import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePaymentSettings } from '@/hooks/usePaymentSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft,
  Smartphone,
  Building2,
  Upload,
  Loader2,
  Copy,
  CheckCircle,
  CreditCard,
  Package
} from 'lucide-react';
import { z } from 'zod';
import { getUserFriendlyError } from '@/lib/errorHandler';
import logo from '@/assets/logo.png';

const guestOrderSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(255, 'Name is too long'),
  email: z.string().email('Please enter a valid email').max(255, 'Email is too long'),
  phone: z.string().min(11, 'Phone must be at least 11 digits').max(20, 'Phone number is too long').regex(/^[0-9+\-\s]+$/, 'Invalid phone format'),
  shipping_address: z.string().min(10, 'Please enter your full address').max(500, 'Address is too long'),
  shipping_city: z.string().min(2, 'Please enter your city').max(100, 'City name is too long'),
  transaction_id: z.string().min(4, 'Transaction ID must be at least 4 characters').max(50, 'Transaction ID is too long'),
  sender_number: z.string().max(20, 'Sender number is too long').optional(),
  bank_name: z.string().max(100, 'Bank name is too long').optional(),
  account_holder_name: z.string().max(255, 'Account holder name is too long').optional(),
});

interface NFCCard {
  name: string;
  price: number;
  quantity: number;
}

export default function NFCPayment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getPaymentMethods, loading: paymentSettingsLoading } = usePaymentSettings();
  
  const paymentMethods = getPaymentMethods();

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    shipping_address: '',
    shipping_city: '',
    transaction_id: '',
    sender_number: '',
    bank_name: '',
    account_holder_name: '',
  });

  // Parse cart data from URL
  const [cartItem, setCartItem] = useState<NFCCard | null>(null);
  
  useEffect(() => {
    const productName = searchParams.get('product');
    const price = searchParams.get('price');
    const quantity = searchParams.get('quantity');
    
    if (productName && price) {
      setCartItem({
        name: productName,
        price: parseFloat(price),
        quantity: parseInt(quantity || '1')
      });
    }
  }, [searchParams]);

  const totalAmount = cartItem ? cartItem.price * cartItem.quantity : 0;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please upload an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large (max 5MB)', variant: 'destructive' });
      return;
    }

    setUploadingScreenshot(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `guest/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setScreenshotUrl(fileName);
      toast({ title: 'Screenshot uploaded successfully' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMethod || !cartItem) return;

    // Validate form
    try {
      guestOrderSchema.parse(formData);
      setErrors({});
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) newErrors[e.path[0] as string] = e.message;
        });
        setErrors(newErrors);
        return;
      }
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('nfc_guest_orders').insert({
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        shipping_address: formData.shipping_address.trim(),
        shipping_city: formData.shipping_city.trim(),
        product_name: cartItem.name,
        product_type: cartItem.name.toLowerCase().split(' ')[0],
        price: cartItem.price,
        quantity: cartItem.quantity,
        total_amount: totalAmount,
        payment_method: selectedMethod,
        transaction_id: formData.transaction_id.trim(),
        sender_number: formData.sender_number.trim() || null,
        bank_name: formData.bank_name.trim() || null,
        account_holder_name: formData.account_holder_name.trim() || null,
        payment_screenshot_url: screenshotUrl,
      });

      if (error) throw error;

      toast({
        title: 'Order Submitted Successfully!',
        description: 'Your payment is being verified. Once approved, you can register with your email.',
      });
      
      // Redirect to auth page with email prefilled
      navigate(`/auth?email=${encodeURIComponent(formData.email)}&pending=nfc`);
    } catch (error: any) {
      toast({
        title: 'Submission failed',
        description: getUserFriendlyError(error),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const currentMethod = paymentMethods.find(m => m.id === selectedMethod);

  if (!cartItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-orange-50/30 flex items-center justify-center p-4">
        <div className="text-center">
          <Package size={48} className="mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">No Product Selected</h2>
          <p className="text-muted-foreground mb-4">Please select an NFC card from our store first.</p>
          <Button onClick={() => navigate('/#nfc-store')}>Browse NFC Cards</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-orange-50/30">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <img src={logo} alt="Logo" className="h-10 cursor-pointer" onClick={() => navigate('/')} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Order</h1>
          <p className="text-muted-foreground mb-8">
            Fill in your details and complete payment to order your NFC card
          </p>

          {/* Order Summary */}
          <div className="bg-card rounded-2xl p-6 border border-border mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-teal-400 rounded-xl flex items-center justify-center">
                <CreditCard size={28} className="text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground">{cartItem.name}</h3>
                <p className="text-sm text-muted-foreground">Quantity: {cartItem.quantity}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">৳{totalAmount}</p>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-card rounded-2xl p-6 border border-border mb-8">
            <h2 className="text-lg font-bold text-foreground mb-4">Your Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Full Name *</label>
                <Input
                  placeholder="Enter your full name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                />
                {errors.full_name && <p className="text-xs text-destructive mt-1">{errors.full_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email *</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                <p className="text-xs text-muted-foreground mt-1">You'll use this email to register after payment approval</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Phone *</label>
                <Input
                  placeholder="01XXXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
                {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">City *</label>
                <Input
                  placeholder="Enter your city"
                  value={formData.shipping_city}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipping_city: e.target.value }))}
                />
                {errors.shipping_city && <p className="text-xs text-destructive mt-1">{errors.shipping_city}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Shipping Address *</label>
                <Input
                  placeholder="Enter your full shipping address"
                  value={formData.shipping_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipping_address: e.target.value }))}
                />
                {errors.shipping_address && <p className="text-xs text-destructive mt-1">{errors.shipping_address}</p>}
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-card rounded-2xl p-6 border border-border mb-8">
            <h2 className="text-lg font-bold text-foreground mb-4">Select Payment Method</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedMethod === method.id
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg ${method.color} flex items-center justify-center mb-2 mx-auto`}>
                    {method.id === 'bank' ? (
                      <Building2 size={20} className="text-white" />
                    ) : (
                      <Smartphone size={20} className="text-white" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground text-center">{method.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Details */}
          {selectedMethod && currentMethod && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl p-6 border border-border mb-8"
            >
              <h2 className="text-lg font-bold text-foreground mb-4">Payment Details</h2>
              
              {/* Payment Info */}
              <div className="bg-muted/50 rounded-xl p-4 mb-6">
                {selectedMethod === 'bank' ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Bank Name</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{currentMethod.bankName}</span>
                        <button onClick={() => copyToClipboard(currentMethod.bankName!, 'bank')}>
                          {copiedField === 'bank' ? <CheckCircle size={16} className="text-primary" /> : <Copy size={16} className="text-muted-foreground" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Account Name</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{currentMethod.accountName}</span>
                        <button onClick={() => copyToClipboard(currentMethod.accountName!, 'accName')}>
                          {copiedField === 'accName' ? <CheckCircle size={16} className="text-primary" /> : <Copy size={16} className="text-muted-foreground" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Account Number</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{currentMethod.accountNumber}</span>
                        <button onClick={() => copyToClipboard(currentMethod.accountNumber!, 'accNum')}>
                          {copiedField === 'accNum' ? <CheckCircle size={16} className="text-primary" /> : <Copy size={16} className="text-muted-foreground" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Branch</span>
                      <span className="font-medium text-foreground">{currentMethod.branch}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">{currentMethod.type}</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-bold text-foreground">{currentMethod.number}</span>
                      <button onClick={() => copyToClipboard(currentMethod.number!, 'number')}>
                        {copiedField === 'number' ? <CheckCircle size={20} className="text-primary" /> : <Copy size={20} className="text-muted-foreground" />}
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Amount: ৳{totalAmount}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground text-center mt-4">{currentMethod.instructions}</p>
              </div>

              {/* Transaction Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Transaction ID / Reference *
                  </label>
                  <Input
                    placeholder="Enter transaction ID"
                    value={formData.transaction_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, transaction_id: e.target.value }))}
                  />
                  {errors.transaction_id && <p className="text-xs text-destructive mt-1">{errors.transaction_id}</p>}
                </div>

                {selectedMethod !== 'bank' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Sender Mobile Number
                    </label>
                    <Input
                      placeholder="01XXXXXXXXX"
                      value={formData.sender_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, sender_number: e.target.value }))}
                    />
                  </div>
                )}

                {selectedMethod === 'bank' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Your Bank Name
                      </label>
                      <Input
                        placeholder="Enter your bank name"
                        value={formData.bank_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Account Holder Name
                      </label>
                      <Input
                        placeholder="Enter account holder name"
                        value={formData.account_holder_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, account_holder_name: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                {/* Screenshot Upload */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Payment Screenshot (Optional)
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleScreenshotUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingScreenshot}
                    className="w-full"
                  >
                    {uploadingScreenshot ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : screenshotUrl ? (
                      <>
                        <CheckCircle size={16} className="mr-2 text-primary" />
                        Screenshot Uploaded
                      </>
                    ) : (
                      <>
                        <Upload size={16} className="mr-2" />
                        Upload Screenshot
                      </>
                    )}
                  </Button>
                </div>

                {/* Submit Button */}
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={20} className="mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    `Complete Order - ৳${totalAmount}`
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
