import { motion } from 'framer-motion';
import {
  CreditCard,
  CheckCircle,
  Truck,
  Package,
  Clock,
} from 'lucide-react';

type ShippingStatus = 'payment_received' | 'verified' | 'shipped' | 'delivered';

interface OrderTimelineProps {
  status: string;
  shippingStatus?: string | null;
  createdAt: string;
}

const timelineSteps: { key: ShippingStatus; label: string; icon: any; description: string }[] = [
  { key: 'payment_received', label: 'Payment Received', icon: CreditCard, description: 'Your payment has been received' },
  { key: 'verified', label: 'Verified', icon: CheckCircle, description: 'Payment verified and order confirmed' },
  { key: 'shipped', label: 'Shipped', icon: Truck, description: 'Your order is on the way' },
  { key: 'delivered', label: 'Delivered', icon: Package, description: 'Order has been delivered' },
];

export default function OrderTimeline({ status, shippingStatus, createdAt }: OrderTimelineProps) {
  // Map old status to shipping status if shipping_status is not set
  const effectiveShippingStatus: ShippingStatus = (shippingStatus as ShippingStatus) || mapStatusToShipping(status);

  const currentStepIndex = timelineSteps.findIndex(step => step.key === effectiveShippingStatus);
  const isPending = status === 'pending';
  const isRejected = status === 'rejected' || status === 'cancelled';

  if (isRejected) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <Clock size={20} className="text-red-600" />
          </div>
          <div>
            <p className="font-medium text-red-800">Order {status === 'rejected' ? 'Rejected' : 'Cancelled'}</p>
            <p className="text-sm text-red-600">
              {status === 'rejected' ? 'Payment could not be verified.' : 'This order has been cancelled.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="font-bold text-foreground mb-6 flex items-center gap-2">
        <Truck size={18} className="text-primary" />
        Order Timeline
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
          transition={{ duration: 0.5, delay: 0.2 }}
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
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : isPending && index === 0
                      ? 'bg-yellow-100 text-yellow-600 border-2 border-yellow-300'
                      : 'bg-muted text-muted-foreground'
                  }`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: isCurrent ? 1.1 : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {isPending && index === 0 ? (
                    <Clock size={18} className="animate-pulse" />
                  ) : (
                    <Icon size={18} />
                  )}
                </motion.div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <p className={`font-medium ${
                    isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                    {isCurrent && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                        Current
                      </span>
                    )}
                    {isPending && index === 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                        Pending Verification
                      </span>
                    )}
                  </p>
                  <p className={`text-sm ${
                    isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/50'
                  }`}>
                    {isPending && index === 0 ? 'Waiting for payment verification' : step.description}
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
          Order placed on {new Date(createdAt).toLocaleDateString('en-US', {
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
    case 'delivered':
      return 'delivered';
    default:
      return 'payment_received';
  }
}