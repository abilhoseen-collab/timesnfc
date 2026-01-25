import { Input } from '@/components/ui/input';
import { MessageCircle, Send } from 'lucide-react';
import { FormData } from './types';

interface ChatWidgetSettingsProps {
  formData: FormData;
  onChange: (field: keyof FormData, value: string | boolean | number) => void;
}

export default function ChatWidgetSettings({ formData, onChange }: ChatWidgetSettingsProps) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <MessageCircle size={20} className="text-primary" />
        Live Chat Widget
      </h2>
      <div className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer p-3 bg-muted/50 rounded-xl">
          <input
            type="checkbox"
            checked={formData.chat_enabled}
            onChange={(e) => onChange('chat_enabled', e.target.checked)}
            className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
          />
          <div>
            <span className="text-sm font-medium text-foreground">Enable Chat Widget</span>
            <p className="text-xs text-muted-foreground">Show floating WhatsApp/Telegram buttons on your card</p>
          </div>
        </label>
        
        {formData.chat_enabled && (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                WhatsApp Number
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">W</span>
                </div>
                <Input
                  placeholder="+880 1XXXXXXXXX"
                  value={formData.whatsapp_number}
                  onChange={(e) => onChange('whatsapp_number', e.target.value)}
                  className="pl-11 bg-background"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Include country code (e.g., +880)</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Telegram Username
              </label>
              <div className="relative">
                <Send className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                <Input
                  placeholder="@yourusername"
                  value={formData.telegram_username}
                  onChange={(e) => onChange('telegram_username', e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
