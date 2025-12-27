import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "৳0",
    period: "/month",
    description: "Perfect for individuals getting started",
    features: [
      "1 Business Card",
      "2 Team Members",
      "1GB Storage",
      "Basic Analytics",
      "QR Code Generation",
      "Email Support",
    ],
    popular: false,
    buttonText: "Get Started Free",
    buttonVariant: "outline" as const,
  },
  {
    name: "Professional",
    price: "৳99",
    period: "/month",
    description: "Best for growing professionals",
    features: [
      "5 Business Cards",
      "10 Team Members",
      "10GB Storage",
      "Advanced Analytics",
      "NFC Technology",
      "PWA Support",
      "Custom Domain",
      "Priority Support",
    ],
    popular: true,
    buttonText: "Start Free Trial",
    buttonVariant: "secondary" as const,
  },
  {
    name: "Premium",
    price: "৳150",
    period: "/month",
    description: "For enterprises and large teams",
    features: [
      "Unlimited Business Cards",
      "Unlimited Team Members",
      "100GB Storage",
      "AI Integration",
      "Password Protection",
      "Custom CSS/JS",
      "White Label",
      "Dedicated Support",
      "API Access",
    ],
    popular: false,
    buttonText: "Contact Sales",
    buttonVariant: "outline" as const,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="section-padding bg-card">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Simple,{" "}
            <span className="gradient-text">Transparent Pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose the perfect plan for your needs. Upgrade or downgrade at any time.
          </p>
        </div>
        
        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl p-8 transition-all duration-300 ${
                plan.popular
                  ? "bg-primary text-primary-foreground scale-105 shadow-2xl shadow-primary/30"
                  : "bg-background border border-border hover:border-primary/30 hover:shadow-xl"
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-secondary text-secondary-foreground text-sm font-semibold rounded-full flex items-center gap-1">
                  <Sparkles size={14} />
                  Most Popular
                </div>
              )}
              
              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className={`text-xl font-bold mb-2 ${plan.popular ? "text-primary-foreground" : "text-foreground"}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className={`text-4xl lg:text-5xl font-bold ${plan.popular ? "text-primary-foreground" : "text-foreground"}`}>
                    {plan.price}
                  </span>
                  <span className={plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-sm ${plan.popular ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
              </div>
              
              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      plan.popular ? "bg-primary-foreground/20" : "bg-accent"
                    }`}>
                      <Check size={14} className={plan.popular ? "text-primary-foreground" : "text-primary"} />
                    </div>
                    <span className={`text-sm ${plan.popular ? "text-primary-foreground/90" : "text-foreground"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              
              {/* Button */}
              <Button
                className={`w-full font-semibold ${
                  plan.popular
                    ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                    : plan.buttonVariant === "secondary"
                    ? ""
                    : "border-primary/30 hover:bg-primary hover:text-primary-foreground"
                }`}
                variant={plan.popular ? "default" : plan.buttonVariant}
                size="lg"
              >
                {plan.buttonText}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
