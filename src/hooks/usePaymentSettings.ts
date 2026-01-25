import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PaymentSettings {
  bkash_number: string;
  nagad_number: string;
  rocket_number: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_branch: string;
  bank_routing_number: string;
}

const defaultSettings: PaymentSettings = {
  bkash_number: '01XXXXXXXXX',
  nagad_number: '01XXXXXXXXX',
  rocket_number: '01XXXXXXXXX',
  bank_name: 'Your Bank Name',
  bank_account_name: 'Account Holder Name',
  bank_account_number: 'XXXXXXXXXXXX',
  bank_branch: 'Branch Name',
  bank_routing_number: 'XXXXXXXXX',
};

export function usePaymentSettings() {
  const [settings, setSettings] = useState<PaymentSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'payment_settings')
        .maybeSingle();

      if (data && !error && typeof data.value === 'object' && data.value !== null) {
        const value = data.value as unknown as PaymentSettings;
        setSettings({ ...defaultSettings, ...value });
      }
      setLoading(false);
    };

    fetchSettings();
  }, []);

  const getPaymentMethods = () => [
    {
      id: 'bkash',
      name: 'bKash',
      color: 'bg-pink-500',
      number: settings.bkash_number || defaultSettings.bkash_number,
      type: 'Send Money',
      instructions: 'Send money to the number above and provide transaction ID',
    },
    {
      id: 'nagad',
      name: 'Nagad',
      color: 'bg-orange-500',
      number: settings.nagad_number || defaultSettings.nagad_number,
      type: 'Send Money',
      instructions: 'Send money to the number above and provide transaction ID',
    },
    {
      id: 'rocket',
      name: 'Rocket',
      color: 'bg-purple-600',
      number: settings.rocket_number || defaultSettings.rocket_number,
      type: 'Send Money',
      instructions: 'Send money to the number above and provide transaction ID',
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      color: 'bg-blue-600',
      bankName: settings.bank_name || defaultSettings.bank_name,
      accountName: settings.bank_account_name || defaultSettings.bank_account_name,
      accountNumber: settings.bank_account_number || defaultSettings.bank_account_number,
      routingNumber: settings.bank_routing_number || defaultSettings.bank_routing_number,
      branch: settings.bank_branch || defaultSettings.bank_branch,
      instructions: 'Transfer to the bank account and provide transaction details',
    },
  ];

  return { settings, loading, getPaymentMethods };
}
