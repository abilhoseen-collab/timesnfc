import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { getUserFriendlyError } from '@/lib/errorHandler';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Undo2, BarChart3, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import CustomSectionsEditor from '@/components/CustomSectionsEditor';
import VCardPreview from '@/components/vcard/VCardPreview';
import VCardAnalyticsDashboard from '@/components/vcard/VCardAnalyticsDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import refactored components
import {
  BasicInfoEditor,
  SocialLinksEditor,
  AppointmentSettings,
  PaymentSettings,
  ChatWidgetSettings,
  NotificationSettings,
  QRCodeSettings,
  PhotoUploader,
  TemplateSelector,
  FormData,
  initialFormData,
} from '@/components/vcard-editor';
import CustomDomainManager from '@/components/vcard-editor/CustomDomainManager';
import IntegrationsPanel from '@/components/vcard-editor/IntegrationsPanel';
import ThemeBuilderPanel from '@/components/vcard-editor/ThemeBuilderPanel';

export default function VCardEditor() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    canCreateVcard, 
    currentVcards, 
    vcardLimit, 
    hasActiveSubscription, 
    isLoading: limitsLoading,
    packageName 
  } = useSubscriptionLimits();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentVcardId, setCurrentVcardId] = useState<string | null>(id || null);
  const isEditing = !!id;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Redirect to payment if no active subscription (only for new cards)
  useEffect(() => {
    if (!limitsLoading && !hasActiveSubscription && !isEditing) {
      toast({
        title: 'সাবস্ক্রিপশন প্রয়োজন',
        description: 'কার্ড তৈরি করতে একটি প্যাকেজ কিনুন।',
        variant: 'destructive',
      });
      navigate('/payment');
    }
  }, [limitsLoading, hasActiveSubscription, isEditing, navigate, toast]);

  // Check limits for new cards
  useEffect(() => {
    if (!limitsLoading && hasActiveSubscription && !isEditing && !canCreateVcard) {
      toast({
        title: 'লিমিট শেষ',
        description: `আপনার ${packageName} প্ল্যানে সর্বোচ্চ ${vcardLimit}টি VCard তৈরি করা যায়। বর্তমানে ${currentVcards}টি আছে।`,
        variant: 'destructive',
      });
      navigate('/dashboard');
    }
  }, [limitsLoading, hasActiveSubscription, isEditing, canCreateVcard, vcardLimit, currentVcards, packageName, navigate, toast]);

  useEffect(() => {
    if (id && user && hasActiveSubscription) {
      fetchVCard();
    } else if (user && !id && hasActiveSubscription && canCreateVcard) {
      createDraftCard();
    }
  }, [id, user, hasActiveSubscription, canCreateVcard]);

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
          is_active: false,
        })
        .select()
        .single();

      if (error) {
        toast({
          title: 'ত্রুটি',
          description: getUserFriendlyError(error),
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

      if (data) {
        setCurrentVcardId(data.id);
        setFormData(prev => ({ ...prev, name: '' }));
        navigate(`/vcard/${data.id}`, { replace: true });
      }
    } catch (error) {
      console.error('Failed to create draft:', error);
      toast({
        title: 'ত্রুটি',
        description: getUserFriendlyError(error),
        variant: 'destructive',
      });
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const fetchVCard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vcards')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast({
          title: 'ত্রুটি',
          description: 'কার্ড পাওয়া যায়নি',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

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
        cover_image_url: data.cover_image_url || '',
        qr_foreground_color: data.qr_foreground_color || '#000000',
        qr_background_color: data.qr_background_color || '#FFFFFF',
        qr_logo_url: data.qr_logo_url || '',
        notification_email: data.notification_email || '',
        notify_on_view: data.notify_on_view ?? false,
        notify_on_click: data.notify_on_click ?? false,
        slug: data.slug || '',
        whatsapp_number: data.whatsapp_number || '',
        telegram_username: data.telegram_username || '',
        chat_enabled: data.chat_enabled ?? false,
        payment_enabled: data.payment_enabled ?? false,
        payment_bkash: data.payment_bkash || '',
        payment_nagad: data.payment_nagad || '',
        payment_rocket: data.payment_rocket || '',
        payment_bank_details: data.payment_bank_details || '',
        payment_button_text: data.payment_button_text || 'Send Payment / Donate',
        appointment_enabled: data.appointment_enabled ?? false,
        appointment_title: data.appointment_title || 'Book an Appointment',
        appointment_description: data.appointment_description || '',
        appointment_duration_minutes: data.appointment_duration_minutes || 30,
        appointment_available_days: Array.isArray(data.appointment_available_days)
          ? (data.appointment_available_days as string[])
          : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        appointment_start_time: data.appointment_start_time || '09:00',
        appointment_end_time: data.appointment_end_time || '17:00',
        appointment_email: data.appointment_email || '',
      });
      setCurrentVcardId(data.id);
    } catch (err) {
      toast({
        title: 'ত্রুটি',
        description: getUserFriendlyError(err),
        variant: 'destructive',
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
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
      if (currentVcardId) {
        const { error } = await supabase
          .from('vcards')
          .update({
            ...formData,
            slug: formData.slug || generateSlug(formData.name),
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

  if (authLoading || loading || limitsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show subscription required message if trying to access without subscription
  if (hasActiveSubscription === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              কার্ড তৈরি বা এডিট করতে সক্রিয় সাবস্ক্রিপশন প্রয়োজন।
            </AlertDescription>
          </Alert>
          <Button variant="secondary" onClick={() => navigate('/payment')}>
            প্যাকেজ কিনুন
          </Button>
        </div>
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
            <span className="hidden sm:inline">ড্যাশবোর্ডে ফিরুন</span>
          </button>
          
          <div className="flex items-center gap-4">
            {/* Publish Toggle */}
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange('is_active', checked)}
              />
              <Label 
                htmlFor="is_active" 
                className={`text-sm font-medium flex items-center gap-1.5 cursor-pointer ${
                  formData.is_active ? 'text-green-600' : 'text-muted-foreground'
                }`}
              >
                {formData.is_active ? (
                  <>
                    <Eye size={14} />
                    <span className="hidden sm:inline">Published</span>
                  </>
                ) : (
                  <>
                    <EyeOff size={14} />
                    <span className="hidden sm:inline">Draft</span>
                  </>
                )}
              </Label>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (window.confirm('পরিবর্তনগুলো বাতিল করতে চান?')) {
                        window.location.reload();
                      }
                    }}
                    className="h-9 w-9"
                  >
                    <Undo2 size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>পরিবর্তন বাতিল</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button 
              variant="secondary" 
              onClick={() => handleSubmit()}
              disabled={saving}
              className="font-semibold"
            >
              <Save size={18} className="mr-2" />
              {saving ? 'সেভ হচ্ছে...' : isEditing ? 'আপডেট করুন' : 'তৈরি করুন'}
            </Button>
          </div>
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

            <Tabs defaultValue="content" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="content">Content & Design</TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 size={14} />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
                <TabsTrigger value="theme">Theme</TabsTrigger>
              </TabsList>

              <TabsContent value="content">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Photo Uploader */}
                  <PhotoUploader 
                    formData={formData} 
                    onChange={handleChange} 
                    userId={user?.id} 
                  />

                  {/* Basic Info */}
                  <BasicInfoEditor formData={formData} onChange={handleChange} />

                  {/* Social Links */}
                  <SocialLinksEditor formData={formData} onChange={handleChange} />

                  {/* QR Code */}
                  <QRCodeSettings 
                    formData={formData} 
                    onChange={handleChange} 
                    userId={user?.id} 
                  />

                  {/* Notifications */}
                  <NotificationSettings formData={formData} onChange={handleChange} />

                  {/* Chat Widget */}
                  <ChatWidgetSettings formData={formData} onChange={handleChange} />

                  {/* Payment */}
                  <PaymentSettings formData={formData} onChange={handleChange} />

                  {/* Appointment */}
                  <AppointmentSettings 
                    formData={formData} 
                    onChange={handleChange} 
                    currentVcardId={currentVcardId} 
                  />

                  {/* Template Selector */}
                  <TemplateSelector 
                    selectedTemplate={formData.template} 
                    onChange={handleChange} 
                  />

                  {/* Custom Sections */}
                  {currentVcardId && (
                    <div className="bg-card rounded-2xl p-6 border border-border">
                      <CustomSectionsEditor vcardId={currentVcardId} />
                    </div>
                  )}

                  {/* Custom Domain */}
                  {currentVcardId && <CustomDomainManager vcardId={currentVcardId} />}

                  {/* Branding (hide_branding for paid tiers) */}
                  <div className="bg-card rounded-2xl p-6 border border-border flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <Label className="font-medium">"Powered by" badge সরান</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Business tier ইউজার তাদের vCard ফুটার থেকে branding সরাতে পারবেন।
                      </p>
                    </div>
                    <Switch
                      checked={!!(formData as any).hide_branding}
                      onCheckedChange={(v) => handleChange('hide_branding' as any, v)}
                    />
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="analytics">
                {currentVcardId ? (
                  <VCardAnalyticsDashboard vcardId={currentVcardId} />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Save your card first to see analytics</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="integrations">
                {currentVcardId ? (
                  <IntegrationsPanel vcardId={currentVcardId} />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Save your card first to configure integrations
                  </div>
                )}
              </TabsContent>

              <TabsContent value="theme">
                {currentVcardId ? (
                  <ThemeBuilderPanel vcardId={currentVcardId} />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Save your card first to customize theme
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Preview Section */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Live Preview</h3>
              <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-lg">
                <div className="max-h-[600px] overflow-auto">
                  <VCardPreview formData={formData} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
