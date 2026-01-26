import { motion } from 'framer-motion';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Phone, Mail, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function RefundPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-orange-50/30">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-50">
        <div className="container-custom flex items-center justify-between h-16">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            <span>ফিরে যান</span>
          </button>
        </div>
      </header>

      <main className="container-custom py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-foreground mb-4 text-center">
            রিফান্ড পলিসি
          </h1>
          <p className="text-center text-muted-foreground mb-12">
            Times Digital-এর রিফান্ড ও ফেরত নীতিমালা
          </p>

          {/* Quick Summary */}
          <div className="bg-card rounded-2xl p-6 border border-border mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock className="text-primary" size={24} />
              সংক্ষিপ্ত বিবরণ
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <CheckCircle className="text-green-600 mx-auto mb-2" size={32} />
                <p className="font-bold text-green-700">৩-৫ কার্যদিবস</p>
                <p className="text-sm text-green-600">রিফান্ড প্রক্রিয়াকরণ সময়</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <Clock className="text-blue-600 mx-auto mb-2" size={32} />
                <p className="font-bold text-blue-700">৭ দিনের মধ্যে</p>
                <p className="text-sm text-blue-600">রিফান্ড অনুরোধের সময়সীমা</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                <AlertCircle className="text-orange-600 mx-auto mb-2" size={32} />
                <p className="font-bold text-orange-700">সম্পূর্ণ রিফান্ড</p>
                <p className="text-sm text-orange-600">পেমেন্ট প্রত্যাখ্যাত হলে</p>
              </div>
            </div>
          </div>

          {/* Subscription Refund Policy */}
          <div className="bg-card rounded-2xl p-6 border border-border mb-6">
            <h2 className="text-xl font-bold text-foreground mb-4">📦 সাবস্ক্রিপশন রিফান্ড</h2>
            <div className="space-y-4 text-muted-foreground">
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-foreground">✅ সম্পূর্ণ রিফান্ড পাবেন যদি:</h3>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>পেমেন্ট প্রত্যাখ্যাত হয়েছে কিন্তু টাকা কেটে গেছে</li>
                  <li>ডুপ্লিকেট পেমেন্ট হয়ে গেছে</li>
                  <li>সার্ভিস ৭ দিনের মধ্যে ব্যবহার করেননি এবং অনুরোধ করেছেন</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="font-semibold text-foreground">⚠️ আংশিক রিফান্ড পাবেন যদি:</h3>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>৭ দিনের পরে কিন্তু ৩০ দিনের মধ্যে অনুরোধ করেছেন</li>
                  <li>সার্ভিস ব্যবহারের হার অনুযায়ী প্রযোজ্য অংশ কেটে রিফান্ড করা হবে</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-semibold text-foreground">❌ রিফান্ড প্রযোজ্য নয় যদি:</h3>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>৩০ দিনের বেশি সময় পার হয়ে গেছে</li>
                  <li>সম্পূর্ণ মেয়াদ শেষ হয়ে গেছে</li>
                  <li>নিয়মাবলী লঙ্ঘনের কারণে অ্যাকাউন্ট বন্ধ করা হয়েছে</li>
                </ul>
              </div>
            </div>
          </div>

          {/* NFC Card Refund Policy */}
          <div className="bg-card rounded-2xl p-6 border border-border mb-6">
            <h2 className="text-xl font-bold text-foreground mb-4">💳 NFC কার্ড রিফান্ড</h2>
            <div className="space-y-4 text-muted-foreground">
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-foreground">✅ সম্পূর্ণ রিফান্ড পাবেন যদি:</h3>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>অর্ডার প্রসেস হওয়ার আগে বাতিল করেছেন</li>
                  <li>পণ্য ত্রুটিপূর্ণ অবস্থায় পেয়েছেন</li>
                  <li>ভুল পণ্য ডেলিভারি হয়েছে</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="font-semibold text-foreground">⚠️ এক্সচেঞ্জ/প্রতিস্থাপন:</h3>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>ডেলিভারির ৪৮ ঘণ্টার মধ্যে সমস্যা রিপোর্ট করতে হবে</li>
                  <li>পণ্যের ছবি/ভিডিও প্রমাণ হিসেবে দিতে হবে</li>
                  <li>ত্রুটিপূর্ণ পণ্য ফেরত দিতে হবে</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-semibold text-foreground">❌ রিফান্ড প্রযোজ্য নয় যদি:</h3>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>ব্যবহারকারীর দ্বারা ক্ষতিগ্রস্ত</li>
                  <li>৪৮ ঘণ্টার পরে সমস্যা রিপোর্ট করা হয়েছে</li>
                  <li>কাস্টমাইজড ডিজাইন অর্ডার (প্রিন্ট হওয়ার পর)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Refund Process */}
          <div className="bg-card rounded-2xl p-6 border border-border mb-6">
            <h2 className="text-xl font-bold text-foreground mb-4">📋 রিফান্ড প্রসেস</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <h3 className="font-semibold text-foreground">রিফান্ড অনুরোধ করুন</h3>
                  <p className="text-sm text-muted-foreground">ইমেইল, WhatsApp বা ফোনে আমাদের সাথে যোগাযোগ করুন। অর্ডার আইডি, ট্রান্সেকশন আইডি এবং সমস্যার বিবরণ দিন।</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">2</div>
                <div>
                  <h3 className="font-semibold text-foreground">যাচাইকরণ</h3>
                  <p className="text-sm text-muted-foreground">আমাদের টিম আপনার অনুরোধ যাচাই করবে (সাধারণত ২৪ ঘণ্টার মধ্যে)।</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">3</div>
                <div>
                  <h3 className="font-semibold text-foreground">অনুমোদন</h3>
                  <p className="text-sm text-muted-foreground">রিফান্ড অনুমোদিত হলে আপনাকে নিশ্চিতকরণ ইমেইল/SMS পাঠানো হবে।</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold shrink-0">4</div>
                <div>
                  <h3 className="font-semibold text-foreground">রিফান্ড প্রদান</h3>
                  <p className="text-sm text-muted-foreground">৩-৫ কার্যদিবসের মধ্যে আপনার পেমেন্ট মেথডে টাকা ফেরত দেওয়া হবে।</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact for Refund */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4 text-center">📞 রিফান্ডের জন্য যোগাযোগ</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <a 
                href="mailto:support@timescard.com" 
                className="flex items-center gap-3 bg-card rounded-xl p-4 border border-border hover:border-primary transition-colors"
              >
                <Mail className="text-primary" size={24} />
                <div>
                  <p className="font-semibold text-foreground text-sm">ইমেইল</p>
                  <p className="text-xs text-muted-foreground">support@timescard.com</p>
                </div>
              </a>
              
              <a 
                href="https://wa.me/8801815726006" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-card rounded-xl p-4 border border-border hover:border-green-500 transition-colors"
              >
                <MessageCircle className="text-green-600" size={24} />
                <div>
                  <p className="font-semibold text-foreground text-sm">WhatsApp</p>
                  <p className="text-xs text-muted-foreground">01815726006</p>
                </div>
              </a>
              
              <a 
                href="tel:+8801815726006" 
                className="flex items-center gap-3 bg-card rounded-xl p-4 border border-border hover:border-primary transition-colors"
              >
                <Phone className="text-primary" size={24} />
                <div>
                  <p className="font-semibold text-foreground text-sm">ফোন</p>
                  <p className="text-xs text-muted-foreground">01815726006</p>
                </div>
              </a>
            </div>
            
            <p className="text-center text-sm text-muted-foreground mt-6">
              সার্ভিস টাইম: সকাল ১০টা - রাত ১০টা (শুক্রবার ছাড়া)
            </p>
          </div>

          {/* Back Button */}
          <div className="text-center mt-8">
            <Button onClick={() => navigate('/')} variant="secondary">
              হোমে ফিরে যান
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
