import { motion } from 'framer-motion';
import { Eye, Check } from 'lucide-react';
import { Template, FormData } from './types';

// Import template images
import freelancerImg from '@/assets/templates/freelancer.png';
import doctorImg from '@/assets/templates/doctor.png';
import restaurantImg from '@/assets/templates/restaurant.png';
import realestateImg from '@/assets/templates/realestate.png';
import fitnessImg from '@/assets/templates/fitness.png';
import photographyImg from '@/assets/templates/photography.png';
import lawfirmImg from '@/assets/templates/lawfirm.png';
import cafeImg from '@/assets/templates/cafe.png';
import salonImg from '@/assets/templates/salon.png';
import constructionImg from '@/assets/templates/construction.png';
import eventplannerImg from '@/assets/templates/eventplanner.png';
import techStartupImg from '@/assets/templates/tech-startup.png';

const templates: Template[] = [
  { id: 'freelancer', name: 'Freelancer', image: freelancerImg },
  { id: 'doctor', name: 'Doctor', image: doctorImg },
  { id: 'restaurant', name: 'Restaurant', image: restaurantImg },
  { id: 'realestate', name: 'Real Estate', image: realestateImg },
  { id: 'fitness', name: 'Fitness', image: fitnessImg },
  { id: 'photography', name: 'Photography', image: photographyImg },
  { id: 'lawfirm', name: 'Law Firm', image: lawfirmImg },
  { id: 'cafe', name: 'Cafe', image: cafeImg },
  { id: 'salon', name: 'Salon', image: salonImg },
  { id: 'construction', name: 'Construction', image: constructionImg },
  { id: 'eventplanner', name: 'Event Planner', image: eventplannerImg },
  { id: 'tech-startup', name: 'Tech Startup', image: techStartupImg },
];

interface TemplateSelectorProps {
  selectedTemplate: string;
  onChange: (field: keyof FormData, value: string | boolean | number) => void;
}

export default function TemplateSelector({ selectedTemplate, onChange }: TemplateSelectorProps) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Eye size={20} className="text-primary" />
        Choose Template
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {templates.map((template) => (
          <motion.button
            key={template.id}
            type="button"
            onClick={() => onChange('template', template.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative rounded-xl overflow-hidden border-2 transition-all ${
              selectedTemplate === template.id
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <img 
              src={template.image} 
              alt={template.name}
              className="w-full aspect-[3/4] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-2">
              <p className="text-xs text-white font-medium truncate">{template.name}</p>
            </div>
            {selectedTemplate === template.id && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <Check size={12} className="text-primary-foreground" />
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
