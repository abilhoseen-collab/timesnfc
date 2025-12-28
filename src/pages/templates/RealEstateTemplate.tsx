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
  Home, 
  Building,
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  DollarSign,
  Star,
  Award,
  Calendar,
  User,
  Loader2,
  Plus,
  Trash2,
  Globe,
  Facebook,
  Linkedin,
  Instagram,
  FileText,
  TrendingUp,
  Camera
} from 'lucide-react';

interface PropertyListing {
  id: string;
  title: string;
  address: string;
  price: string;
  beds: string;
  baths: string;
  sqft: string;
  status: 'for-sale' | 'for-rent' | 'sold' | 'pending';
  description: string;
  image: string;
}

interface RealEstateService {
  id: string;
  name: string;
  description: string;
}

interface BusinessHour {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
}

interface RealEstateFormData {
  fullName: string;
  title: string;
  licenseNumber: string;
  yearsExperience: string;
  specializations: string[];
  about: string;
  phone: string;
  email: string;
  website: string;
  officeAddress: string;
  serviceArea: string;
  businessHours: BusinessHour[];
  listings: PropertyListing[];
  services: RealEstateService[];
  testimonials: { name: string; content: string; rating: number }[];
  facebookUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  zillowUrl: string;
  appStoreUrl: string;
  playStoreUrl: string;
  marketStats: {
    avgPrice: string;
    avgDaysOnMarket: string;
    marketTrend: string;
  };
  ctaText: string;
  ctaDescription: string;
}

const defaultBusinessHours: BusinessHour[] = [
  { day: 'Monday', open: '09:00', close: '17:00', isClosed: false },
  { day: 'Tuesday', open: '09:00', close: '17:00', isClosed: false },
  { day: 'Wednesday', open: '09:00', close: '17:00', isClosed: false },
  { day: 'Thursday', open: '09:00', close: '17:00', isClosed: false },
  { day: 'Friday', open: '09:00', close: '17:00', isClosed: false },
  { day: 'Saturday', open: '10:00', close: '15:00', isClosed: false },
  { day: 'Sunday', open: '', close: '', isClosed: true },
];

