import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Stethoscope, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  GraduationCap,
  Star,
  Calendar,
  Share2,
  Heart,
  Award,
  Users,
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

interface Education {
  id: string;
  degree: string;
  institution: string;
  year: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
}

interface ConsultationHour {
  day: string;
  morning: string;
  evening: string;
  isClosed: boolean;
}

interface DoctorData {
  doctorName: string;
  specialty: string;
  qualifications: string;
  phone: string;
  emergencyPhone: string;
  email: string;
  clinicName: string;
  clinicAddress: string;
  about: string;
  experience: string;
  education: Education[];
  services: Service[];
  consultationHours: ConsultationHour[];
  consultationFee: string;
  languages: string[];
  insurance: string[];
  testimonials: { name: string; content: string; rating: number }[];
}

const defaultData: DoctorData = {
  doctorName: 'Dr. Sarah Johnson',
  specialty: 'Cardiologist',
  qualifications: 'MBBS, MD, DM (Cardiology)',
  phone: '(555) 123-4567',
  emergencyPhone: '(555) 987-6543',
  email: 'dr.sarah@heartcare.com',
  clinicName: 'HeartCare Clinic',
  clinicAddress: '456 Medical Center Blvd, Suite 300',
  about: 'Dr. Sarah Johnson is a board-certified cardiologist with over 15 years of experience in treating cardiovascular diseases.',
  experience: '15+',
  education: [
    { id: '1', degree: 'MBBS', institution: 'Harvard Medical School', year: '2005' },
    { id: '2', degree: 'MD (Medicine)', institution: 'Johns Hopkins', year: '2008' },
    { id: '3', degree: 'DM (Cardiology)', institution: 'Mayo Clinic', year: '2011' },
  ],
  services: [
    { id: '1', name: 'Heart Checkup', description: 'Comprehensive cardiac examination' },
    { id: '2', name: 'ECG/EKG', description: 'Electrocardiogram testing' },
    { id: '3', name: 'Echocardiography', description: 'Heart ultrasound imaging' },
    { id: '4', name: 'Stress Testing', description: 'Exercise tolerance testing' },
  ],
  consultationHours: [
    { day: 'Monday', morning: '09:00 - 13:00', evening: '17:00 - 20:00', isClosed: false },
    { day: 'Tuesday', morning: '09:00 - 13:00', evening: '17:00 - 20:00', isClosed: false },
    { day: 'Wednesday', morning: '09:00 - 13:00', evening: '', isClosed: false },
    { day: 'Thursday', morning: '09:00 - 13:00', evening: '17:00 - 20:00', isClosed: false },
    { day: 'Friday', morning: '09:00 - 13:00', evening: '17:00 - 20:00', isClosed: false },
    { day: 'Saturday', morning: '10:00 - 14:00', evening: '', isClosed: false },
    { day: 'Sunday', morning: '', evening: '', isClosed: true },
  ],
  consultationFee: '$150',
  languages: ['English', 'Spanish'],
  insurance: ['Blue Cross', 'Aetna', 'United Healthcare'],
  testimonials: [
    { name: 'John M.', content: 'Dr. Johnson is an excellent cardiologist. She takes time to explain everything thoroughly.', rating: 5 }
  ],
};

