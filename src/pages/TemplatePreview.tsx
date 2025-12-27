import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

// Template images
import freelancerImg from '@/assets/templates/freelancer.png';
import doctorImg from '@/assets/templates/doctor.png';
import restaurantImg from '@/assets/templates/restaurant.png';
import realestateImg from '@/assets/templates/realestate.png';
import fitnessImg from '@/assets/templates/fitness.png';
import photographyImg from '@/assets/templates/photography.png';
import lawfirmImg from '@/assets/templates/lawfirm.png';
import cafeImg from '@/assets/templates/cafe.png';
import salonImg from '@/assets/templates/salon.png';
import constructionImg from '@/assets/templates/construction.png';
import eventplannerImg from '@/assets/templates/eventplanner.png';
import techStartupImg from '@/assets/templates/tech-startup.png';

const templates = [
  { 
    id: "freelancer",
    name: "Freelancer", 
    category: "Professional", 
    image: freelancerImg,
    description: "Perfect for independent professionals, consultants, and solo entrepreneurs who want to make a strong first impression.",
    features: [
      "Clean, minimalist design",
      "Social media integration",
      "Portfolio showcase",
      "Contact form ready",
      "Mobile optimized"
    ],
    bestFor: ["Freelancers", "Consultants", "Coaches", "Writers"]
  },
  { 
    id: "doctor",
    name: "Doctor", 
    category: "Medical", 
    image: doctorImg,
    description: "Designed for healthcare professionals to build trust and share credentials with patients.",
    features: [
      "Professional medical layout",
      "Credentials display",
      "Appointment info",
      "Clinic location",
      "Emergency contact"
    ],
    bestFor: ["Doctors", "Dentists", "Therapists", "Healthcare Workers"]
  },
  { 
    id: "restaurant",
    name: "Restaurant", 
    category: "Food", 
    image: restaurantImg,
    description: "Showcase your restaurant with a beautiful design that highlights your cuisine and ambiance.",
    features: [
      "Menu highlights",
      "Reservation links",
      "Location & hours",
      "Social media feeds",
      "Photo gallery"
    ],
    bestFor: ["Restaurants", "Chefs", "Food Trucks", "Catering Services"]
  },
  { 
    id: "realestate",
    name: "Real Estate", 
    category: "Business", 
    image: realestateImg,
    description: "Help property professionals showcase listings and connect with potential clients.",
    features: [
      "Property showcase",
      "Contact integration",
      "Professional headshot",
      "Agency branding",
      "Quick call buttons"
    ],
    bestFor: ["Real Estate Agents", "Property Managers", "Brokers"]
  },
  { 
    id: "fitness",
    name: "Fitness", 
    category: "Health", 
    image: fitnessImg,
    description: "Dynamic design for fitness professionals to attract and engage clients.",
    features: [
      "Training programs",
      "Class schedules",
      "Transformation gallery",
      "Booking integration",
      "Social proof"
    ],
    bestFor: ["Personal Trainers", "Gym Owners", "Yoga Instructors", "Nutritionists"]
  },
  { 
    id: "photography",
    name: "Photography", 
    category: "Creative", 
    image: photographyImg,
    description: "Stunning visual layout to showcase your photography portfolio and creative work.",
    features: [
      "Portfolio gallery",
      "Before/after showcase",
      "Booking calendar",
      "Pricing packages",
      "Client testimonials"
    ],
    bestFor: ["Photographers", "Videographers", "Artists", "Designers"]
  },
  { 
    id: "lawfirm",
    name: "Law Firm", 
    category: "Professional", 
    image: lawfirmImg,
    description: "Authoritative design for legal professionals to build credibility and attract clients.",
    features: [
      "Practice areas",
      "Attorney profiles",
      "Case consultation",
      "Bar credentials",
      "Professional styling"
    ],
    bestFor: ["Lawyers", "Attorneys", "Legal Consultants", "Law Firms"]
  },
  { 
    id: "cafe",
    name: "Cafe", 
    category: "Food", 
    image: cafeImg,
    description: "Cozy and inviting design perfect for coffee shops and cafes.",
    features: [
      "Menu display",
      "Location & hours",
      "WiFi info",
      "Events calendar",
      "Loyalty program"
    ],
    bestFor: ["Cafes", "Coffee Shops", "Bakeries", "Tea Houses"]
  },
  { 
    id: "salon",
    name: "Salon", 
    category: "Beauty", 
    image: salonImg,
    description: "Elegant design for beauty professionals to showcase their services and style.",
    features: [
      "Service menu",
      "Booking integration",
      "Before/after gallery",
      "Stylist profiles",
      "Product showcase"
    ],
    bestFor: ["Hair Stylists", "Barbers", "Nail Technicians", "Makeup Artists"]
  },
  { 
    id: "construction",
    name: "Construction", 
    category: "Business", 
    image: constructionImg,
    description: "Robust design for construction and contracting professionals.",
    features: [
      "Project portfolio",
      "Service areas",
      "License & insurance",
      "Quote requests",
      "Testimonials"
    ],
    bestFor: ["Contractors", "Builders", "Architects", "Engineers"]
  },
  { 
    id: "eventplanner",
    name: "Event Planner", 
    category: "Services", 
    image: eventplannerImg,
    description: "Creative design for event planners to showcase their portfolio and services.",
    features: [
      "Event gallery",
      "Service packages",
      "Vendor network",
      "Consultation booking",
      "Client testimonials"
    ],
    bestFor: ["Event Planners", "Wedding Planners", "Party Organizers", "Corporate Events"]
  },
  { 
    id: "tech-startup",
    name: "Tech Startup", 
    category: "Technology", 
    image: techStartupImg,
    description: "Modern and innovative design for tech founders and startup professionals.",
    features: [
      "Product showcase",
      "Team profiles",
      "Investor contact",
      "Social links",
      "Newsletter signup"
    ],
    bestFor: ["Startup Founders", "Tech Executives", "Product Managers", "Developers"]
  }
];

