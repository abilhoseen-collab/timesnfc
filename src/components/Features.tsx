import { QrCode, Nfc, BarChart3, Zap, Users, Shield } from "lucide-react";

const features = [
  {
    icon: QrCode,
    title: "QR Code Generation",
    description: "Generate unique QR codes for instant contact sharing. Scannable from any smartphone.",
  },
  {
    icon: Nfc,
    title: "NFC Technology",
    description: "Tap-to-share functionality with NFC-enabled devices. No app required for recipients.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description: "Track views, clicks, and engagement metrics. Understand your networking impact.",
  },
  {
    icon: Zap,
    title: "Quick Setup",
    description: "Create your digital business card in under 5 minutes. No technical skills needed.",
  },
  {
    icon: Users,
    title: "Professional Network",
    description: "Join thousands of professionals using our platform for modern networking.",
  },
  {
    icon: Shield,
    title: "Trusted by Industry Leaders",
    description: "Secure, reliable, and trusted by businesses worldwide for professional connections.",
  },
];

export function Features() {
  return (
    <section id="features" className="section-padding bg-card">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Powerful Features for{" "}
            <span className="gradient-text">Modern Networking</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to create, share, and manage your digital business presence.
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-6 lg:p-8 bg-background rounded-2xl border border-border hover:border-primary/30 hover:shadow-xl transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center text-primary mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <feature.icon size={28} />
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
              
              {/* Hover accent */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
        
        {/* Why Choose Section */}
        <div className="mt-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
              Why Choose vCard?
            </h3>
            <p className="text-muted-foreground mb-8">
              We're not just another digital business card platform. Our solution is designed for professionals who value efficiency, style, and impact.
            </p>
            
            <div className="space-y-4">
              {[
                { stat: "10K+", label: "Active Users" },
                { stat: "99%", label: "Satisfaction Rate" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className="w-16 text-right">
                    <span className="text-2xl font-bold text-primary">{item.stat}</span>
                  </div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full gradient-teal rounded-full"
                      style={{ width: item.stat.includes("10") ? "85%" : "99%" }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-32">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div className="glass-card rounded-3xl p-8 lg:p-10">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center">
                  <Shield size={40} className="text-primary-foreground" />
                </div>
                <h4 className="text-xl font-bold text-foreground mb-3">Trusted by Industry Leaders</h4>
                <p className="text-muted-foreground mb-6">
                  Join the growing community of professionals who trust our platform for their digital networking needs.
                </p>
                <div className="flex justify-center gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">10K+</div>
                    <div className="text-xs text-muted-foreground">Active Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-secondary">99%</div>
                    <div className="text-xs text-muted-foreground">Satisfaction</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
