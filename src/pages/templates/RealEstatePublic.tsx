import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  Home,
  Star,
  Share2,
  DollarSign,
  Bed,
  Bath,
  Square,
  Award,
  Users,
  TrendingUp,
  QrCode,
  Download,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Property {
  id: string;
  title: string;
  type: 'sale' | 'rent';
  price: string;
  location: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  image: string;
  featured: boolean;
}

interface Achievement {
  id: string;
  title: string;
  value: string;
}

interface RealEstateData {
  agentName: string;
  title: string;
  company: string;
  license: string;
  phone: string;
  whatsapp: string;
  email: string;
  officeAddress: string;
  serviceAreas: string[];
  about: string;
  experience: string;
  specializations: string[];
  properties: Property[];
  achievements: Achievement[];
  testimonials: { name: string; content: string; rating: number; property: string }[];
  ctaText: string;
}

const defaultData: RealEstateData = {
  agentName: 'Michael Chen',
  title: 'Senior Real Estate Agent',
  company: 'Premier Properties',
  license: 'DRE #01234567',
  phone: '(310) 555-8888',
  whatsapp: '+1 310 555 8888',
  email: 'michael@premierproperties.com',
  officeAddress: '100 Luxury Lane, Beverly Hills, CA 90210',
  serviceAreas: ['Beverly Hills', 'Bel Air', 'Hollywood Hills', 'Santa Monica'],
  about: 'With over 12 years of experience in luxury real estate, I help clients find their dream homes in Los Angeles most prestigious neighborhoods.',
  experience: '12',
  specializations: ['Luxury Homes', 'Investment Properties', 'Commercial Real Estate', 'New Developments'],
  properties: [
    { id: '1', title: 'Modern Hillside Villa', type: 'sale', price: '$4,500,000', location: 'Beverly Hills', bedrooms: '5', bathrooms: '6', area: '6,500', image: '', featured: true },
    { id: '2', title: 'Ocean View Penthouse', type: 'rent', price: '$15,000/mo', location: 'Santa Monica', bedrooms: '3', bathrooms: '3', area: '3,200', image: '', featured: true },
    { id: '3', title: 'Classic Mediterranean Estate', type: 'sale', price: '$8,200,000', location: 'Bel Air', bedrooms: '7', bathrooms: '8', area: '12,000', image: '', featured: false },
  ],
  achievements: [
    { id: '1', title: 'Properties Sold', value: '200+' },
    { id: '2', title: 'Total Sales Volume', value: '$500M+' },
    { id: '3', title: 'Happy Clients', value: '350+' },
    { id: '4', title: 'Years Experience', value: '12+' },
  ],
  testimonials: [
    { name: 'Jennifer & Mark', content: 'Michael helped us find our dream home in Beverly Hills. His knowledge of the luxury market is unparalleled.', rating: 5, property: 'Beverly Hills Estate' }
  ],
  ctaText: 'Schedule a Private Consultation',
};

