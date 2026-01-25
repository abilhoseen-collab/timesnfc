import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CalendarDays, List, Mail } from 'lucide-react';
import AppointmentDashboard from '@/components/vcard/AppointmentDashboard';
import { FormData } from './types';

interface AppointmentSettingsProps {
  formData: FormData;
  onChange: (field: keyof FormData, value: string | boolean | number) => void;
  currentVcardId: string | null;
}

export default function AppointmentSettings({ formData, onChange, currentVcardId }: AppointmentSettingsProps) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Calendar size={20} className="text-primary" />
        Appointment Booking
      </h2>
      
      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Calendar size={14} />
            Settings
          </TabsTrigger>
          <TabsTrigger value="bookings" className="flex items-center gap-2">
            <CalendarDays size={14} />
            Bookings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings">
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-muted/50 rounded-xl">
              <input
                type="checkbox"
                checked={formData.appointment_enabled}
                onChange={(e) => onChange('appointment_enabled', e.target.checked)}
                className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
              />
              <div>
                <span className="text-sm font-medium text-foreground">Enable Appointment Booking</span>
                <p className="text-xs text-muted-foreground">Let visitors schedule meetings with you</p>
              </div>
            </label>
            
            {formData.appointment_enabled && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Button Text
                  </label>
                  <Input
                    placeholder="Book an Appointment"
                    value={formData.appointment_title}
                    onChange={(e) => onChange('appointment_title', e.target.value)}
                    className="bg-background"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description (Optional)
                  </label>
                  <Textarea
                    placeholder="Schedule a free consultation..."
                    value={formData.appointment_description}
                    onChange={(e) => onChange('appointment_description', e.target.value)}
                    className="bg-background"
                    rows={2}
                  />
                </div>
                
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Duration (minutes)
                    </label>
                    <select
                      value={formData.appointment_duration_minutes}
                      onChange={(e) => onChange('appointment_duration_minutes', parseInt(e.target.value))}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>1 hour</option>
                      <option value={90}>1.5 hours</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Start Time
                    </label>
                    <Input
                      type="time"
                      value={formData.appointment_start_time}
                      onChange={(e) => onChange('appointment_start_time', e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      End Time
                    </label>
                    <Input
                      type="time"
                      value={formData.appointment_end_time}
                      onChange={(e) => onChange('appointment_end_time', e.target.value)}
                      className="bg-background"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Notification Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      type="email"
                      placeholder="Receive booking notifications at..."
                      value={formData.appointment_email}
                      onChange={(e) => onChange('appointment_email', e.target.value)}
                      className="pl-10 bg-background"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Get notified when someone books an appointment
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="bookings">
          {currentVcardId ? (
            <AppointmentDashboard vcardId={currentVcardId} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <List size={32} className="mx-auto mb-2 opacity-50" />
              <p>Save your card first to see appointments</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
