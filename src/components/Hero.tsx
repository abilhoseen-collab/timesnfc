import { Button } from "@/components/ui/button";
import { Mail, Phone, Link as LinkIcon, QrCode, Play } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Hero() {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <section id="home" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-background to-orange-50/30" />
      
      {/* Animated Background Shapes */}
      <motion.div 
        className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
        animate={{ 
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"
        animate={{ 
          y: [0, 20, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      
      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div 
            className="text-center lg:text-left"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-full text-accent-foreground text-sm font-medium mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <motion.span 
                className="w-2 h-2 bg-secondary rounded-full"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              IT Solution
            </motion.div>
            
            <motion.h1 
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Create Your{" "}
              <span className="gradient-text">Business Card</span>
            </motion.h1>
            
            <motion.p 
              className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              Transform your networking with professional digital business cards. Share your contact info instantly with NFC technology.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="secondary" className="text-base font-semibold px-8 py-6">
                  Start Free Trial
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-base font-medium px-8 py-6 border-primary/30 hover:bg-primary hover:text-primary-foreground"
                  onClick={() => setShowVideo(true)}
                >
                  <Play className="mr-2 h-5 w-5" />
                  NFC Card Explained
                </Button>
              </motion.div>
            </motion.div>
            
            {/* Stats */}
            <motion.div 
              className="flex flex-wrap justify-center lg:justify-start gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              {[
                { value: "10K+", label: "Active Users" },
                { value: "50+", label: "Countries" },
                { value: "99%", label: "Satisfaction" },
              ].map((stat, index) => (
                <motion.div 
                  key={stat.label}
                  className="text-center lg:text-left"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <div className="text-3xl sm:text-4xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
          
          {/* Right Content - vCard Preview */}
          <motion.div 
            className="relative flex justify-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          >
            {/* Card Container */}
            <div className="relative w-full max-w-sm">
              {/* Main Card */}
              <motion.div 
                className="glass-card rounded-3xl p-8 shadow-xl"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Profile Section */}
                <motion.div 
                  className="flex flex-col items-center mb-6"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <motion.div 
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-primary-foreground text-2xl font-bold mb-4"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    JD
                  </motion.div>
                  <h3 className="text-xl font-bold text-foreground">John Doe</h3>
                  <p className="text-muted-foreground">Senior Developer</p>
                  <p className="text-sm text-muted-foreground">Tech Solutions Inc.</p>
                </motion.div>
                
                {/* Contact Icons */}
                <div className="flex justify-center gap-4 mb-6">
                  {[Mail, Phone, LinkIcon].map((Icon, index) => (
                    <motion.div 
                      key={index}
                      className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
                      whileHover={{ scale: 1.15, rotate: 10 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Icon size={20} />
                    </motion.div>
                  ))}
                </div>
                
                {/* QR Code */}
                <motion.div 
                  className="flex justify-center"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.1, duration: 0.5, type: "spring" }}
                >
                  <motion.div 
                    className="p-3 bg-card rounded-xl shadow-inner border border-border"
                    whileHover={{ scale: 1.05 }}
                  >
                    <QrCode size={80} className="text-primary" />
                  </motion.div>
                </motion.div>
              </motion.div>
              
              {/* Floating Badge */}
              <motion.div 
                className="absolute -top-4 -right-4 w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-secondary/30"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1, y: [0, -5, 0] }}
                transition={{ 
                  opacity: { delay: 1.2, duration: 0.4 },
                  scale: { delay: 1.2, duration: 0.4, type: "spring" },
                  y: { delay: 1.6, duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                <span className="text-secondary-foreground font-bold text-xs text-center leading-tight">NFC<br/>Ready</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Video Modal */}
      <AnimatePresence>
        {showVideo && (
          <motion.div 
            className="fixed inset-0 bg-foreground/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowVideo(false)}
          >
            <motion.div 
              className="bg-card rounded-2xl p-6 max-w-2xl w-full shadow-2xl"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-foreground">NFC Business Cards</h3>
                <motion.button 
                  onClick={() => setShowVideo(false)}
                  className="text-muted-foreground hover:text-foreground"
                  whileHover={{ scale: 1.2, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ✕
                </motion.button>
              </div>
              <p className="text-muted-foreground mb-4">
                See how our NFC-enabled digital business cards work and revolutionize your networking experience.
              </p>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Play size={48} className="text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Video placeholder - Add your YouTube URL in admin settings</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
