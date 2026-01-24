import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQItem[];
  accentColor?: string;
}

export default function FAQSection({ faqs, accentColor = 'bg-primary' }: FAQSectionProps) {
  if (!faqs || faqs.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-2"
    >
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <AccordionItem
              value={`item-${index}`}
              className="border border-gray-100 rounded-xl mb-2 overflow-hidden bg-white data-[state=open]:shadow-md transition-all"
            >
              <AccordionTrigger className="px-4 py-3 text-left font-semibold text-gray-900 text-sm hover:no-underline hover:bg-gray-50 [&[data-state=open]]:bg-gray-50">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-gray-600 text-sm leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          </motion.div>
        ))}
      </Accordion>
    </motion.div>
  );
}
