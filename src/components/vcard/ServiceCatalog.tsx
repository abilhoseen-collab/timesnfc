import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  Tag,
  Package,
  Check,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Service {
  name: string;
  price: string;
  description?: string;
  image?: string;
  category?: string;
}

interface ServiceCatalogProps {
  services: Service[];
  accentColor?: string;
  ownerName: string;
  whatsappNumber?: string | null;
  onTrackClick?: (linkName: string) => void;
}

export default function ServiceCatalog({
  services,
  accentColor = 'bg-primary',
  ownerName,
  whatsappNumber,
  onTrackClick,
}: ServiceCatalogProps) {
  const { toast } = useToast();
  const [cart, setCart] = useState<{ service: Service; quantity: number }[]>([]);
  const [showCart, setShowCart] = useState(false);

  if (!services || services.length === 0) return null;

  const addToCart = (service: Service) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.service.name === service.name);
      if (existing) {
        return prev.map((item) =>
          item.service.name === service.name
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { service, quantity: 1 }];
    });
    toast({ title: `${service.name} added to cart!` });
    onTrackClick?.('add_to_cart');
  };

  const updateQuantity = (serviceName: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.service.name === serviceName
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const parsePrice = (priceStr: string): number => {
    const num = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const cartTotal = cart.reduce(
    (acc, item) => acc + parsePrice(item.service.price) * item.quantity,
    0
  );

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const sendToWhatsApp = () => {
    if (!whatsappNumber) {
      toast({ title: 'WhatsApp number not available', variant: 'destructive' });
      return;
    }

    const orderDetails = cart
      .map((item) => `• ${item.service.name} x${item.quantity} - ${item.service.price}`)
      .join('\n');

    const message = encodeURIComponent(
      `Hi ${ownerName},\n\nI'd like to order:\n\n${orderDetails}\n\nTotal: ৳${cartTotal.toFixed(2)}\n\nPlease confirm availability. Thank you!`
    );

    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
    onTrackClick?.('order_via_whatsapp');
    setShowCart(false);
    setCart([]);
  };

  // Group services by category
  const categories = [...new Set(services.map((s) => s.category || 'Services'))];

  return (
    <>
      {/* Service Cards */}
      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category}>
            {categories.length > 1 && (
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {category}
              </h4>
            )}
            <div className="grid gap-3">
              {services
                .filter((s) => (s.category || 'Services') === category)
                .map((service, idx) => (
                  <motion.div
                    key={`${service.name}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex">
                      {/* Image */}
                      {service.image && (
                        <div className="w-24 h-24 flex-shrink-0">
                          <img
                            src={service.image}
                            alt={service.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-semibold text-gray-900 text-sm line-clamp-1">
                              {service.name}
                            </h5>
                            <Badge variant="secondary" className="shrink-0 font-bold">
                              {service.price}
                            </Badge>
                          </div>
                          {service.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {service.description}
                            </p>
                          )}
                        </div>

                        <Button
                          size="sm"
                          className={`mt-2 w-full ${accentColor} text-white font-medium`}
                          onClick={() => addToCart(service)}
                        >
                          <ShoppingCart size={14} className="mr-1" />
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cartItemCount > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setShowCart(true)}
            className={`fixed bottom-24 right-6 z-40 ${accentColor} text-white rounded-full px-5 py-3 shadow-xl flex items-center gap-2 font-semibold`}
          >
            <ShoppingCart size={20} />
            <span>{cartItemCount}</span>
            <span className="hidden sm:inline">- ৳{cartTotal.toFixed(0)}</span>
            <ChevronRight size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl max-h-[85vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={20} className="text-primary" />
                  <h3 className="font-bold text-lg text-gray-900">Your Cart</h3>
                  <Badge variant="secondary">{cartItemCount} items</Badge>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setShowCart(false)}>
                  <X size={20} />
                </Button>
              </div>

              {/* Cart Items */}
              <div className="p-4 overflow-y-auto max-h-[50vh] space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.service.name}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {item.service.name}
                      </p>
                      <p className="text-xs text-gray-500">{item.service.price} each</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.service.name, -1)}
                      >
                        <Minus size={14} />
                      </Button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.service.name, 1)}
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total</span>
                  <span className="text-2xl font-bold text-gray-900">
                    ৳{cartTotal.toFixed(2)}
                  </span>
                </div>

                {whatsappNumber ? (
                  <Button
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-6"
                    onClick={sendToWhatsApp}
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Order via WhatsApp
                  </Button>
                ) : (
                  <p className="text-center text-sm text-gray-500">
                    Contact the owner to place your order
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
