import { Button } from "@/components/ui/button";
import { Mail, Phone, Link as LinkIcon, QrCode, Play } from "lucide-react";
import { useState } from "react";

export function Hero() {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <section id="home" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-background to-orange-50/30" />
      
      {/* Animated Background Shapes */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float-delayed" />
      
      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left animate-slide-in-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-full text-accent-foreground text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
              IT Solution
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight mb-6">
              Create Your{" "}
              <span className="gradient-text">Business Card</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8">
              Transform your networking with professional digital business cards. Share your contact info instantly with NFC technology.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Button size="lg" variant="secondary" className="text-base font-semibold px-8 py-6">
                Start Free Trial
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-base font-medium px-8 py-6 border-primary/30 hover:bg-primary hover:text-primary-foreground"
                onClick={() => setShowVideo(true)}
              >
                <Play className="mr-2 h-5 w-5" />
                NFC Card Explained
              </Button>
            </div>
            
            {/* Stats */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-8">
              <div className="text-center lg:text-left">
                <div className="text-3xl sm:text-4xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl sm:text-4xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl sm:text-4xl font-bold text-primary">99%</div>
                <div className="text-sm text-muted-foreground">Satisfaction</div>
              </div>
            </div>
          </div>
          
          {/* Right Content - vCard Preview */}
          <div className="relative flex justify-center animate-slide-in-right">
            {/* Card Container */}
            <div className="relative w-full max-w-sm">
              {/* Main Card */}
              <div className="glass-card rounded-3xl p-8 shadow-xl animate-float">
                {/* Profile Section */}
                <div className="flex flex-col items-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-primary-foreground text-2xl font-bold mb-4">
                    JD
                  </div>
                  <h3 className="text-xl font-bold text-foreground">John Doe</h3>
                  <p className="text-muted-foreground">Senior Developer</p>
                  <p className="text-sm text-muted-foreground">Tech Solutions Inc.</p>
                </div>
                
                {/* Contact Icons */}
                <div className="flex justify-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                    <Mail size={20} />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                    <Phone size={20} />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                    <LinkIcon size={20} />
                  </div>
                </div>
                
                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="p-3 bg-card rounded-xl shadow-inner border border-border">
                    <QrCode size={80} className="text-primary" />
                  </div>
                </div>
              </div>
              
              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-secondary/30 animate-bounce-subtle">
                <span className="text-secondary-foreground font-bold text-xs text-center leading-tight">NFC<br/>Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Video Modal */}
      {showVideo && (
        <div 
          className="fixed inset-0 bg-foreground/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowVideo(false)}
        >
          <div className="bg-card rounded-2xl p-6 max-w-2xl w-full shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-foreground">NFC Business Cards</h3>
              <button 
                onClick={() => setShowVideo(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
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
          </div>
        </div>
      )}
    </section>
  );
}
