import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  LifeBuoy,
  Plus,
  Loader2,
  MessageSquare,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  status: string;
  admin_reply: string | null;
  created_at: string;
  replied_at: string | null;
}

const ticketSchema = z.object({
  subject: z.string().trim().min(3, "বিষয় কমপক্ষে ৩ অক্ষর").max(150, "বিষয় খুব বড়"),
  message: z.string().trim().min(10, "বার্তা কমপক্ষে ১০ অক্ষর").max(2000, "বার্তা খুব বড়"),
  category: z.enum(["general", "technical", "billing", "feature_request", "bug_report", "account"]),
  priority: z.enum(["low", "normal", "high", "urgent"]),
});

const categoryLabels: Record<string, string> = {
  general: "সাধারণ",
  technical: "টেকনিক্যাল",
  billing: "বিলিং",
  feature_request: "ফিচার রিকোয়েস্ট",
  bug_report: "বাগ রিপোর্ট",
  account: "অ্যাকাউন্ট",
};

const priorityLabels: Record<string, string> = {
  low: "কম",
  normal: "সাধারণ",
  high: "উচ্চ",
  urgent: "জরুরি",
};

const statusColors: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  in_progress: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  resolved: "bg-green-500/10 text-green-700 dark:text-green-400",
  closed: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
};

const faqs = [
  {
    q: "কীভাবে vCard তৈরি করব?",
    a: "ড্যাশবোর্ডে গিয়ে 'নতুন vCard' বাটনে ক্লিক করুন। সাবস্ক্রিপশন থাকতে হবে।",
  },
  {
    q: "পেমেন্ট কীভাবে করব?",
    a: "প্রাইসিং পেজ থেকে প্যাকেজ বেছে বিকাশ/নগদে পেমেন্ট করুন এবং ট্রানজেকশন আইডি দিন।",
  },
  {
    q: "পাসওয়ার্ড ভুলে গেছি, কী করব?",
    a: "লগইন পেজের 'পাসওয়ার্ড ভুলে গেছেন?' লিঙ্কে ক্লিক করে রিসেট করুন।",
  },
  {
    q: "অটো-জেনারেটেড পাসওয়ার্ড 112233 — কোথায় পরিবর্তন করব?",
    a: "অ্যাকাউন্ট সেটিংস → পাসওয়ার্ড ট্যাবে গিয়ে নতুন পাসওয়ার্ড দিন।",
  },
  {
    q: "সাবস্ক্রিপশন ক্যান্সেল কীভাবে করব?",
    a: "সাপোর্টে টিকিট খুলুন। আমরা ২৪ ঘণ্টার মধ্যে যোগাযোগ করব।",
  },
];

export default function Support() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    message: "",
    category: "general" as Ticket["category"] | string,
    priority: "normal" as Ticket["priority"] | string,
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchTickets();
  }, [user]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTickets((data || []) as Ticket[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const parsed = ticketSchema.safeParse(form);
    if (!parsed.success) {
      toast({
        title: "ভ্যালিডেশন এরর",
        description: parsed.error.errors[0]?.message,
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user!.id,
        ...parsed.data,
      });
      if (error) throw error;
      toast({ title: "সফল", description: "আপনার টিকিট তৈরি হয়েছে" });
      setForm({ subject: "", message: "", category: "general", priority: "normal" });
      setShowForm(false);
      fetchTickets();
    } catch (e) {
      toast({
        title: "সমস্যা হয়েছে",
        description: "টিকিট তৈরি করা যায়নি",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <Helmet>
        <title>সাপোর্ট ও সহায়তা | Times Digital</title>
        <meta name="description" content="সাপোর্ট টিকিট, FAQ ও যোগাযোগের তথ্য" />
      </Helmet>

      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4 gap-2">
          <ArrowLeft size={16} /> ড্যাশবোর্ডে ফিরুন
        </Button>

        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <LifeBuoy className="text-primary" size={28} />
              সাপোর্ট সেন্টার
            </h1>
            <p className="text-muted-foreground mt-1">আমরা সাহায্যের জন্য প্রস্তুত</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-1.5">
            <Plus size={16} /> নতুন টিকিট
          </Button>
        </div>

        {/* Contact Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ইমেইল</p>
                <p className="text-sm font-medium">support@timesdigital.com</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Phone size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ফোন/WhatsApp</p>
                <p className="text-sm font-medium">+৮৮০ ১৭xx-xxxxxx</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">সময়</p>
                <p className="text-sm font-medium">সকাল ৯টা — রাত ৯টা</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* New Ticket Form */}
        {showForm && (
          <Card className="mb-6 border-primary/30">
            <CardHeader>
              <CardTitle>নতুন সাপোর্ট টিকিট</CardTitle>
              <CardDescription>সমস্যার বিবরণ দিন, আমরা শীঘ্রই উত্তর দেব</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subject">বিষয়</Label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="সংক্ষেপে আপনার সমস্যা"
                  maxLength={150}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>ক্যাটেগরি</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>অগ্রাধিকার</Label>
                  <Select
                    value={form.priority}
                    onValueChange={(v) => setForm({ ...form, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="message">বিস্তারিত বার্তা</Label>
                <Textarea
                  id="message"
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="সমস্যাটি বিস্তারিতভাবে বর্ণনা করুন..."
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {form.message.length}/2000
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting && <Loader2 size={16} className="mr-2 animate-spin" />}
                  জমা দিন
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  বাতিল
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Tickets */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare size={20} className="text-primary" />
              আমার টিকিট
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : tickets.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                কোনো টিকিট নেই। সমস্যা হলে নতুন টিকিট খুলুন।
              </p>
            ) : (
              <div className="space-y-3">
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-lg border border-border hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground">{t.subject}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(t.created_at).toLocaleString("bn-BD")} •{" "}
                          {categoryLabels[t.category]} • {priorityLabels[t.priority]}
                        </p>
                      </div>
                      <Badge variant="outline" className={`${statusColors[t.status]} border-0`}>
                        {t.status === "open" && "খোলা"}
                        {t.status === "in_progress" && "চলমান"}
                        {t.status === "resolved" && "সমাধান হয়েছে"}
                        {t.status === "closed" && "বন্ধ"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{t.message}</p>
                    {t.admin_reply && (
                      <div className="mt-3 p-3 bg-primary/5 rounded-lg border-l-2 border-primary">
                        <div className="flex items-center gap-1.5 mb-1">
                          <CheckCircle2 size={12} className="text-primary" />
                          <span className="text-xs font-semibold text-primary">
                            সাপোর্ট টিমের উত্তর
                          </span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {t.admin_reply}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>সাধারণ জিজ্ঞাসা (FAQ)</CardTitle>
            <CardDescription>প্রায়শই জিজ্ঞাসিত প্রশ্নের উত্তর</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
