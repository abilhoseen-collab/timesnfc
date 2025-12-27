import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft,
  Check,
  Smartphone,
  Building2,
  Upload,
  Loader2,
  Copy,
  CheckCircle
} from 'lucide-react';
import { z } from 'zod';
import { getUserFriendlyError } from '@/lib/errorHandler';
import logo from '@/assets/logo.png';

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  features: string[];
}

const paymentMethods = [
  {
    id: 'bkash',
    name: 'bKash',
    color: 'bg-pink-500',
    number: '01XXXXXXXXX',
    type: 'Send Money',
    instructions: 'Send money to the number above and provide transaction ID',
  },
  {
    id: 'nagad',
    name: 'Nagad',
    color: 'bg-orange-500',
    number: '01XXXXXXXXX',
    type: 'Send Money',
    instructions: 'Send money to the number above and provide transaction ID',
  },
  {
    id: 'rocket',
    name: 'Rocket',
    color: 'bg-purple-600',
    number: '01XXXXXXXXX',
    type: 'Send Money',
    instructions: 'Send money to the number above and provide transaction ID',
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    color: 'bg-blue-600',
    bankName: 'Your Bank Name',
    accountName: 'Account Holder Name',
    accountNumber: 'XXXXXXXXXXXX',
    routingNumber: 'XXXXXXXXX',
    branch: 'Branch Name',
    instructions: 'Transfer to the bank account and provide transaction details',
  },
];

const paymentSchema = z.object({
  transaction_id: z.string().min(4, 'Transaction ID must be at least 4 characters').max(50),
  sender_number: z.string().optional(),
  bank_name: z.string().optional(),
  account_holder_name: z.string().optional(),
});

export default function Payment() {
  const [searchParams] = useSearchParams();
  const packageId = searchParams.get('package');
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    transaction_id: '',
    sender_number: '',
    bank_name: '',
    account_holder_name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/payment');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    if (packageId && packages.length > 0) {
      const pkg = packages.find(p => p.id === packageId);
      if (pkg) setSelectedPackage(pkg);
    }
  }, [packageId, packages]);

  const fetchPackages = async () => {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('price');

    if (!error && data) {
      setPackages(data.map(p => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : JSON.parse(p.features as string || '[]')
      })));
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

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
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Store the file path instead of public URL for private bucket
      // Admins will generate signed URLs when reviewing payments
      setScreenshotUrl(fileName);
      toast({ title: 'Screenshot uploaded successfully' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPackage || !selectedMethod || !user) return;

    // Validate form
    try {
      paymentSchema.parse(formData);
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
      const { error } = await supabase.from('subscriptions').insert({
        user_id: user.id,
        package_id: selectedPackage.id,
        payment_method: selectedMethod,
        transaction_id: formData.transaction_id.trim(),
        sender_number: formData.sender_number.trim() || null,
        amount: selectedPackage.price,
        payment_screenshot_url: screenshotUrl,
        bank_name: formData.bank_name.trim() || null,
        account_holder_name: formData.account_holder_name.trim() || null,
        payment_date: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: 'Payment Submitted!',
        description: 'Your payment is being verified. You will be notified once approved.',
      });
      navigate('/dashboard');
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentMethod = paymentMethods.find(m => m.id === selectedMethod);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-orange-50/30">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-50">
        <div className="container-custom flex items-center justify-between h-16">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <img src={logo} alt="Logo" className="h-10" onClick={() => navigate('/')} />
        </div>
      </header>

      <main className="container-custom py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground mb-8">
            Select a package and complete payment to unlock premium features
          </p>

          {/* Package Selection */}
          {!selectedPackage ? (
            <div className="grid sm:grid-cols-3 gap-6 mb-8">
              {packages.map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`bg-card rounded-2xl p-6 border-2 cursor-pointer transition-all hover:border-primary ${
                    pkg.name === 'Pro' ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                  }`}
                >
                  {pkg.name === 'Pro' && (
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                      Popular
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-foreground mt-4">{pkg.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{pkg.description}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-foreground">৳{pkg.price}</span>
                    <span className="text-muted-foreground">/{pkg.duration_days} days</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                        <Check size={16} className="text-primary flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-6" variant={pkg.name === 'Pro' ? 'default' : 'outline'}>
                    Select Plan
                  </Button>
                </motion.div>
              ))}
            </div>
          ) : (
            <>
              {/* Selected Package Summary */}
              <div className="bg-card rounded-2xl p-6 border border-border mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-foreground">{selectedPackage.name} Plan</h3>
                    <p className="text-sm text-muted-foreground">{selectedPackage.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">৳{selectedPackage.price}</p>
                    <button 
                      onClick={() => setSelectedPackage(null)}
                      className="text-sm text-primary hover:underline"
                    >
                      Change plan
                    </button>
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
                        <p className="text-sm text-muted-foreground mt-2">Amount: ৳{selectedPackage.price}</p>
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
                        className="bg-background"
                      />
                      {errors.transaction_id && (
                        <p className="text-xs text-destructive mt-1">{errors.transaction_id}</p>
                      )}
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
                          className="bg-background"
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
                            className="bg-background"
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
                            className="bg-background"
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
                        onChange={handleScreenshotUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      {screenshotUrl ? (
                        <div className="relative w-full h-40 rounded-xl overflow-hidden bg-muted">
                          <img src={screenshotUrl} alt="Screenshot" className="w-full h-full object-contain" />
                          <button
                            onClick={() => setScreenshotUrl(null)}
                            className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-full"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingScreenshot}
                          className="w-full h-20 border-dashed"
                        >
                          {uploadingScreenshot ? (
                            <Loader2 className="animate-spin mr-2" size={20} />
                          ) : (
                            <Upload size={20} className="mr-2" />
                          )}
                          {uploadingScreenshot ? 'Uploading...' : 'Upload Screenshot'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || !formData.transaction_id}
                    className="w-full mt-6"
                    size="lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={20} />
                        Submitting...
                      </>
                    ) : (
                      'Submit Payment'
                    )}
                  </Button>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}