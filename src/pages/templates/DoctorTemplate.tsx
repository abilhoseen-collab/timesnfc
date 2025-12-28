import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Save, 
  Stethoscope, 
  User,
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Heart,
  GraduationCap,
  Award,
  Calendar,
  Star,
  Loader2,
  Plus,
  Trash2,
  Globe,
  Linkedin,
  Facebook,
  FileText
} from 'lucide-react';

interface MedicalSpecialty {
  id: string;
  name: string;
  description: string;
}

interface MedicalService {
  id: string;
  name: string;
  description: string;
  duration: string;
}

interface ClinicHour {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
  byAppointment: boolean;
}

interface DoctorFormData {
  fullName: string;
  credentials: string;
  specialization: string;
  experience: string;
  qualifications: string;
  about: string;
  phone: string;
  emergencyPhone: string;
  email: string;
  website: string;
  clinicAddress: string;
  clinicHours: ClinicHour[];
  specialties: MedicalSpecialty[];
  services: MedicalService[];
  reviews: { name: string; content: string; rating: number }[];
  linkedinUrl: string;
  facebookUrl: string;
  healthgradesUrl: string;
  appStoreUrl: string;
  playStoreUrl: string;
  ctaText: string;
  ctaDescription: string;
}

const defaultClinicHours: ClinicHour[] = [
  { day: 'Monday', open: '08:00', close: '17:00', isClosed: false, byAppointment: false },
  { day: 'Tuesday', open: '08:00', close: '17:00', isClosed: false, byAppointment: false },
  { day: 'Wednesday', open: '08:00', close: '17:00', isClosed: false, byAppointment: false },
  { day: 'Thursday', open: '08:00', close: '17:00', isClosed: false, byAppointment: false },
  { day: 'Friday', open: '08:00', close: '16:00', isClosed: false, byAppointment: false },
  { day: 'Saturday', open: '09:00', close: '13:00', isClosed: false, byAppointment: true },
  { day: 'Sunday', open: '', close: '', isClosed: true, byAppointment: false },
];

