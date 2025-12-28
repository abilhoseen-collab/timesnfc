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
  Building2, 
  HardHat, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Wrench,
  Camera,
  Star,
  Award,
  Zap,
  Home,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';

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

interface ConstructionFormData {
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

const defaultBusinessHours: BusinessHour[] = [
  { day: 'Monday', open: '07:00', close: '17:00', isClosed: false },
  { day: 'Tuesday', open: '07:00', close: '17:00', isClosed: false },
  { day: 'Wednesday', open: '07:00', close: '17:00', isClosed: false },
  { day: 'Thursday', open: '07:00', close: '17:00', isClosed: false },
  { day: 'Friday', open: '07:00', close: '17:00', isClosed: false },
  { day: 'Saturday', open: '08:00', close: '12:00', isClosed: false },
  { day: 'Sunday', open: '', close: '', isClosed: true },
];

export default function ConstructionTemplate() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState<ConstructionFormData>({
    companyName: 'BuildRight Construction',
    tagline: 'Quality craftsmanship for all your construction needs',
    phone: '(503) 555-9876',
    emergencyPhone: '',
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
      { id: '1', name: 'Modern Kitchen Remodel', location: 'Portland, OR', status: 'completed', description: 'Complete kitchen renovation featuring custom cabinets, quartz countertops.' },
      { id: '2', name: 'Commercial Office Renovation', location: 'Beaverton, OR', status: 'in-progress', description: 'Full office space renovation and modernization.' },
      { id: '3', name: 'Custom Home Build', location: 'Lake Oswego, OR', status: 'completed', description: 'New custom home construction from ground up.' },
    ],
    credentials: [
      { id: '1', name: 'General Contractor License', issuer: 'Oregon Construction Contractors Board', year: '2005' },
      { id: '2', name: 'OSHA Safety Certification', issuer: 'Occupational Safety and Health Administration', year: '2023' },
      { id: '3', name: 'Energy Trust of Oregon Ally', issuer: 'Energy Trust of Oregon', year: '2015' },
    ],
    businessHours: defaultBusinessHours,
    galleryImages: [],
    testimonials: [
      { name: 'David Wilson', content: 'From design to completion, BuildRight made building our custom home a smooth process. Their communication was excellent and the quality of work is outstanding.', rating: 5, location: 'Lake Oswego' }
    ],
    ctaText: 'Schedule a Consultation',
    ctaDescription: 'Contact us today for professional service and quality workmanship.',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/templates/construction');
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
      .eq('section_type', 'construction_template')
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
          section_type: 'construction_template',
          title: 'Construction Template Data',
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please upload an image file', variant: 'destructive' });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `construction/${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      setFormData(prev => ({
        ...prev,
        galleryImages: [...prev.galleryImages, publicUrl]
      }));
      toast({ title: 'Image uploaded!' });
    } catch (error) {
      toast({ title: 'Upload failed', variant: 'destructive' });
    }
    setUploadingImage(false);
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { id: Date.now().toString(), name: '', description: '', icon: 'wrench' }]
    }));
  };

  const removeService = (id: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(s => s.id !== id)
    }));
  };

  const addProject = () => {
    setFormData(prev => ({
      ...prev,
      projects: [...prev.projects, { id: Date.now().toString(), name: '', location: '', status: 'upcoming', description: '' }]
    }));
  };

  const removeProject = (id: string) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id)
    }));
  };

  const addCredential = () => {
    setFormData(prev => ({
      ...prev,
      credentials: [...prev.credentials, { id: Date.now().toString(), name: '', issuer: '', year: '' }]
    }));
  };

  const removeCredential = (id: string) => {
    setFormData(prev => ({
      ...prev,
      credentials: prev.credentials.filter(c => c.id !== id)
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-background to-orange-50/30">
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
            <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center">
              <HardHat size={18} className="text-white" />
            </div>
            <span className="font-bold text-foreground">Construction Template</span>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          
          {/* Company Information */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Building2 size={20} className="text-yellow-600" />
              Company Information
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Company Name</label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="Your Company Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Established Year</label>
                <Input
                  value={formData.established}
                  onChange={(e) => setFormData(prev => ({ ...prev, established: e.target.value }))}
                  placeholder="2005"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Tagline</label>
                <Input
                  value={formData.tagline}
                  onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                  placeholder="Quality craftsmanship..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">About Us</label>
                <Textarea
                  value={formData.about}
                  onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
                  rows={4}
                  placeholder="Tell about your company..."
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Phone size={20} className="text-yellow-600" />
              Contact Information
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(503) 555-9876"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Emergency Phone</label>
                <Input
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                  placeholder="24/7 Emergency Line"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="info@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Service Area</label>
                <Input
                  value={formData.serviceArea}
                  onChange={(e) => setFormData(prev => ({ ...prev, serviceArea: e.target.value }))}
                  placeholder="Greater Portland Area"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Address</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Builder Way, Portland, OR"
                />
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Wrench size={20} className="text-yellow-600" />
                Our Services
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
                  <div className="grid md:grid-cols-2 gap-3">
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
                      placeholder="Brief description"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Projects */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Home size={20} className="text-yellow-600" />
                Featured Projects
              </h2>
              <Button variant="outline" size="sm" onClick={addProject}>
                <Plus size={16} className="mr-1" /> Add Project
              </Button>
            </div>
            <div className="space-y-4">
              {formData.projects.map((project, index) => (
                <div key={project.id} className="p-4 bg-muted/50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Project {index + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeProject(project.id)}>
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <Input
                      value={project.name}
                      onChange={(e) => {
                        const updated = [...formData.projects];
                        updated[index].name = e.target.value;
                        setFormData(prev => ({ ...prev, projects: updated }));
                      }}
                      placeholder="Project Name"
                    />
                    <Input
                      value={project.location}
                      onChange={(e) => {
                        const updated = [...formData.projects];
                        updated[index].location = e.target.value;
                        setFormData(prev => ({ ...prev, projects: updated }));
                      }}
                      placeholder="Location"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <select
                      value={project.status}
                      onChange={(e) => {
                        const updated = [...formData.projects];
                        updated[index].status = e.target.value as any;
                        setFormData(prev => ({ ...prev, projects: updated }));
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                    >
                      <option value="completed">Completed</option>
                      <option value="in-progress">In Progress</option>
                      <option value="upcoming">Upcoming</option>
                    </select>
                    <Input
                      value={project.description}
                      onChange={(e) => {
                        const updated = [...formData.projects];
                        updated[index].description = e.target.value;
                        setFormData(prev => ({ ...prev, projects: updated }));
                      }}
                      placeholder="Brief description"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Credentials */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Award size={20} className="text-yellow-600" />
                Credentials & Licenses
              </h2>
              <Button variant="outline" size="sm" onClick={addCredential}>
                <Plus size={16} className="mr-1" /> Add Credential
              </Button>
            </div>
            <div className="space-y-4">
              {formData.credentials.map((cred, index) => (
                <div key={cred.id} className="p-4 bg-muted/50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Credential {index + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeCredential(cred.id)}>
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <Input
                      value={cred.name}
                      onChange={(e) => {
                        const updated = [...formData.credentials];
                        updated[index].name = e.target.value;
                        setFormData(prev => ({ ...prev, credentials: updated }));
                      }}
                      placeholder="Credential Name"
                    />
                    <Input
                      value={cred.issuer}
                      onChange={(e) => {
                        const updated = [...formData.credentials];
                        updated[index].issuer = e.target.value;
                        setFormData(prev => ({ ...prev, credentials: updated }));
                      }}
                      placeholder="Issuing Organization"
                    />
                    <Input
                      value={cred.year}
                      onChange={(e) => {
                        const updated = [...formData.credentials];
                        updated[index].year = e.target.value;
                        setFormData(prev => ({ ...prev, credentials: updated }));
                      }}
                      placeholder="Year"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Business Hours */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock size={20} className="text-yellow-600" />
              Business Hours
            </h2>
            <div className="space-y-3">
              {formData.businessHours.map((hour, index) => (
                <div key={hour.day} className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl">
                  <span className="w-24 font-medium text-foreground">{hour.day}</span>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={hour.isClosed}
                      onChange={(e) => {
                        const updated = [...formData.businessHours];
                        updated[index].isClosed = e.target.checked;
                        setFormData(prev => ({ ...prev, businessHours: updated }));
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
                          const updated = [...formData.businessHours];
                          updated[index].open = e.target.value;
                          setFormData(prev => ({ ...prev, businessHours: updated }));
                        }}
                        className="w-32"
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={hour.close}
                        onChange={(e) => {
                          const updated = [...formData.businessHours];
                          updated[index].close = e.target.value;
                          setFormData(prev => ({ ...prev, businessHours: updated }));
                        }}
                        className="w-32"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Photo Gallery */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Camera size={20} className="text-yellow-600" />
              Photo Gallery
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.galleryImages.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  <img src={img} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      galleryImages: prev.galleryImages.filter((_, i) => i !== index)
                    }))}
                    className="absolute top-2 right-2 w-8 h-8 bg-destructive/90 rounded-full flex items-center justify-center"
                  >
                    <Trash2 size={14} className="text-destructive-foreground" />
                  </button>
                </div>
              ))}
              <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                {uploadingImage ? (
                  <Loader2 className="animate-spin text-muted-foreground" size={24} />
                ) : (
                  <>
                    <ImageIcon size={24} className="text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Add Photo</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText size={20} className="text-yellow-600" />
              Call to Action
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">CTA Title</label>
                <Input
                  value={formData.ctaText}
                  onChange={(e) => setFormData(prev => ({ ...prev, ctaText: e.target.value }))}
                  placeholder="Schedule a Consultation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">CTA Description</label>
                <Textarea
                  value={formData.ctaDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, ctaDescription: e.target.value }))}
                  placeholder="Contact us today..."
                />
              </div>
            </div>
          </div>

        </motion.div>
      </main>
    </div>
  );
}
