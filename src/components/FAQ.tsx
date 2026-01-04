import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { useHomeContent } from "@/hooks/useHomeContent";

const defaultFaqs = [
  {
    question: "What is a digital business card?",
    answer: "A digital business card is an electronic version of a traditional paper business card. It can be shared instantly via QR code, NFC tap, or direct link. It includes your contact information, social links, and can be updated anytime without reprinting.",
  },
  {
    question: "How does NFC technology work?",
    answer: "NFC (Near Field Communication) allows two devices to communicate when they're close together. Simply tap your NFC-enabled card against a smartphone, and your digital business card will instantly appear on their screen. No app required for the recipient!",
  },
  {
    question: "Can I customize my business card design?",
    answer: "Absolutely! We offer 12+ professionally designed templates for various industries. You can also customize colors, add your logo, include social media links, and even add custom CSS/JS on our Premium plan for complete design freedom.",
  },
  {
    question: "Is my data secure?",
    answer: "Yes, security is our top priority. All data is encrypted using industry-standard protocols. Our Premium plan also offers password protection for sensitive information. We're GDPR compliant and never share your data with third parties.",
  },
  {
    question: "What analytics are available?",
    answer: "Our analytics dashboard shows you how many times your card has been viewed, which links were clicked, geographic data of viewers, and engagement over time. This helps you measure networking ROI and optimize your digital presence.",
  },
  {
    question: "Can I use my own domain?",
    answer: "Yes! Our Professional and Premium plans support custom domains. Instead of sharing a generic link, you can have your card at yourname.com or card.yourcompany.com for a more professional appearance.",
  },
  {
    question: "How long does shipping take for physical NFC cards?",
    answer: "Standard shipping takes 5-7 business days within Bangladesh. Express shipping (available for Gold and Premium cards) delivers within 2-3 business days. All orders include tracking information.",
  },
  {
    question: "Can I cancel or change my subscription anytime?",
    answer: "Yes, you can upgrade, downgrade, or cancel your subscription at any time. Changes take effect at the start of your next billing cycle. Your card remains active on the free tier even after cancellation.",
  },
];

export function FAQ() {
  const { section, isVisible } = useHomeContent('faq');

  if (!isVisible) return null;

  const title = section?.title || "Frequently Asked Questions";
  const subtitle = section?.subtitle || "Got questions? We've got answers. If you don't find what you're looking for, feel free to contact us.";
  const faqs = section?.content?.faqs || defaultFaqs;

  return (
    <section className="section-padding bg-card">
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
            {title.includes("Questions") ? (
              <>
                Frequently Asked{" "}
                <span className="gradient-text">Questions</span>
              </>
            ) : (
              title
            )}
          </h2>
          <p className="text-lg text-muted-foreground">
            {subtitle}
          </p>
        </motion.div>
        
        {/* FAQ Accordion */}
        <motion.div 
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq: { question: string; answer: string }, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="bg-background rounded-xl border border-border px-6 data-[state=open]:border-primary/30 data-[state=open]:shadow-lg transition-all"
                >
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