export default function DoctorTemplate() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  const [formData, setFormData] = useState<DoctorFormData>({
    fullName: 'Dr. Sarah Johnson',
    credentials: 'MD, FACP',
    specialization: 'Internal Medicine & Cardiology',
    experience: '15 years',
    qualifications: 'MD from Harvard Medical School, Residency in Internal Medicine at Johns Hopkins, Fellowship in Cardiology at Mayo Clinic',
    about: 'Dr. Sarah Johnson is a board-certified internal medicine physician with specialized training in cardiology. She is dedicated to providing comprehensive, patient-centered care with a focus on preventive medicine.',
    phone: '+1 (555) 123-4567',
    emergencyPhone: '+1 (555) 911-0000',
    email: 'dr.johnson@healthclinic.com',
    website: 'drjohnsonmd.com',
    clinicAddress: '456 Medical Center Drive, Suite 200, Health City, NY 10002',
    clinicHours: defaultClinicHours,
    specialties: [
      { id: '1', name: 'Preventive Cardiology', description: 'Heart disease prevention and risk assessment' },
      { id: '2', name: 'Hypertension Management', description: 'Comprehensive blood pressure management' },
      { id: '3', name: 'Diabetes Care', description: 'Type 1 and Type 2 diabetes management' },
    ],
    services: [
      { id: '1', name: 'Annual Physical Exam', description: 'Comprehensive health assessment', duration: '60 minutes' },
      { id: '2', name: 'Cardiac Consultation', description: 'Heart health evaluation', duration: '45 minutes' },
      { id: '3', name: 'Preventive Care', description: 'Screenings and vaccinations', duration: '30 minutes' },
    ],
    reviews: [
      { name: 'Lisa Williams', content: 'Excellent bedside manner and very knowledgeable. Highly recommend!', rating: 5 }
    ],
    linkedinUrl: '',
    facebookUrl: '',
    healthgradesUrl: '',
    appStoreUrl: '',
    playStoreUrl: '',
    ctaText: 'Schedule Appointment',
    ctaDescription: 'Have questions about your health? Contact us to schedule a consultation. Thank you for choosing Dr. Johnson for your healthcare needs.',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/templates/doctor');
      return;
    }
    if (user) {
      checkAccess();
    }
  }, [user, authLoading, navigate]);

  const checkAccess = async () => {
    const { data } = await supabase
      .from('subscriptions')
      .select('status, expires_at')
      .eq('user_id', user?.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && data.expires_at && new Date(data.expires_at) > new Date()) {
      setHasAccess(true);
      loadSavedData();
    } else {
      toast({
        title: 'Premium Required',
        description: 'You need an active subscription to use this template.',
        variant: 'destructive',
      });
      navigate('/payment');
    }
    setLoading(false);
  };

  const loadSavedData = async () => {
    const { data } = await supabase
      .from('vcard_custom_sections')
      .select('content')
      .eq('vcard_id', user?.id)
      .eq('section_type', 'doctor_template')
      .maybeSingle();
    
    if (data?.content) {
      setFormData({ ...formData, ...data.content });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('vcard_custom_sections')
        .upsert({
          vcard_id: user?.id,
          section_type: 'doctor_template',
          title: 'Doctor Template Data',
          content: formData,
          is_visible: true,
          sort_order: 0,
        });

      if (error) throw error;
      toast({ title: 'Saved successfully!' });
    } catch (error) {
      toast({ title: 'Save failed', variant: 'destructive' });
    }
    setSaving(false);
  };

  const addSpecialty = () => {
    setFormData(prev => ({
      ...prev,
      specialties: [...prev.specialties, { id: Date.now().toString(), name: '', description: '' }]
    }));
  };

  const removeSpecialty = (id: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s.id !== id)
    }));
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { id: Date.now().toString(), name: '', description: '', duration: '' }]
    }));
  };

  const removeService = (id: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(s => s.id !== id)
    }));
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-cyan-50/30">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
              <Stethoscope size={18} className="text-white" />
            </div>
            <span className="font-bold text-foreground">Doctor Template</span>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          
          {/* Personal Information */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <User size={20} className="text-teal-600" />
              Personal Information
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Dr. Sarah Johnson"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Credentials</label>
                <Input
                  value={formData.credentials}
                  onChange={(e) => setFormData(prev => ({ ...prev, credentials: e.target.value }))}
                  placeholder="MD, FACP"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Specialization</label>
                <Input
                  value={formData.specialization}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                  placeholder="Internal Medicine & Cardiology"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Experience</label>
                <Input
                  value={formData.experience}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                  placeholder="15 years"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Qualifications</label>
                <Textarea
                  value={formData.qualifications}
                  onChange={(e) => setFormData(prev => ({ ...prev, qualifications: e.target.value }))}
                  rows={2}
                  placeholder="MD from Harvard Medical School..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">About</label>
                <Textarea
                  value={formData.about}
                  onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
                  rows={4}
                  placeholder="Tell patients about yourself..."
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Phone size={20} className="text-teal-600" />
              Contact Information
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Emergency Phone</label>
                <Input
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                  placeholder="+1 (555) 911-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="dr.johnson@healthclinic.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Website</label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="drjohnsonmd.com"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Clinic Address</label>
                <Input
                  value={formData.clinicAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, clinicAddress: e.target.value }))}
                  placeholder="456 Medical Center Drive, Suite 200"
                />
              </div>
            </div>
          </div>

          {/* Clinic Hours */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock size={20} className="text-teal-600" />
              Clinic Hours
            </h2>
            <div className="space-y-3">
              {formData.clinicHours.map((hour, index) => (
                <div key={hour.day} className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl flex-wrap">
                  <span className="w-24 font-medium text-foreground">{hour.day}</span>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={hour.isClosed}
                      onChange={(e) => {
                        const updated = [...formData.clinicHours];
                        updated[index].isClosed = e.target.checked;
                        setFormData(prev => ({ ...prev, clinicHours: updated }));
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-muted-foreground">Closed</span>
                  </label>
                  {!hour.isClosed && (
                    <>
                      <Input
                        type="time"
                        value={hour.open}
                        onChange={(e) => {
                          const updated = [...formData.clinicHours];
                          updated[index].open = e.target.value;
                          setFormData(prev => ({ ...prev, clinicHours: updated }));
                        }}
                        className="w-32"
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={hour.close}
                        onChange={(e) => {
                          const updated = [...formData.clinicHours];
                          updated[index].close = e.target.value;
                          setFormData(prev => ({ ...prev, clinicHours: updated }));
                        }}
                        className="w-32"
                      />
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={hour.byAppointment}
                          onChange={(e) => {
                            const updated = [...formData.clinicHours];
                            updated[index].byAppointment = e.target.checked;
                            setFormData(prev => ({ ...prev, clinicHours: updated }));
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-muted-foreground">By Appt.</span>
                      </label>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Medical Specialties */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Heart size={20} className="text-teal-600" />
                Medical Specialties
              </h2>
              <Button variant="outline" size="sm" onClick={addSpecialty}>
                <Plus size={16} className="mr-1" /> Add Specialty
              </Button>
            </div>
            <div className="space-y-4">
              {formData.specialties.map((specialty, index) => (
                <div key={specialty.id} className="p-4 bg-muted/50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Specialty {index + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeSpecialty(specialty.id)}>
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <Input
                      value={specialty.name}
                      onChange={(e) => {
                        const updated = [...formData.specialties];
                        updated[index].name = e.target.value;
                        setFormData(prev => ({ ...prev, specialties: updated }));
                      }}
                      placeholder="Specialty Name"
                    />
                    <Input
                      value={specialty.description}
                      onChange={(e) => {
                        const updated = [...formData.specialties];
                        updated[index].description = e.target.value;
                        setFormData(prev => ({ ...prev, specialties: updated }));
                      }}
                      placeholder="Brief description"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medical Services */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <GraduationCap size={20} className="text-teal-600" />
                Medical Services
              </h2>
              <Button variant="outline" size="sm" onClick={addService}>
                <Plus size={16} className="mr-1" /> Add Service
              </Button>
            </div>
            <div className="space-y-4">
              {formData.services.map((service, index) => (
                <div key={service.id} className="p-4 bg-muted/50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Service {index + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeService(service.id)}>
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <Input
                      value={service.name}
                      onChange={(e) => {
                        const updated = [...formData.services];
                        updated[index].name = e.target.value;
                        setFormData(prev => ({ ...prev, services: updated }));
                      }}
                      placeholder="Service Name"
                    />
                    <Input
                      value={service.description}
                      onChange={(e) => {
                        const updated = [...formData.services];
                        updated[index].description = e.target.value;
                        setFormData(prev => ({ ...prev, services: updated }));
                      }}
                      placeholder="Description"
                    />
                    <Input
                      value={service.duration}
                      onChange={(e) => {
                        const updated = [...formData.services];
                        updated[index].duration = e.target.value;
                        setFormData(prev => ({ ...prev, services: updated }));
                      }}
                      placeholder="Duration (e.g., 45 minutes)"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Professional Profiles */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Globe size={20} className="text-teal-600" />
              Professional Profiles
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">LinkedIn</label>
                <Input
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                  placeholder="linkedin.com/in/yourprofile"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Facebook</label>
                <Input
                  value={formData.facebookUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, facebookUrl: e.target.value }))}
                  placeholder="facebook.com/yourpage"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Healthgrades</label>
                <Input
                  value={formData.healthgradesUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, healthgradesUrl: e.target.value }))}
                  placeholder="healthgrades.com/physician/dr-sarah-johnson"
                />
              </div>
            </div>
          </div>

          {/* Medical App */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-teal-600" />
              Medical App Links
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">App Store URL</label>
                <Input
                  value={formData.appStoreUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, appStoreUrl: e.target.value }))}
                  placeholder="apps.apple.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Play Store URL</label>
                <Input
                  value={formData.playStoreUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, playStoreUrl: e.target.value }))}
                  placeholder="play.google.com/..."
                />
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText size={20} className="text-teal-600" />
              Call to Action
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">CTA Title</label>
                <Input
                  value={formData.ctaText}
                  onChange={(e) => setFormData(prev => ({ ...prev, ctaText: e.target.value }))}
                  placeholder="Schedule Appointment"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">CTA Description</label>
                <Textarea
                  value={formData.ctaDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, ctaDescription: e.target.value }))}
                  placeholder="Thank you for choosing..."
                />
              </div>
            </div>
          </div>

        </motion.div>
      </main>
    </div>
  );
}
