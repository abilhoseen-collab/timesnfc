import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useHomeContent } from "@/hooks/useHomeContent";

export function CTA() {
  const navigate = useNavigate();
  const { section, loading, isVisible } = useHomeContent('cta');

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (!isVisible) return null;

  if (loading) {
    return (
      <section className="section-padding bg-gradient-to-br from-primary via-teal-600 to-teal-700">
        <div className="container-custom flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary-foreground" size={32} />
        </div>
      </section>
    );
  }

  const content = section?.content || {};
  const badgeText = content.badge_text || "Limited Time Offer - 30% Off Premium";
  const title = section?.title || "Ready to Transform Your Networking?";
  const subtitle = section?.subtitle || "Join 10,000+ professionals who have already upgraded to digital business cards. Start free today and experience the future of networking.";
  const primaryButtonText = content.primary_button_text || "Start Free Trial";
  const secondaryButtonText = content.secondary_button_text || "View Demo";
  const trustBadges = content.trust_badges || [
    "No credit card required",
    "Free forever plan available",
    "Cancel anytime",
  ];

  return (
    <section className="section-padding bg-gradient-to-br from-primary via-teal-600 to-teal-700 relative overflow-hidden">
      {/* Background elements */}
      <motion.div 
        className="absolute top-0 left-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"
        animate={{ 
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-0 right-0 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl"
        animate={{ 
          x: [0, -30, 0],
          y: [0, 20, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      
      <div className="container-custom relative z-10">
        <motion.div 
          className="text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-foreground/10 backdrop-blur-sm rounded-full text-primary-foreground text-sm font-medium mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles size={16} className="text-secondary" />
            </motion.div>
            {badgeText}
          </motion.div>
          
          <motion.h2 
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {title}
          </motion.h2>
          
          <motion.p 
            className="text-lg text-primary-foreground/80 mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {subtitle}
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold text-base px-8 py-6 shadow-lg shadow-secondary/30"
                onClick={() => navigate('/auth')}
              >
                {primaryButtonText}
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="ml-2 h-5 w-5" />
                </motion.div>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-medium text-base px-8 py-6"
                onClick={() => scrollToSection('#templates')}
              >
                {secondaryButtonText}
              </Button>
            </motion.div>
          </motion.div>
          
          {/* Trust badges */}
          <motion.div 
            className="mt-12 flex flex-wrap justify-center gap-8 text-primary-foreground/60"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            {trustBadges.map((text: string, index: number) => (
              <motion.div 
                key={text}
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.05 }}
              >
                <Check className="w-5 h-5" />
                <span className="text-sm">{text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}