export default function TemplatePreview() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  
  const template = templates.find(t => t.id === templateId);
  
  if (!template) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-orange-50/30 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Template Not Found</h1>
          <Button onClick={() => navigate('/')}>Go Back Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-orange-50/30">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <button
            onClick={() => window.close()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <img src={logo} alt="Logo" className="h-10 cursor-pointer" onClick={() => navigate('/')} />
          <Button onClick={() => navigate('/auth')} size="sm">
            Get Started
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Template Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="bg-card rounded-3xl overflow-hidden border border-border shadow-xl">
              <img 
                src={template.image} 
                alt={`${template.name} template preview`}
                className="w-full h-auto"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold shadow-lg">
              {template.category}
            </div>
          </motion.div>

          {/* Template Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className="inline-block px-3 py-1 bg-accent text-accent-foreground text-sm font-medium rounded-full mb-4">
              {template.category} Template
            </span>
            <h1 className="text-4xl font-bold text-foreground mb-4">{template.name}</h1>
            <p className="text-lg text-muted-foreground mb-8">{template.description}</p>

            {/* Features */}
            <div className="bg-card rounded-2xl border border-border p-6 mb-6">
              <h3 className="font-semibold text-foreground mb-4">Features Included</h3>
              <ul className="space-y-3">
                {template.features.map((feature, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-center gap-3 text-foreground"
                  >
                    <Check size={18} className="text-primary flex-shrink-0" />
                    {feature}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Best For */}
            <div className="bg-muted/50 rounded-2xl p-6 mb-8">
              <h3 className="font-semibold text-foreground mb-4">Best For</h3>
              <div className="flex flex-wrap gap-2">
                {template.bestFor.map((item, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-background border border-border rounded-full text-sm text-foreground"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="flex-1" onClick={() => navigate('/auth')}>
                Use This Template
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate('/#templates')}
              >
                <ExternalLink size={18} className="mr-2" />
                View All Templates
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Other Templates */}
        <section className="mt-20">
          <h2 className="text-2xl font-bold text-foreground mb-8">Other Templates You May Like</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates
              .filter(t => t.id !== template.id)
              .slice(0, 4)
              .map((t) => (
                <motion.div
                  key={t.id}
                  whileHover={{ y: -5 }}
                  className="bg-card rounded-xl overflow-hidden border border-border cursor-pointer"
                  onClick={() => {
                    window.open(`/template/${t.id}`, '_blank');
                  }}
                >
                  <div className="aspect-[3/4] overflow-hidden">
                    <img 
                      src={t.image} 
                      alt={t.name}
                      className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <span className="text-xs text-muted-foreground">{t.category}</span>
                    <h3 className="font-semibold text-foreground">{t.name}</h3>
                  </div>
                </motion.div>
              ))}
          </div>
        </section>
      </main>
    </div>
  );
}
