import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, 
  HardHat, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Wrench,
  Star,
  Award,
  Home,
  Share2,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  location: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  description: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface Credential {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

interface BusinessHour {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
}

interface ConstructionData {
  companyName: string;
  tagline: string;
  phone: string;
  emergencyPhone: string;
  email: string;
  address: string;
  serviceArea: string;
  established: string;
  about: string;
  services: Service[];
  projects: Project[];
  credentials: Credential[];
  businessHours: BusinessHour[];
  galleryImages: string[];
  testimonials: { name: string; content: string; rating: number; location: string }[];
  ctaText: string;
  ctaDescription: string;
}

const defaultData: ConstructionData = {
  companyName: 'BuildRight Construction',
  tagline: 'Quality craftsmanship for all your construction needs',
  phone: '(503) 555-9876',
  emergencyPhone: '(503) 555-1234',
  email: 'info@buildrightconstruction.com',
  address: '123 Builder Way, Portland, OR 97201',
  serviceArea: 'Greater Portland Area and Surrounding Counties',
  established: '2005',
  about: 'BuildRight Construction has been serving the community since 2005. We specialize in residential and commercial construction projects, delivering high-quality workmanship and exceptional customer service.',
  services: [
    { id: '1', name: 'Home Renovations', description: 'Complete home remodeling services including kitchens, baths.', icon: 'home' },
    { id: '2', name: 'New Construction', description: 'Custom home building from foundation to finishing touches.', icon: 'building' },
    { id: '3', name: 'Roofing', description: 'Roof installation, repair, and replacement using quality materials.', icon: 'roof' },
    { id: '4', name: 'Electrical Services', description: 'Comprehensive electrical work including wiring, installation, repair.', icon: 'zap' },
  ],
  projects: [
    { id: '1', name: 'Modern Kitchen Remodel', location: 'Portland, OR', status: 'completed', description: 'Complete kitchen renovation featuring custom cabinets.' },
    { id: '2', name: 'Commercial Office', location: 'Beaverton, OR', status: 'in-progress', description: 'Full office space renovation.' },
    { id: '3', name: 'Custom Home Build', location: 'Lake Oswego, OR', status: 'completed', description: 'New custom home construction.' },
  ],
  credentials: [
    { id: '1', name: 'General Contractor License', issuer: 'Oregon CCB', year: '2005' },
    { id: '2', name: 'OSHA Safety Certification', issuer: 'OSHA', year: '2023' },
  ],
  businessHours: [
    { day: 'Monday', open: '07:00', close: '17:00', isClosed: false },
    { day: 'Tuesday', open: '07:00', close: '17:00', isClosed: false },
    { day: 'Wednesday', open: '07:00', close: '17:00', isClosed: false },
    { day: 'Thursday', open: '07:00', close: '17:00', isClosed: false },
    { day: 'Friday', open: '07:00', close: '17:00', isClosed: false },
    { day: 'Saturday', open: '08:00', close: '12:00', isClosed: false },
    { day: 'Sunday', open: '', close: '', isClosed: true },
  ],
  galleryImages: [],
  testimonials: [
    { name: 'David Wilson', content: 'From design to completion, BuildRight made building our custom home a smooth process.', rating: 5, location: 'Lake Oswego' }
  ],
  ctaText: 'Schedule a Consultation',
  ctaDescription: 'Contact us today for professional service.',
};

export default function ConstructionPublic() {
  const { userId } = useParams();
  const { toast } = useToast();
  const [data, setData] = useState<ConstructionData>(defaultData);

  useEffect(() => {
    if (userId) {
      const saved = localStorage.getItem(`construction_template_${userId}`);
      if (saved) {
        try {
          setData({ ...defaultData, ...JSON.parse(saved) });
        } catch (e) {
          console.log('Using default data');
        }
      }
    }
  }, [userId]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: data.companyName, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied to clipboard!' });
    }
  };

  const getServiceIcon = (icon: string) => {
    switch (icon) {
      case 'home': return <Home size={24} />;
      case 'building': return <Building2 size={24} />;
      case 'wrench': return <Wrench size={24} />;
      default: return <Wrench size={24} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      case 'upcoming': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-100">
      {/* Hero Section */}
      <motion.header 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative bg-gradient-to-r from-yellow-600 via-orange-500 to-amber-500 text-white"
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <HardHat size={32} />
            </div>
            <div>
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-3xl md:text-5xl font-bold"
              >
                {data.companyName}
              </motion.h1>
              <p className="text-white/90 text-lg mt-1">Est. {data.established}</p>
            </div>
          </div>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl text-white/90 max-w-2xl"
          >
            {data.tagline}
          </motion.p>
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-4 mt-8"
          >
            <a href={`tel:${data.phone}`}>
              <Button size="lg" className="bg-white text-orange-600 hover:bg-white/90">
                <Phone size={18} className="mr-2" /> Call Now
              </Button>
            </a>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={handleShare}>
              <Share2 size={18} className="mr-2" /> Share
            </Button>
          </motion.div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-12 space-y-12">
        {/* Contact Quick Info */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="grid md:grid-cols-3 gap-4"
        >
          <a href={`tel:${data.phone}`} className="flex items-center gap-4 bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Phone size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-semibold text-foreground">{data.phone}</p>
            </div>
          </a>
          <a href={`mailto:${data.email}`} className="flex items-center gap-4 bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Mail size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold text-foreground">{data.email}</p>
            </div>
          </a>
          <div className="flex items-center gap-4 bg-white rounded-xl p-5 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <MapPin size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Service Area</p>
              <p className="font-semibold text-foreground">{data.serviceArea}</p>
            </div>
          </div>
        </motion.div>

        {/* About Section */}
        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl p-8 shadow-sm"
        >
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Building2 size={24} className="text-yellow-600" />
            About Us
          </h2>
          <p className="text-muted-foreground leading-relaxed">{data.about}</p>
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin size={16} />
            {data.address}
          </div>
        </motion.section>

        {/* Services */}
        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Wrench size={24} className="text-yellow-600" />
            Our Services
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {data.services.map((service) => (
              <motion.div 
                key={service.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl p-6 shadow-sm"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center mb-4 text-yellow-600">
                  {getServiceIcon(service.icon)}
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">{service.name}</h3>
                <p className="text-muted-foreground text-sm">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Projects */}
        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Home size={24} className="text-yellow-600" />
            Featured Projects
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {data.projects.map((project) => (
              <motion.div 
                key={project.id}
                whileHover={{ y: -4 }}
                className="bg-white rounded-xl p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {project.status.replace('-', ' ')}
                  </span>
                </div>
                <h3 className="font-bold text-foreground mb-2">{project.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin size={12} /> {project.location}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Credentials */}
        {data.credentials.length > 0 && (
          <motion.section 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Award size={24} className="text-yellow-600" />
              Licenses & Certifications
            </h2>
            <div className="space-y-4">
              {data.credentials.map((cred) => (
                <div key={cred.id} className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg">
                  <CheckCircle size={20} className="text-green-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">{cred.name}</p>
                    <p className="text-sm text-muted-foreground">{cred.issuer} • {cred.year}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Business Hours */}
        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl p-8 shadow-sm"
        >
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Clock size={24} className="text-yellow-600" />
            Business Hours
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.businessHours.map((hour) => (
              <div key={hour.day} className={`p-4 rounded-lg ${hour.isClosed ? 'bg-gray-100' : 'bg-yellow-50'}`}>
                <p className="font-medium text-foreground">{hour.day}</p>
                <p className={`text-sm ${hour.isClosed ? 'text-muted-foreground' : 'text-yellow-700'}`}>
                  {hour.isClosed ? 'Closed' : `${hour.open} - ${hour.close}`}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Testimonials */}
        {data.testimonials.length > 0 && (
          <motion.section 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Star size={24} className="text-yellow-600" />
              Customer Reviews
            </h2>
            <div className="space-y-4">
              {data.testimonials.map((testimonial, idx) => (
                <div key={idx} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                  <p className="font-semibold text-foreground">— {testimonial.name}, {testimonial.location}</p>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* CTA */}
        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-8 text-white text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-3">{data.ctaText}</h2>
          <p className="text-white/90 mb-6">{data.ctaDescription}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={`tel:${data.phone}`}>
              <Button size="lg" className="bg-white text-orange-600 hover:bg-white/90">
                <Phone size={18} className="mr-2" /> {data.phone}
              </Button>
            </a>
            <a href={`mailto:${data.email}`}>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Mail size={18} className="mr-2" /> Email Us
              </Button>
            </a>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© {new Date().getFullYear()} {data.companyName}. All rights reserved.</p>
          <p className="text-gray-500 text-sm mt-2">Powered by TimesNFC</p>
        </div>
      </footer>
    </div>
  );
}
