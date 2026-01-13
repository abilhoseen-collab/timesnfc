import { Star, Quote, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useHomeContent } from "@/hooks/useHomeContent";

const defaultTestimonials = [
  {
    name: "Rahim Ahmed",
    role: "CEO, TechBD Solutions",
    content: "Times Card has completely transformed how I network. The NFC technology is seamless and professional. I've made countless connections just by tapping my card!",
    rating: 5,
    avatar: "RA",
  },
  {
    name: "Fatima Khan",
    role: "Freelance Designer",
    content: "As a freelancer, first impressions matter. My digital business card from Times Digital always impresses clients. The analytics feature helps me track engagement too.",
    rating: 5,
    avatar: "FK",
  },
  {
    name: "Mohammad Hasan",
    role: "Real Estate Agent",
    content: "I've distributed hundreds of paper cards before. Now with one NFC card, I save money and the environment. My clients love the modern approach!",
    rating: 5,
    avatar: "MH",
  },
  {
    name: "Sarah Islam",
    role: "Marketing Director",
    content: "The templates are beautiful and professional. Setting up our entire team took less than an hour. The analytics dashboard gives us valuable insights into networking ROI.",
    rating: 5,
    avatar: "SI",
  },
  {
    name: "Kamal Uddin",
    role: "Startup Founder",
    content: "We integrated Times Card across our whole startup. The custom branding options and PWA support make it feel like our own app. Highly recommended!",
    rating: 5,
    avatar: "KU",
  },
  {
    name: "Nusrat Jahan",
    role: "Doctor, City Hospital",
    content: "The medical template is perfect for healthcare professionals. My patients can easily save my contact info and access appointment booking. Very efficient!",
    rating: 5,
    avatar: "NJ",
  },
];

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

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5 },
  },
};

export function Testimonials() {
  const { section, loading, isVisible } = useHomeContent('testimonials');

  if (!isVisible) return null;

  if (loading) {
    return (
      <section className="section-padding bg-background">
        <div className="container-custom flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </section>
    );
  }

  const title = section?.title || "What Our Users Say";
  const subtitle = section?.subtitle || "Join thousands of satisfied professionals who trust Times Digital for their networking needs.";
  const testimonials = section?.content?.testimonials || defaultTestimonials;

  return (
    <section className="section-padding bg-background overflow-hidden">
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
            {title.split(' ').slice(0, -2).join(' ')}{" "}
            <span className="gradient-text">{title.split(' ').slice(-2).join(' ')}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {subtitle}
          </p>
        </motion.div>
        
        {/* Testimonials Grid */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {testimonials.map((testimonial: any, index: number) => (
            <motion.div
              key={testimonial.name + index}
              variants={cardVariants}
              className="group relative bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300"
              whileHover={{ 
                y: -8, 
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
                transition: { duration: 0.3 } 
              }}
            >
              {/* Quote Icon */}
              <motion.div 
                className="absolute top-6 right-6 text-primary/10"
                initial={{ rotate: 0 }}
                whileHover={{ rotate: 15, scale: 1.2 }}
                transition={{ duration: 0.3 }}
              >
                <Quote size={40} />
              </motion.div>
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating || 5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.05, duration: 0.3, type: "spring" }}
                  >
                    <Star size={16} className="fill-secondary text-secondary" />
                  </motion.div>
                ))}
              </div>
              
              {/* Content */}
              <p className="text-muted-foreground leading-relaxed mb-6 relative z-10">
                "{testimonial.content}"
              </p>
              
              {/* Author */}
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-primary-foreground font-bold text-sm"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  {testimonial.avatar || testimonial.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </motion.div>
                <div>
                  <h4 className="font-bold text-foreground">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
