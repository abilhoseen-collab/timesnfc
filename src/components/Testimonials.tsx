import { Star, Quote } from "lucide-react";

const testimonials = [
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

export function Testimonials() {
  return (
    <section className="section-padding bg-background overflow-hidden">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            What Our{" "}
            <span className="gradient-text">Users Say</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of satisfied professionals who trust Times Digital for their networking needs.
          </p>
        </div>
        
        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="group relative bg-card rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-xl transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 text-primary/10">
                <Quote size={40} />
              </div>
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={16} className="fill-secondary text-secondary" />
                ))}
              </div>
              
              {/* Content */}
              <p className="text-muted-foreground leading-relaxed mb-6 relative z-10">
                "{testimonial.content}"
              </p>
              
              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
