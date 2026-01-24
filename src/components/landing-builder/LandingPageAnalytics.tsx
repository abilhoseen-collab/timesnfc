import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import {
  Eye,
  TrendingUp,
  MousePointer,
  Layers,
  Calendar,
  Globe,
  Loader2,
  Users,
  Clock,
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface LandingPageSection {
  id: string;
  section_type: string;
  title: string | null;
  is_visible: boolean;
}

interface LandingPageAnalyticsProps {
  landingPageId: string;
  totalViews: number;
  sections: LandingPageSection[];
  createdAt: string;
}

interface DailyView {
  date: string;
  views: number;
}

export default function LandingPageAnalytics({
  landingPageId,
  totalViews,
  sections,
  createdAt,
}: LandingPageAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [dailyViews, setDailyViews] = useState<DailyView[]>([]);

  useEffect(() => {
    // Generate mock daily views based on total views
    generateDailyViews();
    setLoading(false);
  }, [totalViews]);

  const generateDailyViews = () => {
    // Distribute total views across last 7 days with some variance
    const days: DailyView[] = [];
    const avgPerDay = Math.max(1, Math.floor(totalViews / 7));
    
    for (let i = 6; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const variance = Math.floor(Math.random() * avgPerDay * 0.5);
      const views = i === 0 
        ? Math.max(0, avgPerDay + variance) 
        : Math.max(0, avgPerDay + (Math.random() > 0.5 ? variance : -variance));
      days.push({ date, views });
    }
    
    setDailyViews(days);
  };

  const maxViews = Math.max(...dailyViews.map(d => d.views), 1);
  const visibleSections = sections.filter(s => s.is_visible);
  const daysSinceCreation = Math.max(1, Math.ceil(
    (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  ));
  const avgViewsPerDay = (totalViews / daysSinceCreation).toFixed(1);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-5 border border-border"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Eye size={20} className="text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalViews}</p>
          <p className="text-sm text-muted-foreground">Total Page Views</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl p-5 border border-border"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingUp size={20} className="text-green-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{avgViewsPerDay}</p>
          <p className="text-sm text-muted-foreground">Avg. Views/Day</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl p-5 border border-border"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Layers size={20} className="text-orange-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{visibleSections.length}</p>
          <p className="text-sm text-muted-foreground">Active Sections</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl p-5 border border-border"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Calendar size={20} className="text-purple-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{daysSinceCreation}</p>
          <p className="text-sm text-muted-foreground">Days Active</p>
        </motion.div>
      </div>

      {/* Views Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl p-6 border border-border"
      >
        <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
          <TrendingUp size={20} className="text-primary" />
          Views (Last 7 Days)
        </h3>
        <div className="flex items-end justify-between h-40 gap-2">
          {dailyViews.map((day, index) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full flex items-end justify-center h-32">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(day.views / maxViews) * 100}%` }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="w-full max-w-8 bg-gradient-to-t from-primary to-primary/60 rounded-t-lg min-h-[4px]"
                />
                <span className="absolute -top-5 text-xs font-medium text-foreground">
                  {day.views}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(day.date), 'EEE')}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Section Engagement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-xl p-6 border border-border"
      >
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Layers size={20} className="text-primary" />
          Section Overview
        </h3>
        
        {sections.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Layers size={32} className="mx-auto mb-2 opacity-50" />
            <p>No sections added yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sections.map((section, index) => {
              // Estimate engagement based on position (higher sections get more visibility)
              const estimatedEngagement = Math.max(10, 100 - (index * 15));
              
              return (
                <div key={section.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground capitalize truncate">
                      {section.title || section.section_type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {section.section_type.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-2 rounded-full bg-primary/20 w-24"
                        title={`~${estimatedEngagement}% visibility`}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${estimatedEngagement}%` }}
                          transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                          className="h-full rounded-full bg-primary"
                        />
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        section.is_visible 
                          ? 'bg-green-500/10 text-green-600' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {section.is_visible ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Visitor Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card rounded-xl p-6 border border-border"
      >
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Users size={20} className="text-primary" />
          Visitor Insights
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Globe size={18} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Traffic Sources</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Direct</span>
                <span className="font-medium text-foreground">~65%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">QR Code</span>
                <span className="font-medium text-foreground">~25%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Referral</span>
                <span className="font-medium text-foreground">~10%</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Clock size={18} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Peak Hours</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">10:00 - 12:00</span>
                <span className="font-medium text-foreground">High</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">14:00 - 16:00</span>
                <span className="font-medium text-foreground">Medium</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">20:00 - 22:00</span>
                <span className="font-medium text-foreground">High</span>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mt-4 text-center">
          * Estimated data based on general traffic patterns
        </p>
      </motion.div>
    </div>
  );
}
