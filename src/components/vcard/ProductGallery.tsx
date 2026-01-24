import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ZoomIn, 
  ZoomOut,
  Share2, 
  ShoppingCart,
  Download,
  Facebook,
  Twitter,
  Link2,
  Check,
  Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

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
  onTrackClick?: (linkName: string) => void;
}

export default function ProductGallery({ 
  products, 
  accentColor = 'bg-primary',
  onAddToCart,
  onTrackClick
}: ProductGalleryProps) {
  const { toast } = useToast();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!products || products.length === 0) return null;

  const productsWithImages = products.filter(p => p.image);

  if (productsWithImages.length === 0) return null;

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
    setZoomLevel(1);
    onTrackClick?.('product_gallery_view');
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedIndex(null);
    setZoomLevel(1);
    setShowShareMenu(false);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (selectedIndex === null) return;
    const newIndex = direction === 'prev' 
      ? (selectedIndex - 1 + productsWithImages.length) % productsWithImages.length
      : (selectedIndex + 1) % productsWithImages.length;
    setSelectedIndex(newIndex);
    setZoomLevel(1);
  };

  const toggleZoom = () => {
    setZoomLevel(prev => prev === 1 ? 2 : prev === 2 ? 3 : 1);
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 1));
  };

  const shareProduct = async (platform: 'facebook' | 'twitter' | 'whatsapp' | 'copy') => {
    if (selectedIndex === null) return;
    
    const product = productsWithImages[selectedIndex];
    const shareUrl = window.location.href;
    const shareText = `Check out ${product.name} - ${product.price}`;

    onTrackClick?.(`share_${platform}`);

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
        break;
      case 'copy':
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        toast({ title: 'Link copied!' });
        setTimeout(() => setCopiedLink(false), 2000);
        break;
    }
    setShowShareMenu(false);
  };

  const downloadImage = async () => {
    if (selectedIndex === null) return;
    const product = productsWithImages[selectedIndex];
    if (!product.image) return;

    onTrackClick?.('download_product_image');

    try {
      const response = await fetch(product.image);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${product.name.replace(/\s+/g, '-')}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Image downloaded!' });
    } catch (error) {
      toast({ title: 'Failed to download', variant: 'destructive' });
    }
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
                <div className="absolute top-2 right-2 flex gap-2">
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

      {/* Enhanced Lightbox */}
      <AnimatePresence>
        {lightboxOpen && selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col"
            onClick={closeLightbox}
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent absolute top-0 left-0 right-0 z-20">
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); zoomOut(); }}
                  disabled={zoomLevel <= 1}
                  className="text-white/80 hover:text-white hover:bg-white/20"
                >
                  <ZoomOut size={20} />
                </Button>
                <span className="text-white/70 text-sm min-w-[50px] text-center">{Math.round(zoomLevel * 100)}%</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); zoomIn(); }}
                  disabled={zoomLevel >= 3}
                  className="text-white/80 hover:text-white hover:bg-white/20"
                >
                  <ZoomIn size={20} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); toggleZoom(); }}
                  className="text-white/80 hover:text-white hover:bg-white/20"
                >
                  <Maximize2 size={20} />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {/* Share Button */}
                <div className="relative">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); setShowShareMenu(!showShareMenu); }}
                    className="text-white/80 hover:text-white hover:bg-white/20"
                  >
                    <Share2 size={20} />
                  </Button>
                  
                  {/* Share Menu */}
                  <AnimatePresence>
                    {showShareMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-12 bg-white rounded-xl shadow-2xl p-2 min-w-[160px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => shareProduct('facebook')}
                          className="flex items-center gap-3 w-full p-2 hover:bg-gray-100 rounded-lg text-left"
                        >
                          <Facebook size={18} className="text-blue-600" />
                          <span className="text-sm text-gray-700">Facebook</span>
                        </button>
                        <button
                          onClick={() => shareProduct('twitter')}
                          className="flex items-center gap-3 w-full p-2 hover:bg-gray-100 rounded-lg text-left"
                        >
                          <Twitter size={18} className="text-sky-500" />
                          <span className="text-sm text-gray-700">Twitter</span>
                        </button>
                        <button
                          onClick={() => shareProduct('whatsapp')}
                          className="flex items-center gap-3 w-full p-2 hover:bg-gray-100 rounded-lg text-left"
                        >
                          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-green-500" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          <span className="text-sm text-gray-700">WhatsApp</span>
                        </button>
                        <div className="border-t border-gray-100 my-1" />
                        <button
                          onClick={() => shareProduct('copy')}
                          className="flex items-center gap-3 w-full p-2 hover:bg-gray-100 rounded-lg text-left"
                        >
                          {copiedLink ? (
                            <Check size={18} className="text-green-500" />
                          ) : (
                            <Link2 size={18} className="text-gray-500" />
                          )}
                          <span className="text-sm text-gray-700">
                            {copiedLink ? 'Copied!' : 'Copy Link'}
                          </span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Download Button */}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); downloadImage(); }}
                  className="text-white/80 hover:text-white hover:bg-white/20"
                >
                  <Download size={20} />
                </Button>

                {/* Close Button */}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={closeLightbox}
                  className="text-white/80 hover:text-white hover:bg-white/20"
                >
                  <X size={24} />
                </Button>
              </div>
            </div>

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
            <div className="flex-1 flex items-center justify-center overflow-hidden pt-16 pb-32">
              <motion.div
                key={selectedIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="relative cursor-zoom-in"
                onClick={(e) => { e.stopPropagation(); toggleZoom(); }}
                style={{
                  transform: `scale(${zoomLevel})`,
                  transition: 'transform 0.3s ease-out',
                }}
              >
                <img
                  src={productsWithImages[selectedIndex].image}
                  alt={productsWithImages[selectedIndex].name}
                  className="max-h-[60vh] w-auto object-contain rounded-lg"
                  draggable={false}
                />
              </motion.div>
            </div>

            {/* Bottom Product Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <div className="max-w-lg mx-auto text-center">
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
                  <p className="text-gray-300 text-sm max-w-md mx-auto mb-4">
                    {productsWithImages[selectedIndex].description}
                  </p>
                )}
                {onAddToCart && (
                  <Button
                    className={`${accentColor} text-white`}
                    onClick={(e) => {
                      e.stopPropagation();
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
              <div className="mt-4 text-gray-400 text-sm text-center">
                {selectedIndex + 1} / {productsWithImages.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
