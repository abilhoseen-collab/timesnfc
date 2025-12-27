import { Button } from "@/components/ui/button";

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

export function Templates() {
  return (
    <section id="templates" className="section-padding bg-background">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Explore Our{" "}
            <span className="gradient-text">Templates</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose from our professionally designed business card templates tailored for various industries.
          </p>
        </div>
        
        {/* Templates Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {templates.map((template, index) => (
            <div
              key={template.name}
              className="group relative bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-xl transition-all duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Image */}
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={template.image}
                  alt={`${template.name} template`}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Hover Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button variant="secondary" size="sm" className="font-semibold">
                    Preview
                  </Button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <span className="inline-block px-2 py-1 bg-accent text-accent-foreground text-xs font-medium rounded-md mb-2">
                  {template.category}
                </span>
                <h3 className="text-lg font-bold text-foreground capitalize">
                  {template.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Professionally crafted template
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {/* View All Button */}
        <div className="text-center mt-12">
          <Button size="lg" variant="outline" className="font-medium px-8">
            View All Templates
          </Button>
        </div>
      </div>
    </section>
  );
}
