import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Check, 
  X, 
  Loader2,
  Filter,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface Appointment {
  id: string;
  visitor_name: string;
  visitor_email: string;
  visitor_phone: string | null;
  appointment_date: string;
  appointment_time: string;
  notes: string | null;
  status: string;
  created_at: string;
}

interface AppointmentDashboardProps {
  vcardId: string;
}

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'cancelled';

export default function AppointmentDashboard({ vcardId }: AppointmentDashboardProps) {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');

  useEffect(() => {
    fetchAppointments();
  }, [vcardId]);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vcard_appointments')
      .select('*')
      .eq('vcard_id', vcardId)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) {
      toast({ title: 'Failed to load appointments', variant: 'destructive' });
    } else {
      setAppointments(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    setUpdating(id);
    const { error } = await supabase
      .from('vcard_appointments')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    } else {
      setAppointments(prev => 
        prev.map(apt => apt.id === id ? { ...apt, status } : apt)
      );
      toast({ title: `Appointment ${status}!` });
    }
    setUpdating(null);
  };

  const filteredAppointments = appointments.filter(apt => 
    filter === 'all' ? true : apt.status === filter
  );

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    confirmed: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
  };

  const counts = {
    all: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'confirmed', 'cancelled'] as FilterStatus[]).map((status) => (
          <Button
            key={status}
            size="sm"
            variant={filter === status ? 'default' : 'outline'}
            onClick={() => setFilter(status)}
            className="capitalize"
          >
            <Filter size={14} className="mr-1" />
            {status} ({counts[status]})
          </Button>
        ))}
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-xl border border-border">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {filter === 'all' 
              ? 'No appointments yet' 
              : `No ${filter} appointments`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredAppointments.map((apt) => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="bg-background border border-border rounded-xl p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Date & Time */}
                  <div className="flex-shrink-0 sm:w-24 text-center sm:text-left">
                    <div className="inline-flex sm:flex flex-col items-center sm:items-start gap-1 bg-primary/10 rounded-lg px-3 py-2">
                      <span className="text-lg font-bold text-primary">
                        {format(new Date(apt.appointment_date), 'dd')}
                      </span>
                      <span className="text-xs text-primary/80 uppercase">
                        {format(new Date(apt.appointment_date), 'MMM yyyy')}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock size={12} />
                        {apt.appointment_time}
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-primary" />
                        <span className="font-semibold text-foreground">{apt.visitor_name}</span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`capitalize ${statusColors[apt.status] || ''}`}
                      >
                        {apt.status}
                      </Badge>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail size={14} />
                        <span className="truncate">{apt.visitor_email}</span>
                      </div>
                      {apt.visitor_phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={14} />
                          <span>{apt.visitor_phone}</span>
                        </div>
                      )}
                    </div>

                    {apt.notes && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-2">
                        <MessageSquare size={14} className="mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{apt.notes}</span>
                      </div>
                    )}

                    {/* Actions */}
                    {apt.status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => updateStatus(apt.id, 'confirmed')}
                          disabled={updating === apt.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {updating === apt.id ? (
                            <Loader2 size={14} className="mr-1 animate-spin" />
                          ) : (
                            <Check size={14} className="mr-1" />
                          )}
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(apt.id, 'cancelled')}
                          disabled={updating === apt.id}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <X size={14} className="mr-1" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