export default function RealEstateTemplate() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState<RealEstateFormData>({
    fullName: 'Sarah Johnson',
    title: 'Licensed Real Estate Agent',
    licenseNumber: 'RE-1234567B',
    yearsExperience: '10+ Years Experience',
    specializations: ['Residential', 'Luxury Homes', 'First-Time Buyers', 'Investment Properties'],
    about: 'With over 10 years of experience in the real estate market, I specialize in helping clients find their dream homes and investment properties. My knowledge of the local market and dedication to client satisfaction ensures a smooth and successful transaction.',
    phone: '+1 (555) 987-6543',
    email: 'sarah@premierproperties.com',
    website: 'https://www.sarahjohnsonrealty.com',
    officeAddress: '789 Realty Drive, Suite 200, Metro City, CA 90210',
    serviceArea: 'Metro City and surrounding areas',
    businessHours: defaultBusinessHours,
    listings: [
      { id: '1', title: 'Luxury Estate', address: '123 Luxury Lane, Metro City, CA', price: '$1,250,000', beds: '4', baths: '3.5', sqft: '3200', status: 'for-sale', description: 'Stunning modern home with open floor plan, gourmet kitchen, and resort-style backyard.', image: '' },
      { id: '2', title: 'Charming Family Home', address: '456 Family Circle, Metro City, CA', price: '$750,000', beds: '3', baths: '2', sqft: '1800', status: 'for-sale', description: 'Charming family home in top school district with updated kitchen and hardwood floors.', image: '' },
      { id: '3', title: 'Downtown Loft', address: '789 Downtown Loft, Metro City, CA', price: '$525,000', beds: '2', baths: '2', sqft: '1400', status: 'pending', description: 'Modern downtown loft with high ceilings, exposed brick, and stunning city views.', image: '' },
    ],
    services: [
      { id: '1', name: 'Buyer Representation', description: 'Expert guidance through the entire home buying process, from search to closing.' },
      { id: '2', name: 'Seller Representation', description: 'Strategic marketing and pricing to sell your home quickly and for the best price.' },
      { id: '3', name: 'Property Valuation', description: 'Detailed market analysis to determine the optimal listing price for your property.' },
      { id: '4', name: 'Investment Consulting', description: 'Advice on real estate investments to maximize returns and build wealth.' },
    ],
    testimonials: [
      { name: 'Mike Johnson', content: 'As a first-time homebuyer, I was nervous about the process. Sarah guided me every step of the way and I found a perfect starter home within my budget.', rating: 5 }
    ],
    facebookUrl: '',
    instagramUrl: '',
    linkedinUrl: '',
    zillowUrl: '',
    appStoreUrl: '',
    playStoreUrl: '',
    marketStats: {
      avgPrice: '$625,000',
      avgDaysOnMarket: '18',
      marketTrend: 'The Metro City real estate market shows strong activity with limited inventory and strong demand, especially in desirable neighborhoods with good schools. Current market data shows positive trend for both buyers and sellers.',
    },
    ctaText: 'Schedule Appointment',
    ctaDescription: 'Have questions about buying or selling a home? Send me a message and I\'ll get back to you promptly. Thank you for considering me for your real estate needs.',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/templates/realestate');
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

  const loadSavedData = () => {
    const saved = localStorage.getItem(`realestate_template_${user?.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.log('No saved data found');
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem(`realestate_template_${user?.id}`, JSON.stringify(formData));
      toast({ title: 'Saved successfully!' });
    } catch (error) {
      toast({ title: 'Save failed', variant: 'destructive' });
    }
    setSaving(false);
  };

  const addListing = () => {
    setFormData(prev => ({
      ...prev,
      listings: [...prev.listings, { id: Date.now().toString(), title: '', address: '', price: '', beds: '', baths: '', sqft: '', status: 'for-sale', description: '', image: '' }]
    }));
  };

  const removeListing = (id: string) => {
    setFormData(prev => ({
      ...prev,
      listings: prev.listings.filter(l => l.id !== id)
    }));
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { id: Date.now().toString(), name: '', description: '' }]
    }));
  };

  const removeService = (id: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(s => s.id !== id)
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, listingId: string) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please upload an image file', variant: 'destructive' });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `realestate/${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      setFormData(prev => ({
        ...prev,
        listings: prev.listings.map(l => l.id === listingId ? { ...l, image: publicUrl } : l)
      }));
      toast({ title: 'Image uploaded!' });
    } catch (error) {
      toast({ title: 'Upload failed', variant: 'destructive' });
    }
    setUploadingImage(false);
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-green-50/30">
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
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Home size={18} className="text-white" />
            </div>
            <span className="font-bold text-foreground">Real Estate Template</span>
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
              <User size={20} className="text-emerald-600" />
              Agent Information
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Sarah Johnson"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Licensed Real Estate Agent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">License Number</label>
                <Input
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                  placeholder="RE-1234567B"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Experience</label>
                <Input
                  value={formData.yearsExperience}
                  onChange={(e) => setFormData(prev => ({ ...prev, yearsExperience: e.target.value }))}
                  placeholder="10+ Years Experience"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">About</label>
                <Textarea
                  value={formData.about}
                  onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
                  rows={4}
                  placeholder="Tell clients about yourself..."
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Phone size={20} className="text-emerald-600" />
              Contact Information
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 987-6543"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="sarah@premierproperties.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Website</label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://www.sarahjohnsonrealty.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Service Area</label>
                <Input
                  value={formData.serviceArea}
                  onChange={(e) => setFormData(prev => ({ ...prev, serviceArea: e.target.value }))}
                  placeholder="Metro City and surrounding areas"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Office Address</label>
                <Input
                  value={formData.officeAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, officeAddress: e.target.value }))}
                  placeholder="789 Realty Drive, Suite 200"
                />
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock size={20} className="text-emerald-600" />
              Business Hours
            </h2>
            <div className="space-y-3">
              {formData.businessHours.map((hour, index) => (
                <div key={hour.day} className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl flex-wrap">
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

          {/* Featured Listings */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Building size={20} className="text-emerald-600" />
                Featured Listings
              </h2>
              <Button variant="outline" size="sm" onClick={addListing}>
                <Plus size={16} className="mr-1" /> Add Listing
              </Button>
            </div>
            <div className="space-y-6">
              {formData.listings.map((listing, index) => (
                <div key={listing.id} className="p-4 bg-muted/50 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Listing {index + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeListing(listing.id)}>
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <Input
                      value={listing.title}
                      onChange={(e) => {
                        const updated = [...formData.listings];
                        updated[index].title = e.target.value;
                        setFormData(prev => ({ ...prev, listings: updated }));
                      }}
                      placeholder="Property Title"
                    />
                    <Input
                      value={listing.price}
                      onChange={(e) => {
                        const updated = [...formData.listings];
                        updated[index].price = e.target.value;
                        setFormData(prev => ({ ...prev, listings: updated }));
                      }}
                      placeholder="Price (e.g., $750,000)"
                    />
                  </div>
                  <Input
                    value={listing.address}
                    onChange={(e) => {
                      const updated = [...formData.listings];
                      updated[index].address = e.target.value;
                      setFormData(prev => ({ ...prev, listings: updated }));
                    }}
                    placeholder="Full Address"
                  />
                  <div className="grid grid-cols-4 gap-3">
                    <Input
                      value={listing.beds}
                      onChange={(e) => {
                        const updated = [...formData.listings];
                        updated[index].beds = e.target.value;
                        setFormData(prev => ({ ...prev, listings: updated }));
                      }}
                      placeholder="Beds"
                    />
                    <Input
                      value={listing.baths}
                      onChange={(e) => {
                        const updated = [...formData.listings];
                        updated[index].baths = e.target.value;
                        setFormData(prev => ({ ...prev, listings: updated }));
                      }}
                      placeholder="Baths"
                    />
                    <Input
                      value={listing.sqft}
                      onChange={(e) => {
                        const updated = [...formData.listings];
                        updated[index].sqft = e.target.value;
                        setFormData(prev => ({ ...prev, listings: updated }));
                      }}
                      placeholder="Sq.Ft"
                    />
                    <select
                      value={listing.status}
                      onChange={(e) => {
                        const updated = [...formData.listings];
                        updated[index].status = e.target.value as any;
                        setFormData(prev => ({ ...prev, listings: updated }));
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                    >
                      <option value="for-sale">For Sale</option>
                      <option value="for-rent">For Rent</option>
                      <option value="pending">Pending</option>
                      <option value="sold">Sold</option>
                    </select>
                  </div>
                  <Textarea
                    value={listing.description}
                    onChange={(e) => {
                      const updated = [...formData.listings];
                      updated[index].description = e.target.value;
                      setFormData(prev => ({ ...prev, listings: updated }));
                    }}
                    placeholder="Property description..."
                    rows={2}
                  />
                  <div className="flex items-center gap-4">
                    {listing.image ? (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                        <img src={listing.image} alt="Property" className="w-full h-full object-cover" />
                        <button
                          onClick={() => {
                            const updated = [...formData.listings];
                            updated[index].image = '';
                            setFormData(prev => ({ ...prev, listings: updated }));
                          }}
                          className="absolute top-1 right-1 w-6 h-6 bg-destructive/90 rounded-full flex items-center justify-center"
                        >
                          <Trash2 size={12} className="text-destructive-foreground" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                        <Camera size={20} className="text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Add Photo</span>
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, listing.id)} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Services */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Award size={20} className="text-emerald-600" />
                Services
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

          {/* Market Statistics */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-600" />
              Market Statistics
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Average Price</label>
                <Input
                  value={formData.marketStats.avgPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, marketStats: { ...prev.marketStats, avgPrice: e.target.value } }))}
                  placeholder="$625,000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Avg. Days on Market</label>
                <Input
                  value={formData.marketStats.avgDaysOnMarket}
                  onChange={(e) => setFormData(prev => ({ ...prev, marketStats: { ...prev.marketStats, avgDaysOnMarket: e.target.value } }))}
                  placeholder="18"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Market Trend Description</label>
                <Textarea
                  value={formData.marketStats.marketTrend}
                  onChange={(e) => setFormData(prev => ({ ...prev, marketStats: { ...prev.marketStats, marketTrend: e.target.value } }))}
                  rows={3}
                  placeholder="Current market conditions..."
                />
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Globe size={20} className="text-emerald-600" />
              Connect With Me
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Facebook</label>
                <Input
                  value={formData.facebookUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, facebookUrl: e.target.value }))}
                  placeholder="facebook.com/yourpage"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Instagram</label>
                <Input
                  value={formData.instagramUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, instagramUrl: e.target.value }))}
                  placeholder="instagram.com/yourhandle"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">LinkedIn</label>
                <Input
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                  placeholder="linkedin.com/in/yourprofile"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Zillow</label>
                <Input
                  value={formData.zillowUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, zillowUrl: e.target.value }))}
                  placeholder="zillow.com/profile/yourprofile"
                />
              </div>
            </div>
          </div>

          {/* Download App */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-emerald-600" />
              Download Our App
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
              <FileText size={20} className="text-emerald-600" />
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
                  placeholder="Thank you for considering..."
                />
              </div>
            </div>
          </div>

        </motion.div>
      </main>
    </div>
  );
}
