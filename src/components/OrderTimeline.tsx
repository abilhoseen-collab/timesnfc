import { motion } from 'framer-motion';
import {
  CreditCard,
  CheckCircle,
  Truck,
  Package,
  Clock,
  MapPin,
} from 'lucide-react';

type ShippingStatus = 'payment_received' | 'verified' | 'shipped' | 'out_for_delivery' | 'delivered';

interface OrderTimelineProps {
  status: string;
  shippingStatus?: string | null;
  createdAt: string;
}

const timelineSteps: { key: ShippingStatus; label: string; labelBn: string; icon: any; description: string; descriptionBn: string }[] = [
  { 
    key: 'payment_received', 
    label: 'Payment Received', 
    labelBn: 'পেমেন্ট গৃহীত',
    icon: CreditCard, 
    description: 'Your payment has been received',
    descriptionBn: 'আপনার পেমেন্ট গ্রহণ করা হয়েছে'
  },
  { 
    key: 'verified', 
    label: 'Verified', 
    labelBn: 'যাচাইকৃত',
    icon: CheckCircle, 
    description: 'Payment verified and order confirmed',
    descriptionBn: 'পেমেন্ট যাচাই ও অর্ডার নিশ্চিত হয়েছে'
  },
  { 
    key: 'shipped', 
    label: 'Shipped', 
    labelBn: 'শিপ করা হয়েছে',
    icon: Package, 
    description: 'Your order has been shipped',
    descriptionBn: 'আপনার অর্ডার শিপ করা হয়েছে'
  },
  { 
    key: 'out_for_delivery', 
    label: 'Out for Delivery', 
    labelBn: 'ডেলিভারিতে',
    icon: Truck, 
    description: 'Your order is out for delivery',
    descriptionBn: 'আপনার অর্ডার ডেলিভারিতে রয়েছে'
  },
  { 
    key: 'delivered', 
    label: 'Delivered', 
    labelBn: 'ডেলিভারি সম্পন্ন',
    icon: MapPin, 
    description: 'Order has been delivered',
    descriptionBn: 'অর্ডার ডেলিভারি সম্পন্ন হয়েছে'
  },
];

export default function OrderTimeline({ status, shippingStatus, createdAt }: OrderTimelineProps) {
  const effectiveShippingStatus: ShippingStatus = (shippingStatus as ShippingStatus) || mapStatusToShipping(status);

  const currentStepIndex = timelineSteps.findIndex(step => step.key === effectiveShippingStatus);
  const isPending = status === 'pending';
  const isRejected = status === 'rejected' || status === 'cancelled';

  if (isRejected) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <Clock size={24} className="text-red-600" />
          </div>
          <div>
            <p className="font-bold text-red-800">
              অর্ডার {status === 'rejected' ? 'প্রত্যাখ্যাত' : 'বাতিল'}
            </p>
            <p className="text-sm text-red-600">
              {status === 'rejected' 
                ? 'পেমেন্ট যাচাই করা যায়নি।' 
                : 'এই অর্ডার বাতিল করা হয়েছে।'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="font-bold text-foreground mb-6 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Truck size={18} className="text-primary" />
        </div>
        অর্ডার টাইমলাইন
      </h3>

      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border" />
        
        {/* Filled Progress */}
        <motion.div 
          className="absolute left-5 top-5 w-0.5 bg-primary"
          initial={{ height: 0 }}
          animate={{ 
            height: isPending ? 0 : `${Math.min((currentStepIndex / (timelineSteps.length - 1)) * 100, 100)}%` 
          }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        />

        {/* Steps */}
        <div className="space-y-6 relative">
          {timelineSteps.map((step, index) => {
            const isCompleted = !isPending && index <= currentStepIndex;
            const isCurrent = !isPending && index === currentStepIndex;
            const Icon = step.icon;

            return (
              <motion.div
                key={step.key}
                className="flex items-start gap-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Icon Circle */}
                <motion.div
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                      : isPending && index === 0
                      ? 'bg-yellow-100 text-yellow-600 border-2 border-yellow-300'
                      : 'bg-muted text-muted-foreground'
                  }`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: isCurrent ? 1.15 : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {isPending && index === 0 ? (
                    <Clock size={18} className="animate-pulse" />
                  ) : (
                    <Icon size={18} />
                  )}
                  
                  {/* Pulse animation for current step */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary"
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-semibold ${
                      isCompleted ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.labelBn}
                    </p>
                    {isCurrent && (
                      <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full font-medium animate-pulse">
                        বর্তমান
                      </span>
                    )}
                    {isPending && index === 0 && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full font-medium">
                        যাচাই অপেক্ষমান
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${
                    isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/50'
                  }`}>
                    {isPending && index === 0 ? 'পেমেন্ট যাচাইয়ের জন্য অপেক্ষা করছে' : step.descriptionBn}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Order Date */}
      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          অর্ডার করা হয়েছে: {new Date(createdAt).toLocaleDateString('bn-BD', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    </div>
  );
}

function mapStatusToShipping(status: string): ShippingStatus {
  switch (status) {
    case 'approved':
    case 'verified':
      return 'verified';
    case 'shipped':
      return 'shipped';
    case 'out_for_delivery':
      return 'out_for_delivery';
    case 'delivered':
      return 'delivered';
    default:
      return 'payment_received';
  }
}
