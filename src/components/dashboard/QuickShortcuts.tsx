import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Plug, CalendarClock, BarChart3, ArrowRight } from 'lucide-react';

const items = [
  {
    icon: User,
    title: 'প্রোফাইল',
    desc: 'নাম, ফোন ও ইমেইল আপডেট করুন',
    to: '/settings',
    color: 'from-teal-500 to-cyan-500',
  },
  {
    icon: Plug,
    title: 'ইন্টিগ্রেশন',
    desc: 'Zapier, Meta Pixel, Google Analytics',
    to: '/settings?tab=integrations',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: CalendarClock,
    title: 'অ্যাপয়েন্টমেন্ট',
    desc: 'বুকিং ও রিমাইন্ডার ম্যানেজ করুন',
    to: '/leads',
    color: 'from-orange-500 to-rose-500',
  },
  {
    icon: BarChart3,
    title: 'রিপোর্ট',
    desc: 'Analytics ও Weekly digest',
    to: '/settings?tab=notifications',
    color: 'from-emerald-500 to-teal-500',
  },
];

export default function QuickShortcuts() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="mb-8"
    >
      <h2 className="text-lg font-bold text-foreground mb-3">দ্রুত শর্টকাট</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map(({ icon: Icon, title, desc, to, color }) => (
          <button
            key={title}
            onClick={() => navigate(to)}
            className="group text-left bg-card rounded-2xl p-4 border border-border hover:shadow-lg hover:border-primary/40 transition-all"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-sm`}>
              <Icon size={18} className="text-white" />
            </div>
            <div className="font-semibold text-foreground text-sm mb-0.5">{title}</div>
            <div className="text-xs text-muted-foreground line-clamp-2">{desc}</div>
            <div className="mt-2 flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              খুলুন <ArrowRight size={12} />
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
