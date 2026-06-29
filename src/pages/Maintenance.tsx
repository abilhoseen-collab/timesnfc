import { motion } from 'framer-motion';
import { Wrench, Clock } from 'lucide-react';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';

export default function Maintenance() {
  const { config } = useMaintenanceMode();
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center text-white"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto flex items-center justify-center mb-6">
          <Wrench size={36} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-3">রক্ষণাবেক্ষণ চলছে</h1>
        <p className="text-white/70 mb-6 whitespace-pre-wrap">
          {config.message || 'আমরা এই মুহূর্তে কিছু আপডেট করছি। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন।'}
        </p>
        {config.eta && (
          <div className="flex items-center justify-center gap-2 text-sm text-white/60 bg-white/5 rounded-xl py-3 px-4">
            <Clock size={16} />
            <span>প্রত্যাশিত সময়: {config.eta}</span>
          </div>
        )}
        <p className="text-xs text-white/40 mt-6">Times Digital</p>
      </motion.div>
    </div>
  );
}
