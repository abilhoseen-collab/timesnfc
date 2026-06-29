import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, BookOpen, HelpCircle } from 'lucide-react';

interface FAQ { q: string; a: string; cat: string }

const FAQS: FAQ[] = [
  { cat: 'Getting Started', q: 'কীভাবে আমার প্রথম vCard বানাবো?', a: 'Dashboard থেকে "নতুন vCard" ক্লিক করুন → তথ্য পূরণ করুন → Save। আপনার পাবলিক লিঙ্ক তৈরি হয়ে যাবে।' },
  { cat: 'Getting Started', q: 'NFC কার্ড কীভাবে কাজ করে?', a: 'আপনার vCard লিঙ্ক NFC chip-এ write করা হয়। কেউ NFC কার্ডে ফোন ছোঁয়ালে তার ফোনে সরাসরি আপনার ডিজিটাল কার্ড খুলবে।' },
  { cat: 'Billing', q: 'কোন payment method সাপোর্ট করেন?', a: 'বর্তমানে bKash, Nagad ও Rocket-এর মাধ্যমে manual payment করা যায়। admin approval-এর পর subscription activate হয়।' },
  { cat: 'Billing', q: 'Upgrade করলে কী হয়?', a: 'বাকি সময়ের জন্য pro-rated অ্যাডজাস্টমেন্ট হবে। আপনি শুধু পার্থক্য পরিশোধ করবেন।' },
  { cat: 'Features', q: 'Custom domain কীভাবে যুক্ত করবো?', a: 'vCard Editor → Custom Domain section-এ গিয়ে আপনার domain লিখুন এবং প্রদত্ত DNS instruction অনুসরণ করুন।' },
  { cat: 'Features', q: 'Team-এ user invite করবো কীভাবে?', a: 'Teams page থেকে invite পাঠান → ইনভাইটি ইমেইল-এ লিঙ্ক পাবেন → Accept করার পর Team-এ যুক্ত হবেন।' },
  { cat: 'Features', q: 'Lead notification কোথায় সেট করবো?', a: 'Account Settings → Notifications tab থেকে email/push preferences কনফিগার করুন।' },
  { cat: 'Integrations', q: 'Zapier/Mailchimp/HubSpot কীভাবে কানেক্ট করবো?', a: 'vCard Editor → Integrations tab-এ যথাক্রমে webhook URL, API key বা token পেস্ট করুন।' },
  { cat: 'Troubleshooting', q: 'আমার vCard পাবলিক দেখাচ্ছে না কেন?', a: 'নিশ্চিত হোন subscription active আছে এবং vCard "Published" status-এ আছে।' },
  { cat: 'Troubleshooting', q: 'Image upload হচ্ছে না?', a: 'ফাইল 5MB-এর নিচে রাখুন এবং সাপোর্টেড format ব্যবহার করুন (JPG/PNG/WebP)।' },
];

export default function HelpCenter() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const cats = ['all', ...Array.from(new Set(FAQS.map((f) => f.cat)))];
  const filtered = FAQS.filter((f) => {
    const m = (cat === 'all' || f.cat === cat) && (!q || (f.q + f.a).toLowerCase().includes(q.toLowerCase()));
    return m;
  });

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Help Center — Times NFC</title></Helmet>
      <div className="container max-w-3xl mx-auto p-4 sm:p-6">
        <Link to="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Help Center</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="আপনার প্রশ্ন লিখুন..." className="pl-9" />
            </div>
            <div className="flex flex-wrap gap-2">
              {cats.map((c) => (
                <Badge key={c} variant={c === cat ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setCat(c)}>
                  {c === 'all' ? 'সব' : c}
                </Badge>
              ))}
            </div>
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">কোনো ফলাফল পাওয়া যায়নি</p>
              ) : filtered.map((f, i) => (
                <details key={i} className="border rounded-lg p-3 group">
                  <summary className="font-medium cursor-pointer flex items-start gap-2">
                    <HelpCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{f.q}</span>
                  </summary>
                  <p className="text-sm text-muted-foreground mt-2 ml-6 whitespace-pre-line">{f.a}</p>
                </details>
              ))}
            </div>
            <div className="pt-4 border-t text-center text-sm text-muted-foreground">
              উত্তর পাননি? <Link to="/support" className="text-primary hover:underline">Support টিকেট খুলুন</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
