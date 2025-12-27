import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

// Import template images
import freelancerImg from "@/assets/templates/freelancer.png";
import doctorImg from "@/assets/templates/doctor.png";
import restaurantImg from "@/assets/templates/restaurant.png";
import realestateImg from "@/assets/templates/realestate.png";
import fitnessImg from "@/assets/templates/fitness.png";
import photographyImg from "@/assets/templates/photography.png";
import lawfirmImg from "@/assets/templates/lawfirm.png";
import cafeImg from "@/assets/templates/cafe.png";
import salonImg from "@/assets/templates/salon.png";
import constructionImg from "@/assets/templates/construction.png";
import eventplannerImg from "@/assets/templates/eventplanner.png";
import techStartupImg from "@/assets/templates/tech-startup.png";

const templates = [
  { name: "Freelancer", category: "Professional", image: freelancerImg },
  { name: "Doctor", category: "Medical", image: doctorImg },
  { name: "Restaurant", category: "Food", image: restaurantImg },
  { name: "Real Estate", category: "Business", image: realestateImg },
  { name: "Fitness", category: "Health", image: fitnessImg },
  { name: "Photography", category: "Creative", image: photographyImg },
  { name: "Law Firm", category: "Professional", image: lawfirmImg },
  { name: "Cafe", category: "Food", image: cafeImg },
  { name: "Salon", category: "Beauty", image: salonImg },
  { name: "Construction", category: "Business", image: constructionImg },
  { name: "Event Planner", category: "Services", image: eventplannerImg },
  { name: "Tech Startup", category: "Technology", image: techStartupImg },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4 },
  },
};

export function Templates() {
  return (
    <section id="templates" className="section-padding bg-background">
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
            Explore Our{" "}
            <span className="gradient-text">Templates</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose from our professionally designed business card templates tailored for various industries.
          </p>
        </motion.div>
        
        {/* Templates Grid */}
        <motion.div 
          className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {templates.map((template) => (
            <motion.div
              key={template.name}
              variants={itemVariants}
              className="group relative bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition-all duration-300"
              whileHover={{ 
                y: -8, 
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
                transition: { duration: 0.3 } 
              }}
            >
              {/* Image */}
              <div className="relative aspect-[3/4] overflow-hidden">
                <motion.img
                  src={template.image}
                  alt={`${template.name} template`}
                  className="w-full h-full object-cover object-top"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.6 }}
                />
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                
                {/* Hover Button */}
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    whileHover={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Button variant="secondary" size="sm" className="font-semibold">
                      Preview
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <motion.span 
                  className="inline-block px-2 py-1 bg-accent text-accent-foreground text-xs font-medium rounded-md mb-2"
                  whileHover={{ scale: 1.05 }}
                >
                  {template.category}
                </motion.span>
                <h3 className="text-lg font-bold text-foreground capitalize">
                  {template.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Professionally crafted template
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        {/* View All Button */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button size="lg" variant="outline" className="font-medium px-8">
              View All Templates
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