export default function RealEstatePublic() {
  const { userId } = useParams();
  const { toast } = useToast();
  const [data, setData] = useState<RealEstateData>(defaultData);
  const [showQRModal, setShowQRModal] = useState(false);
  const currentUrl = window.location.href;

  useEffect(() => {
    if (userId) {
      const saved = localStorage.getItem(`realestate_template_${userId}`);
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
    if (navigator.share) {
      await navigator.share({ title: data.agentName, url: currentUrl });
    } else {
      await navigator.clipboard.writeText(currentUrl);
      toast({ title: 'Link copied to clipboard!' });
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    toast({ title: 'Link copied to clipboard!' });
  };

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${data.agentName.replace(/\s+/g, '_')}_QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
      {/* Hero Section */}
      <motion.header 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative bg-gradient-to-r from-slate-800 via-gray-800 to-zinc-800 text-white"
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <Building size={40} />
            </div>
            <div className="flex-1">
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-3xl md:text-5xl font-bold"
              >
                {data.agentName}
              </motion.h1>
              <p className="text-white/90 text-xl mt-2">{data.title}</p>
              <p className="text-white/70 mt-1">{data.company} • {data.license}</p>
              <div className="flex items-center gap-4 mt-4 text-white/90">
                <span className="flex items-center gap-1"><Award size={16} /> Top Producer</span>
                <span className="flex items-center gap-1"><TrendingUp size={16} /> {data.experience} Years</span>
              </div>
            </div>
          </div>
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-4 mt-8"
          >
            <a href={`tel:${data.phone}`}>
              <Button size="lg" className="bg-amber-500 text-white hover:bg-amber-600">
                <Phone size={18} className="mr-2" /> Call Now
              </Button>
            </a>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={handleShare}>
              <Share2 size={18} className="mr-2" /> Share
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={() => setShowQRModal(true)}>
              <QrCode size={18} className="mr-2" /> QR Code
            </Button>
          </motion.div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-12 space-y-12">
        {/* Stats */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {data.achievements.map((achievement) => (
            <div key={achievement.id} className="bg-white rounded-xl p-6 shadow-sm text-center">
              <p className="text-3xl font-bold text-slate-800">{achievement.value}</p>
              <p className="text-muted-foreground text-sm mt-1">{achievement.title}</p>
            </div>
          ))}
        </motion.div>

        {/* Quick Contact */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="grid md:grid-cols-3 gap-4"
        >
          <a href={`tel:${data.phone}`} className="flex items-center gap-4 bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Phone size={20} className="text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-semibold text-foreground">{data.phone}</p>
            </div>
          </a>
          <a href={`https://wa.me/${data.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">WhatsApp</p>
              <p className="font-semibold text-foreground">Message Me</p>
            </div>
          </a>
          <a href={`mailto:${data.email}`} className="flex items-center gap-4 bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Mail size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold text-foreground truncate">{data.email}</p>
            </div>
          </a>
        </motion.div>

        {/* About */}
        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl p-8 shadow-sm"
        >
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Users size={24} className="text-slate-600" />
            About Me
          </h2>
          <p className="text-muted-foreground leading-relaxed">{data.about}</p>
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin size={16} />
            {data.officeAddress}
          </div>
        </motion.section>

        {/* Service Areas & Specializations */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-6"
        >
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-slate-600" />
              Service Areas
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.serviceAreas.map((area, i) => (
                <span key={i} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">{area}</span>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Award size={20} className="text-slate-600" />
              Specializations
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.specializations.map((spec, i) => (
                <span key={i} className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">{spec}</span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Featured Properties */}
        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Home size={24} className="text-slate-600" />
            Featured Properties
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {data.properties.map((property) => (
              <motion.div 
                key={property.id}
                whileHover={{ y: -4 }}
                className="bg-white rounded-xl overflow-hidden shadow-sm"
              >
                <div className="h-48 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                  {property.image ? (
                    <img src={property.image} alt={property.title} className="w-full h-full object-cover" />
                  ) : (
                    <Home size={48} className="text-slate-400" />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${property.type === 'sale' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      For {property.type === 'sale' ? 'Sale' : 'Rent'}
                    </span>
                    {property.featured && (
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Featured</span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-2">{property.title}</h3>
                  <p className="text-2xl font-bold text-slate-800 mb-3">{property.price}</p>
                  <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
                    <MapPin size={14} /> {property.location}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-4">
                    <span className="flex items-center gap-1"><Bed size={14} /> {property.bedrooms}</span>
                    <span className="flex items-center gap-1"><Bath size={14} /> {property.bathrooms}</span>
                    <span className="flex items-center gap-1"><Square size={14} /> {property.area} sqft</span>
                  </div>
                </div>
              </motion.div>
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
              <Star size={24} className="text-slate-600" />
              Client Testimonials
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
                  <p className="font-semibold text-foreground">— {testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.property}</p>
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
          className="bg-gradient-to-r from-slate-800 to-gray-800 rounded-2xl p-8 text-white text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-3">{data.ctaText}</h2>
          <p className="text-white/80 mb-6">Let's find your perfect property together</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={`tel:${data.phone}`}>
              <Button size="lg" className="bg-amber-500 text-white hover:bg-amber-600">
                <Phone size={18} className="mr-2" /> {data.phone}
              </Button>
            </a>
            <a href={`mailto:${data.email}`}>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Mail size={18} className="mr-2" /> Email Me
              </Button>
            </a>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© {new Date().getFullYear()} {data.agentName} • {data.company}</p>
          <p className="text-gray-500 text-sm mt-2">Powered by TimesNFC</p>
        </div>
      </footer>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">{data.agentName}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <div className="p-6 bg-white rounded-2xl shadow-lg border border-border mb-6">
              <QRCodeSVG 
                id="qr-code-svg"
                value={currentUrl} 
                size={200}
                level="H"
                includeMargin
                fgColor="#334155"
                bgColor="#FFFFFF"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Scan this QR code to view the profile
            </p>
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1" onClick={copyLink}>
                <Copy size={16} className="mr-2" /> Copy Link
              </Button>
              <Button variant="secondary" className="flex-1" onClick={downloadQR}>
                <Download size={16} className="mr-2" /> Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
