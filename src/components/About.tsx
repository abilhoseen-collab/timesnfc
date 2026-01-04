import { Target, Users, Lightbulb, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useHomeContent } from "@/hooks/useHomeContent";

const defaultValues = [
  {
    icon: "Target",
    title: "Our Mission",
    description: "To revolutionize professional networking by making digital business cards accessible, eco-friendly, and impactful for everyone.",
  },
  {
    icon: "Lightbulb",
    title: "Innovation",
    description: "We constantly push boundaries with cutting-edge NFC technology and AI-powered features to stay ahead of the curve.",
  },
  {
    icon: "Users",
    title: "Community",
    description: "Building a global community of professionals who believe in sustainable, modern networking solutions.",
  },
  {
    icon: "Globe",
    title: "Global Reach",
    description: "Serving professionals in 50+ countries, connecting businesses across borders seamlessly.",
  },
];

const defaultEcosystem = [
  { name: "Times Travel", desc: "Premium travel experiences" },
  { name: "Times IT", desc: "IT solutions & consulting" },
  { name: "Times Graphics", desc: "Creative design services" },
  { name: "Times Media", desc: "Digital marketing agency" },
];

const iconMap: Record<string, React.ElementType> = {
  Target,
  Users,
  Lightbulb,
  Globe,
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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function About() {
  const { section, isVisible } = useHomeContent('about');

  if (!isVisible) return null;

  const title = section?.title || "About Times Business Card";
  const subtitle = section?.subtitle || "We are passionate about transforming how professionals connect.";
  const content = section?.content || {};
  const values = content.values || defaultValues;
  const ecosystem = content.ecosystem || defaultEcosystem;
  const story = content.story || {
    heading: "Empowering Professional Connections Since 2025",
    paragraph1: "Founded by a team of networking enthusiasts and technology experts, Times Card was born from the frustration of outdated paper business cards. We envisioned a world where sharing contact information is instant, eco-friendly, and memorable.",
    paragraph2: "Today, we're proud to serve over 10,000 professionals across 50+ countries, helping them make lasting impressions in a digital-first world. Our platform combines cutting-edge NFC technology with beautiful design to create the ultimate networking tool.",
  };

  return (
    <section id="about" className="section-padding bg-card">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {title.includes("Times Business Card") ? (
              <>
                About{" "}
                <span className="gradient-text">Times Business Card</span>
              </>
            ) : (
              title
            )}
          </h2>
          <p className="text-lg text-muted-foreground">
            {subtitle}
          </p>
        </motion.div>
        
        {/* Story Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
              {story.heading}
            </h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {story.paragraph1}
            </p>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {story.paragraph2}
            </p>
            
            {/* Stats */}
            <motion.div 
              className="grid grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                { value: "10K+", label: "Active Users", color: "text-primary" },
                { value: "50+", label: "Countries", color: "text-secondary" },
                { value: "99%", label: "Satisfaction", color: "text-primary" },
              ].map((stat, index) => (
                <motion.div 
                  key={stat.label}
                  className="text-center p-4 bg-background rounded-xl"
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <motion.div 
                    className={`text-2xl sm:text-3xl font-bold ${stat.color}`}
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.5, type: "spring" }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
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
              <motion.div 
                className="grid grid-cols-2 gap-4"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {values.map((value: any) => {
                  const IconComponent = iconMap[value.icon] || Target;
                  return (
                    <motion.div
                      key={value.title}
                      className="p-4 bg-background rounded-xl text-center hover:shadow-lg transition-shadow"
                      variants={itemVariants}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                      <motion.div 
                        className="w-12 h-12 mx-auto rounded-xl bg-accent flex items-center justify-center text-primary mb-3"
                        whileHover={{ rotate: 10, scale: 1.1 }}
                      >
                        <IconComponent size={24} />
                      </motion.div>
                      <h4 className="font-bold text-foreground text-sm mb-1">{value.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{value.description}</p>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Sayem Group Ecosystem */}
        <motion.div 
          className="bg-gradient-to-br from-primary to-teal-600 rounded-3xl p-8 lg:p-12 text-primary-foreground"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="text-center max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              Part of Sayem Group Ecosystem
            </h3>
            <p className="text-primary-foreground/80">
              Times Digital is part of a larger corporate network dedicated to excellence in technology and services.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {ecosystem.map((company: any) => (
              <motion.div
                key={company.name}
                className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-primary-foreground/20 transition-colors"
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5, transition: { duration: 0.2 } }}
              >
                <h4 className="font-bold text-lg mb-1">{company.name}</h4>
                <p className="text-sm text-primary-foreground/70">{company.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
