import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Users, CreditCard, Shield, AlertTriangle, Scale, RefreshCw, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-12">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          হোমপেইজে ফিরে যান
        </Link>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            সেবার শর্তাবলী
          </h1>
          <p className="text-muted-foreground mb-2">
            Times Digital সেবা ব্যবহারের নিয়ম ও শর্তাবলী
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            সর্বশেষ আপডেট: জানুয়ারী ২০২৬
          </p>

          {/* Agreement */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                চুক্তি গ্রহণ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                Times Digital ("প্ল্যাটফর্ম") ব্যবহার করার মাধ্যমে আপনি এই সেবার শর্তাবলী 
                মেনে নিতে সম্মত হচ্ছেন। যদি আপনি এই শর্তাবলীর সাথে একমত না হন, তাহলে 
                অনুগ্রহ করে আমাদের সেবা ব্যবহার করবেন না।
              </p>
            </CardContent>
          </Card>

          {/* Account */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                অ্যাকাউন্ট
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>আপনার অ্যাকাউন্ট সম্পর্কে:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>সঠিক ও আপডেট তথ্য প্রদান করতে হবে</li>
                <li>পাসওয়ার্ড গোপনীয় রাখতে হবে</li>
                <li>অ্যাকাউন্টের সকল কার্যকলাপের জন্য আপনি দায়ী</li>
                <li>অননুমোদিত ব্যবহার সন্দেহ হলে অবিলম্বে জানাতে হবে</li>
                <li>১৮ বছরের কম বয়সীরা অভিভাবকের সম্মতি ছাড়া ব্যবহার করতে পারবে না</li>
              </ul>
            </CardContent>
          </Card>

          {/* Services */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-primary" />
                সেবা ও সাবস্ক্রিপশন
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">ডিজিটাল সেবা:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>ডিজিটাল বিজনেস কার্ড তৈরি ও হোস্টিং</li>
                  <li>ল্যান্ডিং পেইজ বিল্ডার</li>
                  <li>QR কোড জেনারেশন</li>
                  <li>এনালিটিক্স ও রিপোর্টিং</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">সাবস্ক্রিপশন প্ল্যান:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Basic: ১টি ডিজিটাল কার্ড + ১টি ল্যান্ডিং পেইজ</li>
                  <li>Pro: ৩টি ডিজিটাল কার্ড + ২টি ল্যান্ডিং পেইজ</li>
                  <li>Business: ৭টি ডিজিটাল কার্ড + ৪টি ল্যান্ডিং পেইজ</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">NFC কার্ড:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>ফিজিক্যাল NFC কার্ড আলাদাভাবে কেনা যায়</li>
                  <li>ডেলিভারি চার্জ প্রযোজ্য</li>
                  <li>ওয়ারেন্টি: উৎপাদন ত্রুটির জন্য ৬ মাস</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-primary" />
                পেমেন্ট
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <ul className="list-disc list-inside space-y-1">
                <li>সকল মূল্য বাংলাদেশি টাকায় (BDT)</li>
                <li>পেমেন্ট: bKash, Nagad, Rocket, ব্যাংক ট্রান্সফার</li>
                <li>পেমেন্ট অ্যাডমিন ভেরিফিকেশন সাপেক্ষে</li>
                <li>ভুল পেমেন্ট তথ্যে সেবা বিলম্বিত হতে পারে</li>
                <li>রিফান্ড পলিসি অনুযায়ী রিফান্ড প্রযোজ্য</li>
              </ul>
            </CardContent>
          </Card>

          {/* Acceptable Use */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                গ্রহণযোগ্য ব্যবহার
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>আপনি নিম্নলিখিত কাজ করতে পারবেন না:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>অবৈধ, ক্ষতিকর বা আপত্তিকর কন্টেন্ট প্রকাশ</li>
                <li>অন্যের পরিচয় চুরি বা ছদ্মবেশ ধারণ</li>
                <li>স্প্যাম বা অযাচিত বার্তা পাঠানো</li>
                <li>সিস্টেমের নিরাপত্তা ভঙ্গ করার চেষ্টা</li>
                <li>কপিরাইট বা ট্রেডমার্ক লঙ্ঘন</li>
                <li>প্ল্যাটফর্মের অপব্যবহার</li>
              </ul>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-primary" />
                অ্যাকাউন্ট বাতিল
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>আমরা নিম্নলিখিত কারণে অ্যাকাউন্ট স্থগিত বা বাতিল করতে পারি:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>শর্তাবলী লঙ্ঘন</li>
                <li>অবৈধ কার্যকলাপ</li>
                <li>দীর্ঘদিন নিষ্ক্রিয় থাকা</li>
                <li>পেমেন্ট সমস্যা</li>
              </ul>
              <p className="mt-3">
                আপনি যেকোনো সময় আপনার অ্যাকাউন্ট বাতিল করতে পারেন। বাতিলের পর ডেটা 
                ৩০ দিন পর্যন্ত সংরক্ষিত থাকে।
              </p>
            </CardContent>
          </Card>

          {/* Liability */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Scale className="h-6 w-6 text-primary" />
                দায়বদ্ধতা
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <ul className="list-disc list-inside space-y-1">
                <li>সেবা "যেমন আছে" ভিত্তিতে প্রদান করা হয়</li>
                <li>সার্ভার ডাউনটাইম বা ডেটা ক্ষতির জন্য সীমিত দায়</li>
                <li>থার্ড পার্টি সার্ভিসের জন্য দায়ী নই</li>
                <li>সর্বোচ্চ দায় পরিশোধিত সাবস্ক্রিপশন ফি পর্যন্ত</li>
              </ul>
            </CardContent>
          </Card>

          {/* Changes */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <RefreshCw className="h-6 w-6 text-primary" />
                শর্তাবলী পরিবর্তন
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                আমরা সময়ে সময়ে এই শর্তাবলী আপডেট করতে পারি। গুরুত্বপূর্ণ পরিবর্তনের 
                ক্ষেত্রে আমরা ইমেইল বা প্ল্যাটফর্মে নোটিফিকেশন দেব।
              </p>
              <p>
                পরিবর্তনের পর সেবা ব্যবহার অব্যাহত রাখলে আপনি নতুন শর্তাবলী মেনে 
                নিচ্ছেন বলে ধরে নেওয়া হবে।
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Mail className="h-6 w-6 text-primary" />
                যোগাযোগ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                এই শর্তাবলী সম্পর্কে প্রশ্ন থাকলে যোগাযোগ করুন:
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>ইমেইল:</strong> support@timescard.com</p>
                <p><strong>WhatsApp:</strong> 01815726006</p>
                <p><strong>ঠিকানা:</strong> Times Digital, Dhaka, Bangladesh</p>
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link 
                  to="/refund-policy"
                  className="text-primary hover:underline"
                >
                  রিফান্ড পলিসি দেখুন →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
