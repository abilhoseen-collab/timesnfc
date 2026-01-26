import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowUpCircle, Upload, Loader2, CheckCircle, TrendingUp, Calculator } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePaymentSettings } from '@/hooks/usePaymentSettings';

interface Package {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  vcard_limit: number;
  landing_page_limit: number;
}

interface UpgradePackageFormProps {
  userId: string;
  currentSubscriptionId: string;
  currentPackageName: string;
  currentExpiresAt?: string;
  onSuccess: () => void;
}

export default function UpgradePackageForm({
  userId,
  currentSubscriptionId,
  currentPackageName,
  currentExpiresAt,
  onSuccess,
}: UpgradePackageFormProps) {
  const { toast } = useToast();
  const { settings: paymentSettings } = usePaymentSettings();
  const [packages, setPackages] = useState<Package[]>([]);
  const [currentPackage, setCurrentPackage] = useState<Package | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    const { data, error } = await supabase
      .from('packages')
      .select('id, name, price, duration_days, vcard_limit, landing_page_limit')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (!error && data) {
      const current = data.find((p) => p.name === currentPackageName);
      setCurrentPackage(current || null);
      // Filter to only show higher tier packages
      setPackages(data.filter((p) => current ? p.price > current.price : true));
    }
  };

  // Calculate pro-rated pricing
  const calculateProRatedPrice = (targetPackage: Package): { 
    proRatedAmount: number; 
    daysRemaining: number; 
    creditAmount: number;
    fullPrice: number;
  } | null => {
    if (!currentPackage || !currentExpiresAt) {
      return { 
        proRatedAmount: targetPackage.price, 
        daysRemaining: 0, 
        creditAmount: 0,
        fullPrice: targetPackage.price 
      };
    }

    const now = new Date();
    const expiresAt = new Date(currentExpiresAt);
    const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    if (daysRemaining <= 0) {
      return { 
        proRatedAmount: targetPackage.price, 
        daysRemaining: 0, 
        creditAmount: 0,
        fullPrice: targetPackage.price 
      };
    }

    // Calculate daily rate of current package
    const currentDailyRate = currentPackage.price / currentPackage.duration_days;
    // Credit for unused days
    const creditAmount = Math.round(currentDailyRate * daysRemaining);
    // Pro-rated amount = Target price - Credit
    const proRatedAmount = Math.max(0, targetPackage.price - creditAmount);

    return {
      proRatedAmount,
      daysRemaining,
      creditAmount,
      fullPrice: targetPackage.price,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage || !transactionId) {
      toast({ title: 'সব তথ্য পূরণ করুন', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      let screenshotUrl = null;

      // Upload screenshot if provided
      if (screenshot) {
        const fileExt = screenshot.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('payment-screenshots')
          .upload(fileName, screenshot);

        if (uploadError) throw uploadError;
        screenshotUrl = fileName;
      }

      const pkg = packages.find((p) => p.id === selectedPackage);
      const pricing = pkg ? calculateProRatedPrice(pkg) : null;

      // Create upgrade request with pro-rated amount
      const { error } = await supabase.from('upgrade_requests').insert({
        user_id: userId,
        current_subscription_id: currentSubscriptionId,
        target_package_id: selectedPackage,
        amount: pricing?.proRatedAmount || pkg?.price || 0,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        sender_number: senderNumber || null,
        payment_screenshot_url: screenshotUrl,
        status: 'pending',
      });

      if (error) throw error;

      toast({ title: 'আপগ্রেড রিকোয়েস্ট সফলভাবে জমা হয়েছে!' });
      setShowModal(false);
      onSuccess();
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({ title: 'আপগ্রেড রিকোয়েস্ট জমা দিতে সমস্যা হয়েছে', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const selectedPkg = packages.find((p) => p.id === selectedPackage);
  const pricing = selectedPkg ? calculateProRatedPrice(selectedPkg) : null;

  const getPaymentNumber = () => {
    switch (paymentMethod) {
      case 'bkash': return paymentSettings?.bkash_number || '01815726006';
      case 'nagad': return paymentSettings?.nagad_number || '01815726006';
      case 'rocket': return paymentSettings?.rocket_number || '01815726006';
      default: return `${paymentSettings?.bank_name || 'Bank'} - ${paymentSettings?.bank_account_number || 'Account details will be provided'}`;
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
        onClick={() => setShowModal(true)}
      >
        <ArrowUpCircle size={18} className="mr-2" />
        আপগ্রেড করুন
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle size={20} className="text-primary" />
              প্যাকেজ আপগ্রেড করুন
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Package */}
            <div className="bg-muted rounded-lg p-4">
              <Label className="text-xs text-muted-foreground">বর্তমান প্যাকেজ</Label>
              <div className="flex items-center justify-between mt-1">
                <span className="font-bold text-foreground">{currentPackageName}</span>
                {currentPackage && (
                  <span className="text-sm text-muted-foreground">
                    ৳{currentPackage.price}/{currentPackage.duration_days} দিন
                  </span>
                )}
              </div>
              {currentPackage && (
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>{currentPackage.vcard_limit} VCards</span>
                  <span>{currentPackage.landing_page_limit} Landing Pages</span>
                </div>
              )}
            </div>

            {/* Select New Package */}
            <div>
              <Label>নতুন প্যাকেজ নির্বাচন করুন</Label>
              <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                <SelectTrigger>
                  <SelectValue placeholder="প্যাকেজ বেছে নিন" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span className="font-medium">{pkg.name}</span>
                        <span className="text-sm text-muted-foreground">
                          ৳{pkg.price} • {pkg.vcard_limit} VCards • {pkg.landing_page_limit} LP
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pro-rated Pricing Breakdown */}
            {selectedPkg && pricing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-4 border border-primary/20"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Calculator size={16} className="text-primary" />
                  <span className="font-medium text-foreground text-sm">প্রো-রেটেড মূল্য হিসাব</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{selectedPkg.name} মূল্য</span>
                    <span className="font-medium">৳{pricing.fullPrice}</span>
                  </div>
                  
                  {pricing.daysRemaining > 0 && pricing.creditAmount > 0 && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>বাকি {pricing.daysRemaining} দিনের ক্রেডিট</span>
                        <span>- ৳{pricing.creditAmount}</span>
                      </div>
                      <div className="border-t border-border pt-2 mt-2">
                        <div className="flex justify-between font-bold text-lg">
                          <span className="text-foreground">পেমেন্ট করুন</span>
                          <span className="text-primary">৳{pricing.proRatedAmount}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        * আপনার বর্তমান প্ল্যানের অব্যবহৃত দিনের টাকা বাদ দেওয়া হয়েছে
                      </p>
                    </>
                  )}
                  
                  {(pricing.daysRemaining === 0 || pricing.creditAmount === 0) && (
                    <div className="border-t border-border pt-2 mt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span className="text-foreground">পেমেন্ট করুন</span>
                        <span className="text-primary">৳{pricing.proRatedAmount}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* New Package Benefits */}
                <div className="mt-4 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp size={14} className="text-green-500" />
                    <span className="text-muted-foreground">আপগ্রেডের পর পাবেন:</span>
                  </div>
                  <div className="flex gap-4 mt-1 text-sm font-medium text-foreground">
                    <span className="text-primary">{selectedPkg.vcard_limit} VCards</span>
                    <span className="text-secondary">{selectedPkg.landing_page_limit} Landing Pages</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Payment Info */}
            {selectedPkg && (
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                <p className="text-sm font-medium text-orange-800 mb-1">
                  পেমেন্ট পাঠান এই নম্বরে:
                </p>
                <p className="text-lg font-bold text-orange-900">{getPaymentNumber()}</p>
              </div>
            )}

            {/* Payment Method */}
            <div>
              <Label>পেমেন্ট মেথড</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bkash">bKash</SelectItem>
                  <SelectItem value="nagad">Nagad</SelectItem>
                  <SelectItem value="rocket">Rocket</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Transaction ID */}
            <div>
              <Label>ট্রান্সেকশন আইডি *</Label>
              <Input
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="ট্রান্সেকশন আইডি লিখুন"
                required
              />
            </div>

            {/* Sender Number */}
            <div>
              <Label>সেন্ডার নম্বর</Label>
              <Input
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                placeholder="যে নম্বর থেকে পাঠিয়েছেন"
              />
            </div>

            {/* Screenshot */}
            <div>
              <Label>পেমেন্ট স্ক্রিনশট</Label>
              <div className="mt-1">
                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <Upload size={18} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {screenshot ? screenshot.name : 'স্ক্রিনশট আপলোড করুন'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !selectedPackage}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  জমা হচ্ছে...
                </>
              ) : (
                <>
                  <CheckCircle size={18} className="mr-2" />
                  আপগ্রেড রিকোয়েস্ট জমা দিন
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
