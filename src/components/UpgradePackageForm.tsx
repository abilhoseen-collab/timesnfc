import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowUpCircle, Upload, Loader2, CheckCircle } from 'lucide-react';
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

interface Package {
  id: string;
  name: string;
  price: number;
  duration_days: number;
}

interface UpgradePackageFormProps {
  userId: string;
  currentSubscriptionId: string;
  currentPackageName: string;
  onSuccess: () => void;
}

export default function UpgradePackageForm({
  userId,
  currentSubscriptionId,
  currentPackageName,
  onSuccess,
}: UpgradePackageFormProps) {
  const { toast } = useToast();
  const [packages, setPackages] = useState<Package[]>([]);
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
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (!error && data) {
      // Filter out current package
      setPackages(data.filter((p) => p.name !== currentPackageName));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage || !transactionId) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
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

      // Create upgrade request
      const { error } = await supabase.from('upgrade_requests').insert({
        user_id: userId,
        current_subscription_id: currentSubscriptionId,
        target_package_id: selectedPackage,
        amount: pkg?.price || 0,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        sender_number: senderNumber || null,
        payment_screenshot_url: screenshotUrl,
        status: 'pending',
      });

      if (error) throw error;

      toast({ title: 'Upgrade request submitted successfully!' });
      setShowModal(false);
      onSuccess();
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({ title: 'Failed to submit upgrade request', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const selectedPkg = packages.find((p) => p.id === selectedPackage);

  return (
    <>
      <Button
        variant="outline"
        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
        onClick={() => setShowModal(true)}
      >
        <ArrowUpCircle size={18} className="mr-2" />
        Upgrade Package
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle size={20} className="text-primary" />
              Upgrade Your Package
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Current Package</Label>
              <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-lg">
                {currentPackageName}
              </p>
            </div>

            <div>
              <Label>Select New Package</Label>
              <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a package" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name} - ৳{pkg.price} ({pkg.duration_days} days)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPkg && (
              <div className="bg-accent/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Amount to Pay</p>
                <p className="text-2xl font-bold text-foreground">৳{selectedPkg.price}</p>
              </div>
            )}

            <div>
              <Label>Payment Method</Label>
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

            <div>
              <Label>Transaction ID *</Label>
              <Input
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction ID"
                required
              />
            </div>

            <div>
              <Label>Sender Number</Label>
              <Input
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                placeholder="Enter sender number"
              />
            </div>

            <div>
              <Label>Payment Screenshot</Label>
              <div className="mt-1">
                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <Upload size={18} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {screenshot ? screenshot.name : 'Upload screenshot'}
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
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle size={18} className="mr-2" />
                  Submit Upgrade Request
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
