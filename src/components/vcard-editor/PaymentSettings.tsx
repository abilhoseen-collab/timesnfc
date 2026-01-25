import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Wallet } from 'lucide-react';
import { FormData } from './types';

interface PaymentSettingsProps {
  formData: FormData;
  onChange: (field: keyof FormData, value: string | boolean | number) => void;
}

export default function PaymentSettings({ formData, onChange }: PaymentSettingsProps) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Wallet size={20} className="text-primary" />
        Payment / Donation
      </h2>
      <div className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer p-3 bg-muted/50 rounded-xl">
          <input
            type="checkbox"
            checked={formData.payment_enabled}
            onChange={(e) => onChange('payment_enabled', e.target.checked)}
            className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
          />
          <div>
            <span className="text-sm font-medium text-foreground">Enable Payment Button</span>
            <p className="text-xs text-muted-foreground">Let visitors send you payments or donations</p>
          </div>
        </label>
        
        {formData.payment_enabled && (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Button Text
              </label>
              <Input
                placeholder="Send Payment / Donate"
                value={formData.payment_button_text}
                onChange={(e) => onChange('payment_button_text', e.target.value)}
                className="bg-background"
              />
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  bKash Number
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">b</span>
                  </div>
                  <Input
                    placeholder="01XXXXXXXXX"
                    value={formData.payment_bkash}
                    onChange={(e) => onChange('payment_bkash', e.target.value)}
                    className="pl-11 bg-background"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nagad Number
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">N</span>
                  </div>
                  <Input
                    placeholder="01XXXXXXXXX"
                    value={formData.payment_nagad}
                    onChange={(e) => onChange('payment_nagad', e.target.value)}
                    className="pl-11 bg-background"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Rocket Number
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">R</span>
                  </div>
                  <Input
                    placeholder="01XXXXXXXXX"
                    value={formData.payment_rocket}
                    onChange={(e) => onChange('payment_rocket', e.target.value)}
                    className="pl-11 bg-background"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Bank Details (Optional)
              </label>
              <Textarea
                placeholder="Bank: XYZ Bank&#10;Account: 1234567890&#10;Branch: Dhaka"
                value={formData.payment_bank_details}
                onChange={(e) => onChange('payment_bank_details', e.target.value)}
                className="bg-background"
                rows={3}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
