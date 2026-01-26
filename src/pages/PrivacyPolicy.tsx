import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Eye, Lock, Database, Share2, Bell, Trash2, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPolicy = () => {
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
            প্রাইভেসি পলিসি
          </h1>
          <p className="text-muted-foreground mb-2">
            আপনার ব্যক্তিগত তথ্যের সুরক্ষা আমাদের প্রধান অগ্রাধিকার
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            সর্বশেষ আপডেট: জানুয়ারী ২০২৬
          </p>

          {/* Introduction */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                পরিচিতি
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                Times Digital ("আমরা", "আমাদের") এ আপনাকে স্বাগতম। এই প্রাইভেসি পলিসি 
                ব্যাখ্যা করে কীভাবে আমরা আপনার ব্যক্তিগত তথ্য সংগ্রহ, ব্যবহার, সংরক্ষণ 
                এবং সুরক্ষিত রাখি।
              </p>
              <p>
                আমাদের সেবা ব্যবহার করার মাধ্যমে আপনি এই পলিসির শর্তাবলী মেনে নিচ্ছেন।
              </p>
            </CardContent>
          </Card>

          {/* Data Collection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Database className="h-6 w-6 text-primary" />
                তথ্য সংগ্রহ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">আমরা যা সংগ্রহ করি:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>নাম, ইমেইল, ফোন নম্বর</li>
                  <li>ব্যবসায়িক তথ্য (কোম্পানি, পদবী)</li>
                  <li>প্রোফাইল ছবি ও কভার ইমেজ</li>
                  <li>সোশ্যাল মিডিয়া লিংক</li>
                  <li>পেমেন্ট তথ্য (ট্রানজেকশন আইডি)</li>
                  <li>শিপিং ঠিকানা</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">অটোমেটিক সংগ্রহ:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>IP ঠিকানা ও ব্রাউজার তথ্য</li>
                  <li>ডিভাইস তথ্য</li>
                  <li>পেইজ ভিউ ও ক্লিক ডেটা (এনালিটিক্স)</li>
                  <li>কুকিজ ও সেশন ডেটা</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Usage */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Eye className="h-6 w-6 text-primary" />
                তথ্য ব্যবহার
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3">আমরা আপনার তথ্য ব্যবহার করি:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>আপনার ডিজিটাল বিজনেস কার্ড তৈরি ও প্রদর্শন করতে</li>
                <li>অ্যাকাউন্ট পরিচালনা ও সেবা প্রদান করতে</li>
                <li>অর্ডার প্রসেস ও ডেলিভারি করতে</li>
                <li>কাস্টমার সাপোর্ট প্রদান করতে</li>
                <li>সেবা উন্নতি ও এনালিটিক্স বিশ্লেষণ করতে</li>
                <li>গুরুত্বপূর্ণ আপডেট ও নোটিফিকেশন পাঠাতে</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Share2 className="h-6 w-6 text-primary" />
                তথ্য শেয়ারিং
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>আমরা আপনার ব্যক্তিগত তথ্য তৃতীয় পক্ষের কাছে বিক্রি করি না।</p>
              <p>তবে নিম্নলিখিত ক্ষেত্রে তথ্য শেয়ার হতে পারে:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>ডেলিভারি সার্ভিস প্রোভাইডার (শিপিং এর জন্য)</li>
                <li>পেমেন্ট গেটওয়ে (লেনদেন প্রসেসিং)</li>
                <li>আইনি বাধ্যবাধকতা পূরণে</li>
                <li>আপনার সম্মতিতে</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Lock className="h-6 w-6 text-primary" />
                তথ্য সুরক্ষা
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>আমরা আপনার তথ্য সুরক্ষিত রাখতে নিম্নলিখিত ব্যবস্থা গ্রহণ করি:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>SSL/TLS এনক্রিপশন</li>
                <li>সিকিউর ডেটাবেস স্টোরেজ</li>
                <li>নিয়মিত সিকিউরিটি অডিট</li>
                <li>অ্যাক্সেস কন্ট্রোল ও অথেনটিকেশন</li>
                <li>Row Level Security (RLS) পলিসি</li>
              </ul>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Trash2 className="h-6 w-6 text-primary" />
                আপনার অধিকার
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>আপনার নিম্নলিখিত অধিকার রয়েছে:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>আপনার তথ্য দেখা ও ডাউনলোড করা</li>
                <li>তথ্য সংশোধন বা আপডেট করা</li>
                <li>অ্যাকাউন্ট ও সকল ডেটা মুছে ফেলা</li>
                <li>মার্কেটিং কমিউনিকেশন বন্ধ করা</li>
                <li>তথ্য প্রসেসিংয়ে আপত্তি জানানো</li>
              </ul>
              <p className="mt-3">
                এই অধিকার প্রয়োগ করতে support@timescard.com এ যোগাযোগ করুন।
              </p>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-primary" />
                কুকিজ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                আমরা কুকিজ ব্যবহার করি আপনার অভিজ্ঞতা উন্নত করতে, লগইন সেশন মনে রাখতে, 
                এবং সাইট ব্যবহার বিশ্লেষণ করতে।
              </p>
              <p>
                আপনি ব্রাউজার সেটিংস থেকে কুকিজ নিয়ন্ত্রণ করতে পারেন, তবে কিছু 
                ফিচার সঠিকভাবে কাজ নাও করতে পারে।
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
                এই প্রাইভেসি পলিসি সম্পর্কে প্রশ্ন থাকলে যোগাযোগ করুন:
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>ইমেইল:</strong> support@timescard.com</p>
                <p><strong>WhatsApp:</strong> 01815726006</p>
                <p><strong>ঠিকানা:</strong> Times Digital, Dhaka, Bangladesh</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
