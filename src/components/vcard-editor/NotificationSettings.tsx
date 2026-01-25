import { Input } from '@/components/ui/input';
import { Bell, Mail } from 'lucide-react';
import { FormData } from './types';

interface NotificationSettingsProps {
  formData: FormData;
  onChange: (field: keyof FormData, value: string | boolean | number) => void;
}

export default function NotificationSettings({ formData, onChange }: NotificationSettingsProps) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Bell size={20} className="text-primary" />
        Notifications
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Notification Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              type="email"
              placeholder="your@email.com"
              value={formData.notification_email}
              onChange={(e) => onChange('notification_email', e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Receive notifications when someone interacts with your card.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.notify_on_view}
              onChange={(e) => onChange('notify_on_view', e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm text-foreground">Notify on card view</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.notify_on_click}
              onChange={(e) => onChange('notify_on_click', e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm text-foreground">Notify on link click</span>
          </label>
        </div>
      </div>
    </div>
  );
}
