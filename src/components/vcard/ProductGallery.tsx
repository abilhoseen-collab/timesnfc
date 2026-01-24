import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ZoomIn, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Product {
  name: string;
  price: string;
  description?: string;
  image?: string;
  category?: string;
  originalPrice?: string;
}

interface ProductGalleryProps {
  products: Product[];
  accentColor?: string;
  onAddToCart?: (product: Product) => void;
}

export default function ProductGallery({ 
  products, 
  accentColor = 'bg-primary',
  onAddToCart 
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!products || products.length === 0) return null;

  const productsWithImages = products.filter(p => p.image);

  if (productsWithImages.length === 0) return null;

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedIndex(null);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (selectedIndex === null) return;
    const newIndex = direction === 'prev' 
      ? (selectedIndex - 1 + productsWithImages.length) % productsWithImages.length
      : (selectedIndex + 1) % productsWithImages.length;
    setSelectedIndex(newIndex);
  };

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {productsWithImages.map((product, index) => (
          <motion.div
            key={`${product.name}-${index}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="relative group cursor-pointer"
            onClick={() => openLightbox(index)}
          >
            <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-semibold text-sm truncate">{product.name}</p>
                  <Badge className="bg-white/20 text-white border-0 text-xs mt-1">
                    {product.price}
                  </Badge>
                </div>
                <div className="absolute top-2 right-2">
                  <div className={`w-8 h-8 rounded-full ${accentColor} flex items-center justify-center`}>
                    <ZoomIn size={14} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
            {/* Price Badge */}
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="font-bold text-xs shadow-md">
                {product.price}
              </Badge>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X size={24} className="text-white" />
            </button>

            {/* Navigation Buttons */}
            {productsWithImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft size={28} className="text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <ChevronRight size={28} className="text-white" />
                </button>
              </>
            )}

            {/* Image & Info */}
            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl max-h-[85vh] flex flex-col items-center px-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={productsWithImages[selectedIndex].image}
                alt={productsWithImages[selectedIndex].name}
                className="max-h-[60vh] w-auto object-contain rounded-lg"
              />
              
              {/* Product Info */}
              <div className="mt-4 text-center">
                <h3 className="text-white font-bold text-xl mb-2">
                  {productsWithImages[selectedIndex].name}
                </h3>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Badge className={`${accentColor} text-white border-0 text-lg px-4 py-1`}>
                    {productsWithImages[selectedIndex].price}
                  </Badge>
                  {productsWithImages[selectedIndex].originalPrice && (
                    <span className="text-gray-400 line-through text-lg">
                      {productsWithImages[selectedIndex].originalPrice}
                    </span>
                  )}
                </div>
                {productsWithImages[selectedIndex].description && (
                  <p className="text-gray-300 text-sm max-w-md">
                    {productsWithImages[selectedIndex].description}
                  </p>
                )}
                {onAddToCart && (
                  <Button
                    className={`mt-4 ${accentColor} text-white`}
                    onClick={() => {
                      onAddToCart(productsWithImages[selectedIndex]);
                      closeLightbox();
                    }}
                  >
                    <ShoppingCart size={16} className="mr-2" />
                    কার্টে যোগ করুন
                  </Button>
                )}
              </div>

              {/* Counter */}
              <div className="mt-4 text-gray-400 text-sm">
                {selectedIndex + 1} / {productsWithImages.length}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
