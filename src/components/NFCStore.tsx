import { Button } from "@/components/ui/button";
import { CreditCard, Sparkles, Crown } from "lucide-react";

const nfcCards = [
  {
    name: "Silver",
    price: "৳719",
    originalPrice: "৳999",
    image: "silver",
    features: ["Basic NFC Chip", "Standard Design", "1 Year Warranty", "Free Shipping"],
    icon: CreditCard,
    gradient: "from-gray-300 to-gray-400",
  },
  {
    name: "Gold",
    price: "৳1,499",
    originalPrice: "৳1,999",
    image: "gold",
    features: ["Premium NFC Chip", "Metallic Finish", "2 Year Warranty", "Express Shipping", "Custom Logo"],
    icon: Sparkles,
    gradient: "from-yellow-400 to-amber-500",
    popular: true,
  },
  {
    name: "Premium",
    price: "৳5,999",
    originalPrice: "৳7,999",
    image: "premium",
    features: ["Advanced NFC Chip", "Luxury Metal Card", "Lifetime Warranty", "Priority Support", "Custom Design", "VIP Access"],
    icon: Crown,
    gradient: "from-primary to-teal-400",
  },
];

export function NFCStore() {
  return (
    <section id="nfc-store" className="section-padding bg-background">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Physical{" "}
            <span className="gradient-text">NFC Cards</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Upgrade your networking with our premium physical NFC business cards. Tap and share instantly.
          </p>
        </div>
        
        {/* NFC Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {nfcCards.map((card, index) => (
            <div
              key={card.name}
              className={`relative rounded-3xl overflow-hidden transition-all duration-300 ${
                card.popular
                  ? "ring-2 ring-secondary shadow-2xl shadow-secondary/20 scale-105"
                  : "border border-border hover:border-primary/30 hover:shadow-xl"
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Popular Badge */}
              {card.popular && (
                <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-full">
                  Best Seller
                </div>
              )}
              
              {/* Card Preview */}
              <div className={`relative h-48 bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                <div className="relative">
                  {/* Card mockup */}
                  <div className="w-64 h-40 bg-foreground/10 backdrop-blur-sm rounded-2xl border border-primary-foreground/20 flex items-center justify-center shadow-xl">
                    <div className="text-center text-primary-foreground">
                      <card.icon size={32} className="mx-auto mb-2" />
                      <span className="text-lg font-bold">{card.name}</span>
                    </div>
                  </div>
                  {/* NFC waves */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 border-2 border-primary-foreground/50 rounded-full animate-ping" />
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6 bg-card">
                <h3 className="text-xl font-bold text-foreground mb-2">{card.name} Card</h3>
                
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold text-foreground">{card.price}</span>
                  <span className="text-lg text-muted-foreground line-through">{card.originalPrice}</span>
                </div>
                
                <ul className="space-y-3 mb-6">
                  {card.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button
                  className="w-full font-semibold"
                  variant={card.popular ? "secondary" : "outline"}
                  size="lg"
                >
                  Order Now
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Benefits */}
        <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Free Shipping", desc: "On all orders" },
            { title: "Easy Returns", desc: "30-day guarantee" },
            { title: "Secure Payment", desc: "SSL encrypted" },
            { title: "Fast Delivery", desc: "2-3 business days" },
          ].map((benefit) => (
            <div key={benefit.title} className="text-center p-6 bg-card rounded-2xl border border-border">
              <h4 className="font-bold text-foreground mb-1">{benefit.title}</h4>
              <p className="text-sm text-muted-foreground">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
