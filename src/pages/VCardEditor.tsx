import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getUserFriendlyError } from '@/lib/errorHandler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Briefcase, 
  Building, 
  Mail, 
  Phone, 
  Globe,
  MapPin,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Github,
  Eye,
  Camera,
  Loader2,
  QrCode,
  Bell,
  Layout
} from 'lucide-react';
import CustomSectionsEditor from '@/components/CustomSectionsEditor';
import VCardPreview from '@/components/vcard/VCardPreview';

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

const templates = [
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

interface FormData {
  name: string;
  job_title: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  bio: string;
  template: string;
  linkedin_url: string;
  twitter_url: string;
  facebook_url: string;
  instagram_url: string;
  youtube_url: string;
  github_url: string;
  is_active: boolean;
  photo_url: string;
  cover_image_url: string;
  qr_foreground_color: string;
  qr_background_color: string;
  qr_logo_url: string;
  notification_email: string;
  notify_on_view: boolean;
  notify_on_click: boolean;
  slug: string;
}

const initialFormData: FormData = {
  name: '',
  job_title: '',
  company: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  bio: '',
  template: 'freelancer',
  linkedin_url: '',
  twitter_url: '',
  facebook_url: '',
  instagram_url: '',
  youtube_url: '',
  github_url: '',
  is_active: true,
  photo_url: '',
  cover_image_url: '',
  qr_foreground_color: '#000000',
  qr_background_color: '#FFFFFF',
  qr_logo_url: '',
  notification_email: '',
  notify_on_view: false,
  notify_on_click: false,
  slug: '',
};

export default function VCardEditor() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [currentVcardId, setCurrentVcardId] = useState<string | null>(id || null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!id;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (id && user) {
      fetchVCard();
    } else if (user && !id) {
      // For new cards, create a draft immediately so custom sections can work
      createDraftCard();
    }
  }, [id, user]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
  };

  const createDraftCard = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const draftName = 'New Card';
      const { data, error } = await supabase
        .from('vcards')
        .insert({
          name: draftName,
          user_id: user.id,
          slug: generateSlug(draftName),
          is_active: false, // Draft cards start as inactive
        })
        .select()
        .single();

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to create card',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

      if (data) {
        setCurrentVcardId(data.id);
        setFormData(prev => ({ ...prev, name: '' })); // Clear name so user can enter their own
        // Navigate to the edit URL so the ID is in the URL
        navigate(`/vcard/${data.id}`, { replace: true });
      }
    } catch (error) {
      console.error('Failed to create draft:', error);
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const fetchVCard = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vcards')
      .select('*')
      .eq('id', id)
      .eq('user_id', user?.id)
      .single();

    if (error || !data) {
      toast({
        title: 'Error',
        description: 'Card not found',
        variant: 'destructive',
      });
      navigate('/dashboard');
    } else {
      setFormData({
        name: data.name || '',
        job_title: data.job_title || '',
        company: data.company || '',
        email: data.email || '',
        phone: data.phone || '',
        website: data.website || '',
        address: data.address || '',
        bio: data.bio || '',
        template: data.template || 'freelancer',
        linkedin_url: data.linkedin_url || '',
        twitter_url: data.twitter_url || '',
        facebook_url: data.facebook_url || '',
        instagram_url: data.instagram_url || '',
        youtube_url: data.youtube_url || '',
        github_url: data.github_url || '',
        is_active: data.is_active ?? true,
        photo_url: data.photo_url || '',
        cover_image_url: (data as any).cover_image_url || '',
        qr_foreground_color: data.qr_foreground_color || '#000000',
        qr_background_color: data.qr_background_color || '#FFFFFF',
        qr_logo_url: data.qr_logo_url || '',
        notification_email: data.notification_email || '',
        notify_on_view: data.notify_on_view ?? false,
        notify_on_click: data.notify_on_click ?? false,
        slug: data.slug || '',
      });
      setCurrentVcardId(data.id);
    }
    setLoading(false);
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadingPhoto(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, photo_url: publicUrl }));
      
      toast({
        title: 'Photo uploaded',
        description: 'Your profile photo has been uploaded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload photo',
        variant: 'destructive',
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image smaller than 5MB', variant: 'destructive' });
      return;
    }

    setUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `covers/${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, cover_image_url: publicUrl }));
      toast({ title: 'Cover image uploaded successfully' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image smaller than 2MB', variant: 'destructive' });
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('qr-logos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('qr-logos')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, qr_logo_url: publicUrl }));
      toast({ title: 'Logo uploaded successfully' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingLogo(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Name is required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      // Always update since we create a draft on new card
      if (currentVcardId) {
        const { error } = await supabase
          .from('vcards')
          .update({
            ...formData,
            is_active: true, // Activate the card when saved
            slug: generateSlug(formData.name), // Update slug with actual name
          })
          .eq('id', currentVcardId)
          .eq('user_id', user?.id);

        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Card saved successfully',
        });
      }
      
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getUserFriendlyError(error),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-orange-50/30">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-50">
        <div className="container-custom flex items-center justify-between h-16">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <Button 
            variant="secondary" 
            onClick={handleSubmit}
            disabled={saving}
            className="font-semibold"
          >
            <Save size={18} className="mr-2" />
            {saving ? 'Saving...' : isEditing ? 'Update Card' : 'Create Card'}
          </Button>
        </div>
      </header>

      <main className="container-custom py-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Editor Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isEditing ? 'Edit Business Card' : 'Create New Business Card'}
          </h1>
          <p className="text-muted-foreground mb-8">
            Fill in your information to create a professional digital business card
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Photo */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Camera size={20} className="text-primary" />
                Profile Photo
              </h2>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border">
                    {formData.photo_url ? (
                      <img 
                        src={formData.photo_url} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={32} className="text-muted-foreground" />
                    )}
                  </div>
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <Loader2 size={24} className="animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                  >
                    <Camera size={16} className="mr-2" />
                    {uploadingPhoto ? 'Uploading...' : formData.photo_url ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    JPG, PNG or GIF. Max 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Cover Image */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Layout size={20} className="text-primary" />
                Cover Image
              </h2>
              <div className="space-y-4">
                {formData.cover_image_url ? (
                  <div className="relative aspect-[3/1] rounded-xl overflow-hidden bg-muted border border-border">
                    <img 
                      src={formData.cover_image_url} 
                      alt="Cover" 
                      className="w-full h-full object-cover"
                    />
                    {uploadingCover && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 size={24} className="animate-spin text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[3/1] rounded-xl bg-muted border-2 border-dashed border-border flex items-center justify-center">
                    <div className="text-center">
                      <Layout size={32} className="mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No cover image</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    ref={coverInputRef}
                    onChange={handleCoverUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                  >
                    <Camera size={16} className="mr-2" />
                    {uploadingCover ? 'Uploading...' : formData.cover_image_url ? 'Change Cover' : 'Upload Cover'}
                  </Button>
                  {formData.cover_image_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setFormData(prev => ({ ...prev, cover_image_url: '' }))}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Recommended size: 1200x400px. Max 5MB. This will appear as a banner at the top of your card.
                </p>
              </div>
            </div>

            {/* Basic Info */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <User size={20} className="text-primary" />
                Basic Information
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Full Name *
                  </label>
                  <Input
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="bg-background"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Job Title
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      placeholder="Senior Developer"
                      value={formData.job_title}
                      onChange={(e) => handleChange('job_title', e.target.value)}
                      className="pl-10 bg-background"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Company
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      placeholder="Tech Solutions Inc."
                      value={formData.company}
                      onChange={(e) => handleChange('company', e.target.value)}
                      className="pl-10 bg-background"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="pl-10 bg-background"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      placeholder="+880 1XXX-XXXXXX"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="pl-10 bg-background"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Website
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                      className="pl-10 bg-background"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-muted-foreground" size={16} />
                    <Input
                      placeholder="123 Business Street, Dhaka, Bangladesh"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      className="pl-10 bg-background"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Bio
                  </label>
                  <Textarea
                    placeholder="A brief description about yourself or your business..."
                    value={formData.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    className="bg-background resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4">
                Social Links
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    placeholder="LinkedIn URL"
                    value={formData.linkedin_url}
                    onChange={(e) => handleChange('linkedin_url', e.target.value)}
                    className="pl-10 bg-background"
                  />
                </div>
                <div className="relative">
                  <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    placeholder="Twitter URL"
                    value={formData.twitter_url}
                    onChange={(e) => handleChange('twitter_url', e.target.value)}
                    className="pl-10 bg-background"
                  />
                </div>
                <div className="relative">
                  <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    placeholder="Facebook URL"
                    value={formData.facebook_url}
                    onChange={(e) => handleChange('facebook_url', e.target.value)}
                    className="pl-10 bg-background"
                  />
                </div>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    placeholder="Instagram URL"
                    value={formData.instagram_url}
                    onChange={(e) => handleChange('instagram_url', e.target.value)}
                    className="pl-10 bg-background"
                  />
                </div>
                <div className="relative">
                  <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    placeholder="YouTube URL"
                    value={formData.youtube_url}
                    onChange={(e) => handleChange('youtube_url', e.target.value)}
                    className="pl-10 bg-background"
                  />
                </div>
                <div className="relative">
                  <Github className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    placeholder="GitHub URL"
                    value={formData.github_url}
                    onChange={(e) => handleChange('github_url', e.target.value)}
                    className="pl-10 bg-background"
                  />
                </div>
              </div>
            </div>

            {/* QR Code Customization */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <QrCode size={20} className="text-primary" />
                QR Code Customization
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Foreground Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.qr_foreground_color}
                      onChange={(e) => handleChange('qr_foreground_color', e.target.value)}
                      className="w-12 h-12 rounded-lg border border-border cursor-pointer"
                    />
                    <Input
                      value={formData.qr_foreground_color}
                      onChange={(e) => handleChange('qr_foreground_color', e.target.value)}
                      className="bg-background flex-1"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Background Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.qr_background_color}
                      onChange={(e) => handleChange('qr_background_color', e.target.value)}
                      className="w-12 h-12 rounded-lg border border-border cursor-pointer"
                    />
                    <Input
                      value={formData.qr_background_color}
                      onChange={(e) => handleChange('qr_background_color', e.target.value)}
                      className="bg-background flex-1"
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
              </div>

              {/* QR Logo Upload */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Logo Overlay (Optional)
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center border border-border">
                      {formData.qr_logo_url ? (
                        <img 
                          src={formData.qr_logo_url} 
                          alt="QR Logo" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <QrCode size={24} className="text-muted-foreground" />
                      )}
                    </div>
                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <Loader2 size={20} className="animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? 'Uploading...' : formData.qr_logo_url ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                    {formData.qr_logo_url && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-2 text-destructive"
                        onClick={() => handleChange('qr_logo_url', '')}
                      >
                        Remove
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Add your logo to the center of the QR code. Max 2MB.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                Customize your QR code colors and add a logo to match your brand identity.
              </p>
            </div>

            {/* Notification Settings */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Bell size={20} className="text-primary" />
                Email Notifications
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Notification Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={formData.notification_email}
                      onChange={(e) => handleChange('notification_email', e.target.value)}
                      className="pl-10 bg-background"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Receive notifications when someone interacts with your card.
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notify_on_view}
                      onChange={(e) => handleChange('notify_on_view', e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">Notify on card view</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notify_on_click}
                      onChange={(e) => handleChange('notify_on_click', e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">Notify on link click</span>
                  </label>
                </div>
              </div>
            </div>
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
                    onClick={() => handleChange('template', template.id)}
                    className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                      formData.template === template.id
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-border hover:border-primary/50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <img
                      src={template.image}
                      alt={template.name}
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 to-transparent p-2">
                      <span className="text-xs font-medium text-primary-foreground">
                        {template.name}
                      </span>
                    </div>
                    {formData.template === template.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Custom Sections - Only show when editing or after card is created */}
            {currentVcardId && (
              <div className="bg-card rounded-2xl p-6 border border-border">
                <div className="flex items-center gap-2 mb-6">
                  <Layout size={20} className="text-primary" />
                  <h2 className="text-lg font-bold text-foreground">Landing Page Sections</h2>
                </div>
                <CustomSectionsEditor vcardId={currentVcardId} />
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                variant="secondary" 
                disabled={saving}
                className="font-semibold"
              >
                <Save size={18} className="mr-2" />
                {saving ? 'Saving...' : isEditing ? 'Update Card' : 'Create Card'}
              </Button>
            </div>
          </form>
          </motion.div>

          {/* Preview Section - Desktop Only */}
          <div className="hidden lg:block">
            <VCardPreview formData={formData} />
          </div>
        </div>
      </main>
    </div>
  );
}
