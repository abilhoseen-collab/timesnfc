import { Link } from "react-router-dom";
import { ArrowLeft, Truck, Clock, MapPin, Package, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ShippingPolicy = () => {
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
            শিপিং পলিসি
          </h1>
          <p className="text-muted-foreground mb-8">
            NFC কার্ড ডেলিভারি সংক্রান্ত সকল তথ্য
          </p>

          {/* Delivery Time */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-primary" />
                ডেলিভারি সময়
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">ঢাকার ভিতরে</h4>
                  <p className="text-2xl font-bold text-primary">২-৩ কার্যদিবস</p>
                  <p className="text-sm text-muted-foreground mt-1">অর্ডার কনফার্মেশনের পর থেকে</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">ঢাকার বাইরে</h4>
                  <p className="text-2xl font-bold text-primary">৩-৫ কার্যদিবস</p>
                  <p className="text-sm text-muted-foreground mt-1">অর্ডার কনফার্মেশনের পর থেকে</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                * শুক্রবার ও সরকারি ছুটির দিন কার্যদিবস হিসেবে গণনা করা হয় না।
              </p>
            </CardContent>
          </Card>

          {/* Delivery Charges */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-primary" />
                ডেলিভারি চার্জ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">এলাকা</th>
                      <th className="text-left py-3 px-4 font-semibold">চার্জ</th>
                      <th className="text-left py-3 px-4 font-semibold">বিশেষ অফার</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4">ঢাকার ভিতরে</td>
                      <td className="py-3 px-4 font-semibold text-primary">৳৬০</td>
                      <td className="py-3 px-4">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
                          ৳১০০০+ অর্ডারে ফ্রি
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">ঢাকার বাইরে (জেলা সদর)</td>
                      <td className="py-3 px-4 font-semibold text-primary">৳১২০</td>
                      <td className="py-3 px-4">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
                          ৳২০০০+ অর্ডারে ফ্রি
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">ঢাকার বাইরে (উপজেলা)</td>
                      <td className="py-3 px-4 font-semibold text-primary">৳১৫০</td>
                      <td className="py-3 px-4">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
                          ৳২৫০০+ অর্ডারে ফ্রি
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Areas */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <MapPin className="h-6 w-6 text-primary" />
                ডেলিভারি এলাকা
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">ঢাকা মেট্রোপলিটন এলাকা</h4>
                <p className="text-muted-foreground">
                  গুলশান, বনানী, ধানমন্ডি, মিরপুর, উত্তরা, মোহাম্মদপুর, বাড্ডা, রামপুরা, 
                  মালিবাগ, মগবাজার, শান্তিনগর, মতিঝিল, পুরান ঢাকা, সাভার, গাজীপুর, নারায়ণগঞ্জ সহ সকল এলাকা।
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">সারাদেশে ডেলিভারি</h4>
                <p className="text-muted-foreground">
                  বাংলাদেশের সকল ৬৪ জেলায় আমরা ডেলিভারি প্রদান করি। Sundorban Courier, SA Paribahan, 
                  এবং Pathao Courier এর মাধ্যমে আপনার পণ্য নিরাপদে পৌঁছে দেওয়া হয়।
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Package Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Package className="h-6 w-6 text-primary" />
                প্যাকেজিং
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                আমরা প্রতিটি NFC কার্ড যত্নসহকারে প্যাক করি যাতে ট্রানজিটে কোনো ক্ষতি না হয়।
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>প্রিমিয়াম প্রটেক্টিভ কার্ড স্লিভ</li>
                <li>বাবল র‍্যাপ প্রোটেকশন</li>
                <li>ব্র্যান্ডেড বক্স প্যাকেজিং</li>
                <li>ইউজার গাইড ও QR কোড ইনস্ট্রাকশন</li>
              </ul>
            </CardContent>
          </Card>

          {/* Tracking */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Truck className="h-6 w-6 text-primary" />
                অর্ডার ট্র্যাকিং
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                অর্ডার শিপ হওয়ার পর আপনি SMS এবং Email এর মাধ্যমে ট্র্যাকিং তথ্য পাবেন।
              </p>
              <div className="flex flex-wrap gap-3">
                <Link 
                  to="/track-order"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Truck className="h-4 w-4" />
                  অর্ডার ট্র্যাক করুন
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-3">সাহায্য দরকার?</h4>
              <p className="text-muted-foreground mb-4">
                শিপিং সংক্রান্ত যেকোনো প্রশ্নের জন্য আমাদের সাথে যোগাযোগ করুন:
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>ইমেইল:</strong> support@timescard.com</p>
                <p><strong>WhatsApp:</strong> 01815726006</p>
                <p><strong>সময়:</strong> সকাল ১০টা - রাত ৮টা (শুক্রবার বন্ধ)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy;
