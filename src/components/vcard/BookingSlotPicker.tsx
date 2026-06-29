import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Props {
  vcardId: string;
  date: string; // yyyy-mm-dd
  startTime: string | null; // HH:mm
  endTime: string | null;
  durationMinutes: number;
  availableDays: string[]; // ['monday', ...]
  value: string;
  onChange: (time: string) => void;
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function BookingSlotPicker({
  vcardId, date, startTime, endTime, durationMinutes, availableDays, value, onChange,
}: Props) {
  const [booked, setBooked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const allSlots = useMemo(() => {
    if (!startTime || !endTime) return [];
    const [sh, sm = 0] = startTime.split(':').map(Number);
    const [eh, em = 0] = endTime.split(':').map(Number);
    const dur = Math.max(5, durationMinutes || 30);
    const s = sh * 60 + sm, e = eh * 60 + em;
    const out: string[] = [];
    for (let m = s; m + dur <= e; m += dur) {
      out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
    }
    return out;
  }, [startTime, endTime, durationMinutes]);

  const dayAllowed = useMemo(() => {
    if (!date) return true;
    const d = new Date(date + 'T00:00:00');
    const name = DAY_NAMES[d.getDay()];
    return availableDays?.length ? availableDays.includes(name) : true;
  }, [date, availableDays]);

  useEffect(() => {
    if (!vcardId || !date) return;
    setLoading(true);
    supabase
      .from('vcard_appointments')
      .select('appointment_time')
      .eq('vcard_id', vcardId)
      .eq('appointment_date', date)
      .in('status', ['pending', 'confirmed'])
      .then(({ data }) => {
        setBooked(new Set((data ?? []).map((r: any) => (r.appointment_time as string).slice(0, 5))));
        setLoading(false);
      });
  }, [vcardId, date]);

  const isPastDate = date && date < new Date().toISOString().split('T')[0];
  const todayHM = new Date().toTimeString().slice(0, 5);
  const isToday = date === new Date().toISOString().split('T')[0];

  if (!date) return <p className="text-sm text-muted-foreground">প্রথমে তারিখ বাছাই করুন</p>;
  if (isPastDate) return <p className="text-sm text-destructive">অতীত তারিখ নির্বাচন করা যাবে না</p>;
  if (!dayAllowed) return <p className="text-sm text-destructive">এই দিনে বুকিং পাওয়া যাচ্ছে না</p>;
  if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;
  if (allSlots.length === 0) return <p className="text-sm text-muted-foreground">কোনো স্লট কনফিগার করা নেই</p>;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto">
      {allSlots.map((slot) => {
        const isBooked = booked.has(slot);
        const isPast = isToday && slot <= todayHM;
        const disabled = isBooked || isPast;
        const selected = value === slot;
        return (
          <button
            key={slot}
            type="button"
            disabled={disabled}
            onClick={() => onChange(slot)}
            className={cn(
              'px-2 py-2 rounded-md text-sm border transition',
              selected && 'bg-primary text-primary-foreground border-primary',
              !selected && !disabled && 'border-input hover:bg-accent',
              disabled && 'opacity-40 line-through cursor-not-allowed bg-muted'
            )}
          >
            {slot}
          </button>
        );
      })}
    </div>
  );
}
