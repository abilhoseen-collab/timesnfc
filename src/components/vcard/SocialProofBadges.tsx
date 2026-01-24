import { motion } from 'framer-motion';
import {
  Shield,
  Award,
  Users,
  Star,
  CheckCircle,
  Verified,
  TrendingUp,
  ThumbsUp,
  Heart,
  Clock,
} from 'lucide-react';

interface Badge {
  icon: string;
  text: string;
  color?: string;
}

interface SocialProofBadgesProps {
  badges: Badge[];
  accentColor?: string;
}

const iconMap: Record<string, any> = {
  shield: Shield,
  award: Award,
  users: Users,
  star: Star,
  check: CheckCircle,
  verified: Verified,
  trending: TrendingUp,
  thumbsup: ThumbsUp,
  heart: Heart,
  clock: Clock,
};

const colorMap: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
  pink: 'bg-pink-100 text-pink-700 border-pink-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  red: 'bg-red-100 text-red-700 border-red-200',
  teal: 'bg-teal-100 text-teal-700 border-teal-200',
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  gray: 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function SocialProofBadges({ badges, accentColor }: SocialProofBadgesProps) {
  if (!badges || badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge, index) => {
        const IconComponent = iconMap[badge.icon?.toLowerCase()] || CheckCircle;
        const colorClass = badge.color ? colorMap[badge.color] || colorMap.blue : colorMap.blue;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${colorClass}`}
          >
            <IconComponent size={14} />
            <span>{badge.text}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
