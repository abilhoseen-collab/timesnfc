import { QrCode, Nfc, BarChart3, Zap, Users, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useHomeContent } from "@/hooks/useHomeContent";

const defaultFeatures = [
  {
    icon: "QrCode",
    title: "QR Code Generation",
    description: "Generate unique QR codes for instant contact sharing. Scannable from any smartphone.",
  },
  {
    icon: "Nfc",
    title: "NFC Technology",
    description: "Tap-to-share functionality with NFC-enabled devices. No app required for recipients.",
  },
  {
    icon: "BarChart3",
    title: "Analytics & Insights",
    description: "Track views, clicks, and engagement metrics. Understand your networking impact.",
  },
  {
    icon: "Zap",
    title: "Quick Setup",
    description: "Create your digital business card in under 5 minutes. No technical skills needed.",
  },
  {
    icon: "Users",
    title: "Professional Network",
    description: "Join thousands of professionals using our platform for modern networking.",
  },
  {
    icon: "Shield",
    title: "Trusted by Industry Leaders",
    description: "Secure, reliable, and trusted by businesses worldwide for professional connections.",
  },
];

const iconMap: Record<string, React.ElementType> = {
  QrCode,
  Nfc,
  BarChart3,
  Zap,
  Users,
  Shield,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function Features() {
  const { section, isVisible } = useHomeContent('features');

  if (!isVisible) return null;

  const title = section?.title || "Powerful Features for Modern Networking";
  const subtitle = section?.subtitle || "Everything you need to create, share, and manage your digital business presence.";
  const features = section?.content?.features || defaultFeatures;

  return (
    <section id="features" className="section-padding bg-card">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div 
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {title.includes("Modern Networking") ? (
              <>
                {title.split("Modern Networking")[0]}
                <span className="gradient-text">Modern Networking</span>
              </>
            ) : (
              title
            )}
          </h2>
          <p className="text-lg text-muted-foreground">
            {subtitle}
          </p>
        </motion.div>
        
        {/* Features Grid */}
        <motion.div 
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature: any) => {
            const IconComponent = iconMap[feature.icon] || QrCode;
            return (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="group relative p-6 lg:p-8 bg-background rounded-2xl border border-border hover:border-primary/30 hover:shadow-xl transition-all duration-300"
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
              >
                {/* Icon */}
                <motion.div 
                  className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center text-primary mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  whileHover={{ rotate: 10, scale: 1.1 }}
                >
                  <IconComponent size={28} />
                </motion.div>
                
                {/* Content */}
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Hover accent */}
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary rounded-b-2xl"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            );
          })}
        </motion.div>
        
        {/* Why Choose Section */}
        <div className="mt-20 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
              Why Choose vCard?
            </h3>
            <p className="text-muted-foreground mb-8">
              We're not just another digital business card platform. Our solution is designed for professionals who value efficiency, style, and impact.
            </p>
            
            <div className="space-y-4">
              {[
                { stat: "10K+", label: "Active Users", width: "85%" },
                { stat: "99%", label: "Satisfaction Rate", width: "99%" },
              ].map((item, index) => (
                <motion.div 
                  key={item.label} 
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                >
                  <div className="w-16 text-right">
                    <span className="text-2xl font-bold text-primary">{item.stat}</span>
                  </div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full gradient-teal rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: item.width }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + index * 0.1, duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-32">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="glass-card rounded-3xl p-8 lg:p-10"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center">
                <motion.div 
                  className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Shield size={40} className="text-primary-foreground" />
                </motion.div>
                <h4 className="text-xl font-bold text-foreground mb-3">Trusted by Industry Leaders</h4>
                <p className="text-muted-foreground mb-6">
                  Join the growing community of professionals who trust our platform for their digital networking needs.
                </p>
                <div className="flex justify-center gap-6">
                  {[
                    { value: "10K+", label: "Active Users", color: "text-primary" },
                    { value: "99%", label: "Satisfaction", color: "text-secondary" },
                  ].map((stat, index) => (
                    <motion.div 
                      key={stat.label}
                      className="text-center"
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.5, type: "spring" }}
                    >
                      <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
