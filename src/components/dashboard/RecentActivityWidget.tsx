import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Bell, ArrowRight, CheckCircle2, Clock, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Appt {
  id: string;
  visitor_name: string;
  visitor_phone: string | null;
  appointment_date: string;
  appointment_time: string;
  status: string | null;
  reminder_sent_at: string | null;
  phone_verified: boolean;
  vcard_id: string;
}

export default function RecentActivityWidget({ userId }: { userId?: string }) {
  const navigate = useNavigate();
  const [appts, setAppts] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const { data: cards } = await supabase
          .from('vcards')
          .select('id')
          .eq('user_id', userId);
        const ids = (cards || []).map((c) => c.id);
        if (!ids.length) {
          setAppts([]);
          return;
        }
        const { data } = await supabase
          .from('vcard_appointments')
          .select('id, visitor_name, visitor_phone, appointment_date, appointment_time, status, reminder_sent_at, phone_verified, vcard_id')
          .in('vcard_id', ids)
          .order('created_at', { ascending: false })
          .limit(5);
        setAppts((data as Appt[]) || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-8 grid md:grid-cols-2 gap-4"
    >
      {/* Recent bookings */}
      <div className="bg-card rounded-2xl p-5 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            <h3 className="font-semibold text-foreground">সাম্প্রতিক বুকিং</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/leads')}>
            সব দেখুন <ArrowRight size={12} className="ml-1" />
          </Button>
        </div>
        {loading ? (
          <div className="text-sm text-muted-foreground py-4">লোড হচ্ছে...</div>
        ) : appts.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            এখনো কোনো বুকিং নেই
          </div>
        ) : (
          <ul className="space-y-2">
            {appts.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted/50">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate flex items-center gap-1.5">
                    {a.visitor_name}
                    {a.phone_verified && (
                      <PhoneCall size={12} className="text-emerald-500" aria-label="Phone verified" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {a.appointment_date} • {a.appointment_time}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  a.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                  a.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {a.status || 'pending'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Reminders sent */}
      <div className="bg-card rounded-2xl p-5 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Bell size={16} className="text-secondary" />
          <h3 className="font-semibold text-foreground">পাঠানো রিমাইন্ডার</h3>
        </div>
        {loading ? (
          <div className="text-sm text-muted-foreground py-4">লোড হচ্ছে...</div>
        ) : (
          (() => {
            const reminded = appts.filter((a) => a.reminder_sent_at);
            if (reminded.length === 0) {
              return (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  এখনো কোনো রিমাইন্ডার পাঠানো হয়নি। বুকিংয়ের ২৪ ঘণ্টা আগে স্বয়ংক্রিয়ভাবে পাঠানো হবে।
                </div>
              );
            }
            return (
              <ul className="space-y-2">
                {reminded.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{a.visitor_name}</div>
                      <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(a.reminder_sent_at!).toLocaleString('bn-BD', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            );
          })()
        )}
      </div>
    </motion.div>
  );
}
