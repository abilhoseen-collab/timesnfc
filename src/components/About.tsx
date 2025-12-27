import { Target, Users, Lightbulb, Globe } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Our Mission",
    description: "To revolutionize professional networking by making digital business cards accessible, eco-friendly, and impactful for everyone.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description: "We constantly push boundaries with cutting-edge NFC technology and AI-powered features to stay ahead of the curve.",
  },
  {
    icon: Users,
    title: "Community",
    description: "Building a global community of professionals who believe in sustainable, modern networking solutions.",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description: "Serving professionals in 50+ countries, connecting businesses across borders seamlessly.",
  },
];

const ecosystem = [
  { name: "Times Travel", desc: "Premium travel experiences" },
  { name: "Times IT", desc: "IT solutions & consulting" },
  { name: "Times Graphics", desc: "Creative design services" },
  { name: "Times Media", desc: "Digital marketing agency" },
];

export function About() {
  return (
    <section id="about" className="section-padding bg-card">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            About{" "}
            <span className="gradient-text">Times Business Card</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            We are passionate about transforming how professionals connect.
          </p>
        </div>
        
        {/* Story Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
              Empowering Professional Connections Since 2025
            </h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Founded by a team of networking enthusiasts and technology experts, Times Card was born from the frustration of outdated paper business cards. We envisioned a world where sharing contact information is instant, eco-friendly, and memorable.
            </p>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Today, we're proud to serve over 10,000 professionals across 50+ countries, helping them make lasting impressions in a digital-first world. Our platform combines cutting-edge NFC technology with beautiful design to create the ultimate networking tool.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-4 bg-background rounded-xl">
                <div className="text-2xl sm:text-3xl font-bold text-primary">10K+</div>
                <div className="text-xs text-muted-foreground">Active Users</div>
              </div>
              <div className="text-center p-4 bg-background rounded-xl">
                <div className="text-2xl sm:text-3xl font-bold text-secondary">50+</div>
                <div className="text-xs text-muted-foreground">Countries</div>
              </div>
              <div className="text-center p-4 bg-background rounded-xl">
                <div className="text-2xl sm:text-3xl font-bold text-primary">99%</div>
                <div className="text-xs text-muted-foreground">Satisfaction</div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="glass-card rounded-3xl p-8 lg:p-10">
              <div className="grid grid-cols-2 gap-4">
                {values.map((value, index) => (
                  <div
                    key={value.title}
                    className="p-4 bg-background rounded-xl text-center hover:shadow-lg transition-shadow"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="w-12 h-12 mx-auto rounded-xl bg-accent flex items-center justify-center text-primary mb-3">
                      <value.icon size={24} />
                    </div>
                    <h4 className="font-bold text-foreground text-sm mb-1">{value.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{value.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Sayem Group Ecosystem */}
        <div className="bg-gradient-to-br from-primary to-teal-600 rounded-3xl p-8 lg:p-12 text-primary-foreground">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              Part of Sayem Group Ecosystem
            </h3>
            <p className="text-primary-foreground/80">
              Times Digital is part of a larger corporate network dedicated to excellence in technology and services.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ecosystem.map((company) => (
              <div
                key={company.name}
                className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-primary-foreground/20 transition-colors"
              >
                <h4 className="font-bold text-lg mb-1">{company.name}</h4>
                <p className="text-sm text-primary-foreground/70">{company.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