export default function DoctorPublic() {
  const { userId } = useParams();
  const { toast } = useToast();
  const [data, setData] = useState<DoctorData>(defaultData);
  const [showQRModal, setShowQRModal] = useState(false);
  const currentUrl = window.location.href;

  useEffect(() => {
    if (userId) {
      const saved = localStorage.getItem(`doctor_template_${userId}`);
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
      await navigator.share({ title: data.doctorName, url: currentUrl });
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
      downloadLink.download = `${data.doctorName.replace(/\s+/g, '_')}_QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-100">
      {/* Hero Section */}
      <motion.header 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 text-white"
      >
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <Stethoscope size={40} />
            </div>
            <div className="flex-1">
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-3xl md:text-5xl font-bold"
              >
                {data.doctorName}
              </motion.h1>
              <p className="text-white/90 text-xl mt-2">{data.specialty}</p>
              <p className="text-white/80 mt-1">{data.qualifications}</p>
              <div className="flex items-center gap-4 mt-4 text-white/90">
                <span className="flex items-center gap-1"><Award size={16} /> {data.experience} Years Exp.</span>
                <span className="flex items-center gap-1"><Users size={16} /> 5000+ Patients</span>
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
              <Button size="lg" className="bg-white text-teal-600 hover:bg-white/90">
                <Phone size={18} className="mr-2" /> Book Appointment
              </Button>
            </a>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={handleShare}>
              <Share2 size={18} className="mr-2" /> Share Profile
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={() => setShowQRModal(true)}>
              <QrCode size={18} className="mr-2" /> QR Code
            </Button>
          </motion.div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-12 space-y-12">
        {/* Quick Contact */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="grid md:grid-cols-3 gap-4"
        >
          <a href={`tel:${data.phone}`} className="flex items-center gap-4 bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
              <Phone size={20} className="text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Appointment</p>
              <p className="font-semibold text-foreground">{data.phone}</p>
            </div>
          </a>
          <a href={`tel:${data.emergencyPhone}`} className="flex items-center gap-4 bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <Heart size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Emergency</p>
              <p className="font-semibold text-foreground">{data.emergencyPhone}</p>
            </div>
          </a>
          <div className="flex items-center gap-4 bg-white rounded-xl p-5 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Consultation Fee</p>
              <p className="font-semibold text-foreground">{data.consultationFee}</p>
            </div>
          </div>
        </motion.div>

        {/* About */}
        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl p-8 shadow-sm"
        >
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Stethoscope size={24} className="text-teal-600" />
            About Doctor
          </h2>
          <p className="text-muted-foreground leading-relaxed">{data.about}</p>
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin size={16} />
            {data.clinicName} • {data.clinicAddress}
          </div>
        </motion.section>

        {/* Education */}
        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl p-8 shadow-sm"
        >
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <GraduationCap size={24} className="text-teal-600" />
            Education & Qualifications
          </h2>
          <div className="space-y-4">
            {data.education.map((edu) => (
              <div key={edu.id} className="flex items-start gap-4 p-4 bg-teal-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                  <GraduationCap size={18} className="text-teal-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{edu.degree}</p>
                  <p className="text-sm text-muted-foreground">{edu.institution} • {edu.year}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Services */}
        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Heart size={24} className="text-teal-600" />
            Services Offered
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {data.services.map((service) => (
              <motion.div 
                key={service.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl p-6 shadow-sm"
              >
                <h3 className="font-bold text-lg text-foreground mb-2">{service.name}</h3>
                <p className="text-muted-foreground text-sm">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Consultation Hours */}
        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl p-8 shadow-sm"
        >
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Clock size={24} className="text-teal-600" />
            Consultation Hours
          </h2>
          <div className="space-y-3">
            {data.consultationHours.map((hour) => (
              <div key={hour.day} className={`flex items-center justify-between p-4 rounded-lg ${hour.isClosed ? 'bg-gray-100' : 'bg-teal-50'}`}>
                <span className="font-medium text-foreground">{hour.day}</span>
                {hour.isClosed ? (
                  <span className="text-muted-foreground">Closed</span>
                ) : (
                  <div className="text-sm text-teal-700">
                    {hour.morning && <span className="mr-4">🌅 {hour.morning}</span>}
                    {hour.evening && <span>🌙 {hour.evening}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.section>

        {/* Languages & Insurance */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-6"
        >
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-foreground mb-4">Languages Spoken</h3>
            <div className="flex flex-wrap gap-2">
              {data.languages.map((lang, i) => (
                <span key={i} className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm">{lang}</span>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-foreground mb-4">Insurance Accepted</h3>
            <div className="flex flex-wrap gap-2">
              {data.insurance.map((ins, i) => (
                <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{ins}</span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Testimonials */}
        {data.testimonials.length > 0 && (
          <motion.section 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Star size={24} className="text-teal-600" />
              Patient Reviews
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
          className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-8 text-white text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Book Your Appointment Today</h2>
          <p className="text-white/90 mb-6">Get expert cardiac care from an experienced specialist</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={`tel:${data.phone}`}>
              <Button size="lg" className="bg-white text-teal-600 hover:bg-white/90">
                <Phone size={18} className="mr-2" /> Call Now
              </Button>
            </a>
            <a href={`mailto:${data.email}`}>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Mail size={18} className="mr-2" /> Email
              </Button>
            </a>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© {new Date().getFullYear()} {data.doctorName} • {data.clinicName}</p>
          <p className="text-gray-500 text-sm mt-2">Powered by TimesNFC</p>
        </div>
      </footer>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">{data.doctorName}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <div className="p-6 bg-white rounded-2xl shadow-lg border border-border mb-6">
              <QRCodeSVG 
                id="qr-code-svg"
                value={currentUrl} 
                size={200}
                level="H"
                includeMargin
                fgColor="#0D9488"
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
