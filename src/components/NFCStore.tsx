import { Button } from "@/components/ui/button";
import { CreditCard, Sparkles, Crown } from "lucide-react";
import { motion } from "framer-motion";

const nfcCards = [
  {
    name: "Silver",
    price: "৳719",
    originalPrice: "৳999",
    image: "silver",
    features: ["Basic NFC Chip", "Standard Design", "1 Year Warranty", "Free Shipping"],
    icon: CreditCard,
    gradient: "from-gray-300 to-gray-400",
  },
  {
    name: "Gold",
    price: "৳1,499",
    originalPrice: "৳1,999",
    image: "gold",
    features: ["Premium NFC Chip", "Metallic Finish", "2 Year Warranty", "Express Shipping", "Custom Logo"],
    icon: Sparkles,
    gradient: "from-yellow-400 to-amber-500",
    popular: true,
  },
  {
    name: "Premium",
    price: "৳5,999",
    originalPrice: "৳7,999",
    image: "premium",
    features: ["Advanced NFC Chip", "Luxury Metal Card", "Lifetime Warranty", "Priority Support", "Custom Design", "VIP Access"],
    icon: Crown,
    gradient: "from-primary to-teal-400",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

export function NFCStore() {
  return (
    <section id="nfc-store" className="section-padding bg-background">
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
            Physical{" "}
            <span className="gradient-text">NFC Cards</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Upgrade your networking with our premium physical NFC business cards. Tap and share instantly.
          </p>
        </motion.div>
        
        {/* NFC Cards Grid */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {nfcCards.map((card) => (
            <motion.div
              key={card.name}
              variants={cardVariants}
              className={`relative rounded-3xl overflow-hidden transition-all duration-300 ${
                card.popular
                  ? "ring-2 ring-secondary shadow-2xl shadow-secondary/20 scale-105"
                  : "border border-border hover:border-primary/30"
              }`}
              whileHover={{ 
                y: -10, 
                boxShadow: card.popular 
                  ? "0 30px 60px -15px rgba(245, 158, 11, 0.35)" 
                  : "0 25px 50px -12px rgba(0, 0, 0, 0.2)",
                transition: { duration: 0.3 } 
              }}
            >
              {/* Popular Badge */}
              {card.popular && (
                <motion.div 
                  className="absolute top-4 right-4 z-10 px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-full"
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, duration: 0.4, type: "spring" }}
                >
                  Best Seller
                </motion.div>
              )}
              
              {/* Card Preview */}
              <motion.div 
                className={`relative h-48 bg-gradient-to-br ${card.gradient} flex items-center justify-center`}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative">
                  {/* Card mockup */}
                  <motion.div 
                    className="w-64 h-40 bg-foreground/10 backdrop-blur-sm rounded-2xl border border-primary-foreground/20 flex items-center justify-center shadow-xl"
                    whileHover={{ rotateY: 10, rotateX: -5 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="text-center text-primary-foreground">
                      <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <card.icon size={32} className="mx-auto mb-2" />
                      </motion.div>
                      <span className="text-lg font-bold">{card.name}</span>
                    </div>
                  </motion.div>
                  {/* NFC waves */}
                  <motion.div 
                    className="absolute -top-2 -right-2 w-8 h-8 border-2 border-primary-foreground/50 rounded-full"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </motion.div>
              
              {/* Content */}
              <div className="p-6 bg-card">
                <h3 className="text-xl font-bold text-foreground mb-2">{card.name} Card</h3>
                
                <div className="flex items-baseline gap-2 mb-4">
                  <motion.span 
                    className="text-3xl font-bold text-foreground"
                    initial={{ scale: 0.5 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, type: "spring" }}
                  >
                    {card.price}
                  </motion.span>
                  <span className="text-lg text-muted-foreground line-through">{card.originalPrice}</span>
                </div>
                
                <ul className="space-y-3 mb-6">
                  {card.features.map((feature, index) => (
                    <motion.li 
                      key={feature} 
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
                    >
                      <motion.div 
                        className="w-1.5 h-1.5 rounded-full bg-secondary"
                        whileHover={{ scale: 1.5 }}
                      />
                      {feature}
                    </motion.li>
                  ))}
                </ul>
                
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    className="w-full font-semibold"
                    variant={card.popular ? "secondary" : "outline"}
                    size="lg"
                  >
                    Order Now
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Benefits */}
        <motion.div 
          className="mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {[
            { title: "Free Shipping", desc: "On all orders" },
            { title: "Easy Returns", desc: "30-day guarantee" },
            { title: "Secure Payment", desc: "SSL encrypted" },
            { title: "Fast Delivery", desc: "2-3 business days" },
          ].map((benefit, index) => (
            <motion.div 
              key={benefit.title} 
              className="text-center p-6 bg-card rounded-2xl border border-border"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <h4 className="font-bold text-foreground mb-1">{benefit.title}</h4>
              <p className="text-sm text-muted-foreground">{benefit.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
