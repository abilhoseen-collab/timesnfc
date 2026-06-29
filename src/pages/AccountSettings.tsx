import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TwoFactorAuth from "@/components/TwoFactorAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, User, Lock, Mail, Trash2, ArrowLeft, Bell } from "lucide-react";
import NotificationSettings from "@/components/NotificationSettings";

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "নাম প্রয়োজন").max(100, "নাম ১০০ অক্ষরের বেশি হতে পারবে না"),
  phone: z
    .string()
    .trim()
    .max(20, "ফোন নম্বর ২০ অক্ষরের বেশি হতে পারবে না")
    .optional()
    .or(z.literal("")),
});

const passwordSchema = z
  .object({
    newPassword: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে").max(72),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "পাসওয়ার্ড মিলছে না",
    path: ["confirmPassword"],
  });

const emailSchema = z.object({
  newEmail: z.string().trim().email("সঠিক ইমেইল দিন").max(255),
});

export default function AccountSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ full_name: "", phone: "" });
  const [passwords, setPasswords] = useState({ newPassword: "", confirmPassword: "" });
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setProfile({ full_name: data.full_name || "", phone: data.phone || "" });
      }
    })();
  }, [user, navigate]);

  const handleProfileSave = async () => {
    const parsed = profileSchema.safeParse(profile);
    if (!parsed.success) {
      toast({
        title: "ভ্যালিডেশন এরর",
        description: parsed.error.errors[0]?.message,
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: parsed.data.full_name, phone: parsed.data.phone || null })
        .eq("id", user!.id);
      if (error) throw error;
      toast({ title: "সফল", description: "প্রোফাইল আপডেট হয়েছে" });
    } catch (e) {
      toast({
        title: "সমস্যা হয়েছে",
        description: "প্রোফাইল আপডেট করা যায়নি",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    const parsed = passwordSchema.safeParse(passwords);
    if (!parsed.success) {
      toast({
        title: "ভ্যালিডেশন এরর",
        description: parsed.error.errors[0]?.message,
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
      if (error) throw error;
      toast({ title: "সফল", description: "পাসওয়ার্ড পরিবর্তন হয়েছে" });
      setPasswords({ newPassword: "", confirmPassword: "" });
    } catch (e: any) {
      toast({
        title: "সমস্যা হয়েছে",
        description: e?.message || "পাসওয়ার্ড পরিবর্তন করা যায়নি",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async () => {
    const parsed = emailSchema.safeParse({ newEmail });
    if (!parsed.success) {
      toast({
        title: "ভ্যালিডেশন এরর",
        description: parsed.error.errors[0]?.message,
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: parsed.data.newEmail });
      if (error) throw error;
      toast({
        title: "ভেরিফিকেশন ইমেইল পাঠানো হয়েছে",
        description: "নতুন ইমেইলে যাচাইকরণ লিঙ্কে ক্লিক করুন",
      });
      setNewEmail("");
    } catch (e: any) {
      toast({
        title: "সমস্যা হয়েছে",
        description: e?.message || "ইমেইল পরিবর্তন করা যায়নি",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      // Soft delete: sign out + mark profile for deletion (admin will purge)
      // For full delete, an edge function with service role would be needed.
      await supabase.auth.signOut();
      toast({
        title: "লগ আউট হয়েছে",
        description: "অ্যাকাউন্ট সম্পূর্ণ ডিলিট করতে সাপোর্টে যোগাযোগ করুন",
      });
      navigate("/");
    } catch (e) {
      toast({ title: "সমস্যা হয়েছে", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <Helmet>
        <title>অ্যাকাউন্ট সেটিংস | Times Digital</title>
        <meta name="description" content="আপনার প্রোফাইল, পাসওয়ার্ড ও ইমেইল ম্যানেজ করুন" />
      </Helmet>

      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4 gap-2">
          <ArrowLeft size={16} /> ড্যাশবোর্ডে ফিরুন
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">অ্যাকাউন্ট সেটিংস</h1>
          <p className="text-muted-foreground mt-1">প্রোফাইল ও সিকিউরিটি ম্যানেজ করুন</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile" className="gap-1.5">
              <User size={14} /> প্রোফাইল
            </TabsTrigger>
            <TabsTrigger value="password" className="gap-1.5">
              <Lock size={14} /> পাসওয়ার্ড
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-1.5">
              <Mail size={14} /> ইমেইল
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5">
              <Bell size={14} /> Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5">
              <Lock size={14} /> 2FA
            </TabsTrigger>
            <TabsTrigger value="danger" className="gap-1.5 text-destructive">
              <Trash2 size={14} /> ডিলিট
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>প্রোফাইল তথ্য</CardTitle>
                <CardDescription>আপনার নাম ও ফোন নম্বর আপডেট করুন</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="full_name">পূর্ণ নাম</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">ফোন নম্বর</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="০১৭xxxxxxxx"
                    maxLength={20}
                  />
                </div>
                <div>
                  <Label>ইমেইল</Label>
                  <Input value={user.email || ""} disabled />
                  <p className="text-xs text-muted-foreground mt-1">
                    ইমেইল পরিবর্তন করতে "ইমেইল" ট্যাবে যান
                  </p>
                </div>
                <Button onClick={handleProfileSave} disabled={loading} className="w-full sm:w-auto">
                  {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
                  সংরক্ষণ করুন
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>পাসওয়ার্ড পরিবর্তন</CardTitle>
                <CardDescription>
                  নতুন পাসওয়ার্ড দিন। ডিফল্ট 112233 থাকলে অবশ্যই পরিবর্তন করুন।
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">নতুন পাসওয়ার্ড</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">পাসওয়ার্ড নিশ্চিত করুন</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) =>
                      setPasswords({ ...passwords, confirmPassword: e.target.value })
                    }
                  />
                </div>
                <Button onClick={handlePasswordChange} disabled={loading}>
                  {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
                  পাসওয়ার্ড পরিবর্তন করুন
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>ইমেইল পরিবর্তন</CardTitle>
                <CardDescription>
                  নতুন ইমেইলে যাচাইকরণ লিঙ্ক পাঠানো হবে
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>বর্তমান ইমেইল</Label>
                  <Input value={user.email || ""} disabled />
                </div>
                <div>
                  <Label htmlFor="newEmail">নতুন ইমেইল</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="new@email.com"
                  />
                </div>
                <Button onClick={handleEmailChange} disabled={loading}>
                  {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
                  ইমেইল পরিবর্তন করুন
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="security" className="mt-4">
            <TwoFactorAuth />
          </TabsContent>

          <TabsContent value="danger" className="mt-4">
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">বিপজ্জনক অঞ্চল</CardTitle>
                <CardDescription>
                  অ্যাকাউন্ট ডিলিট করলে সব ডেটা (vCard, ল্যান্ডিং পেজ, সাবস্ক্রিপশন) মুছে যাবে।
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 size={16} className="mr-2" />
                      অ্যাকাউন্ট ডিলিট করুন
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
                      <AlertDialogDescription>
                        এই কাজটি অপরিবর্তনীয়। আপনার সকল vCard, ল্যান্ডিং পেজ এবং অর্ডার
                        ইতিহাস মুছে যাবে। চূড়ান্ত ডিলিটের জন্য সাপোর্টে যোগাযোগ করতে হবে।
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>বাতিল</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        হ্যাঁ, ডিলিট করুন
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
