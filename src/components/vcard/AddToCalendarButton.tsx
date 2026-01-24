import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CalendarPlus, Download, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addMinutes, parseISO } from 'date-fns';

interface AddToCalendarButtonProps {
  appointment: {
    title: string;
    description?: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
    duration: number; // in minutes
    location?: string;
    organizer?: {
      name: string;
      email?: string;
    };
  };
  onTrackClick?: (action: string) => void;
}

export default function AddToCalendarButton({ appointment, onTrackClick }: AddToCalendarButtonProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [copied, setCopied] = useState(false);

  const getStartDateTime = () => {
    const [hours, minutes] = appointment.time.split(':').map(Number);
    const date = parseISO(appointment.date);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const getEndDateTime = () => {
    return addMinutes(getStartDateTime(), appointment.duration);
  };

  const formatDateForGoogle = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const formatDateForICS = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const generateGoogleCalendarUrl = () => {
    const start = formatDateForGoogle(getStartDateTime());
    const end = formatDateForGoogle(getEndDateTime());
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: appointment.title,
      dates: `${start}/${end}`,
      details: appointment.description || '',
      location: appointment.location || '',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const generateICSContent = () => {
    const start = formatDateForICS(getStartDateTime());
    const end = formatDateForICS(getEndDateTime());
    const uid = `${Date.now()}@vcard-appointment`;

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//VCard Appointment//EN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatDateForICS(new Date())}
DTSTART:${start}
DTEND:${end}
SUMMARY:${appointment.title}
DESCRIPTION:${appointment.description || ''}
LOCATION:${appointment.location || ''}
${appointment.organizer ? `ORGANIZER;CN=${appointment.organizer.name}:mailto:${appointment.organizer.email || 'noreply@example.com'}` : ''}
END:VEVENT
END:VCALENDAR`;
  };

  const handleGoogleCalendar = () => {
    onTrackClick?.('add_to_google_calendar');
    window.open(generateGoogleCalendarUrl(), '_blank');
    setShowOptions(false);
  };

  const handleDownloadICS = () => {
    onTrackClick?.('download_ics');
    const icsContent = generateICSContent();
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `appointment-${appointment.date}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowOptions(false);
  };

  const handleOutlookCalendar = () => {
    onTrackClick?.('add_to_outlook');
    const start = getStartDateTime();
    const end = getEndDateTime();
    
    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      startdt: start.toISOString(),
      enddt: end.toISOString(),
      subject: appointment.title,
      body: appointment.description || '',
      location: appointment.location || '',
    });

    window.open(`https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`, '_blank');
    setShowOptions(false);
  };

  const handleCopyDetails = async () => {
    const details = `📅 ${appointment.title}
📆 তারিখ: ${format(getStartDateTime(), 'dd MMMM yyyy')}
⏰ সময়: ${appointment.time}
⏱️ সময়কাল: ${appointment.duration} মিনিট
${appointment.location ? `📍 স্থান: ${appointment.location}` : ''}
${appointment.description ? `📝 বিবরণ: ${appointment.description}` : ''}`;

    await navigator.clipboard.writeText(details);
    onTrackClick?.('copy_appointment_details');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setShowOptions(!showOptions)}
        variant="outline"
        className="gap-2"
      >
        <CalendarPlus size={16} />
        ক্যালেন্ডারে যোগ করুন
      </Button>

      <AnimatePresence>
        {showOptions && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOptions(false)}
              className="fixed inset-0 z-40"
            />

            {/* Options Menu */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full left-0 mb-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden min-w-[220px]"
            >
              {/* Header */}
              <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center justify-between">
                <span className="font-medium text-sm">ক্যালেন্ডারে যোগ করুন</span>
                <button
                  onClick={() => setShowOptions(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Options */}
              <div className="p-2">
                <button
                  onClick={handleGoogleCalendar}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                    <Calendar size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Google Calendar</p>
                    <p className="text-xs text-muted-foreground">গুগল ক্যালেন্ডারে যোগ করুন</p>
                  </div>
                </button>

                <button
                  onClick={handleOutlookCalendar}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
                    <Calendar size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Outlook Calendar</p>
                    <p className="text-xs text-muted-foreground">আউটলুক ক্যালেন্ডারে যোগ করুন</p>
                  </div>
                </button>

                <button
                  onClick={handleDownloadICS}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-600 to-gray-400 flex items-center justify-center">
                    <Download size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">ICS ফাইল ডাউনলোড</p>
                    <p className="text-xs text-muted-foreground">Apple/Other ক্যালেন্ডারের জন্য</p>
                  </div>
                </button>

                <div className="border-t border-border mt-2 pt-2">
                  <button
                    onClick={handleCopyDetails}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center">
                      {copied ? (
                        <Check size={16} className="text-white" />
                      ) : (
                        <Calendar size={16} className="text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {copied ? 'কপি হয়েছে!' : 'বিস্তারিত কপি করুন'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {copied ? 'ক্লিপবোর্ডে কপি হয়েছে' : 'অ্যাপয়েন্টমেন্টের তথ্য কপি করুন'}
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
