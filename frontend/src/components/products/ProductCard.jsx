import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Star, Eye, Zap } from 'lucide-react';
import { useAuthStore, useCartStore } from '../../store';
import { useCurrencyStore } from '../../store/currency';
import api from '../../lib/api';
import toast from 'react-hot-toast';

function StarRating({ value = 0, count = 0, size = 'sm' }) {
  const full  = Math.floor(value);
  const half  = value - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-1.5">
      <div className={`flex ${size === 'sm' ? 'gap-0.5' : 'gap-1'}`}>
        {Array(full).fill(0).map((_, i) => (
          <Star key={`f${i}`} size={size === 'sm' ? 12 : 16} className="text-amber fill-amber" />
        ))}
        {half && <Star size={size === 'sm' ? 12 : 16} className="text-amber fill-amber opacity-50" />}
        {Array(empty).fill(0).map((_, i) => (
          <Star key={`e${i}`} size={size === 'sm' ? 12 : 16} className="text-gray-300 fill-gray-200" />
        ))}
      </div>
      {count > 0 && <span className={`text-gray-400 ${size === 'sm' ? 'text-[11px]' : 'text-xs'}`}>({count})</span>}
    </div>
  );
}

export { StarRating };

export default function ProductCard({ product, index = 0 }) {
  const navigate = useNavigate();
  const { user }  = useAuthStore();
  const { addItem } = useCartStore();
  const { format } = useCurrencyStore();
  const [wishlisted, setWishlisted] = useState(false);
  const [adding, setAdding]         = useState(false);

  const discount = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0) return;
    setAdding(true);
    try {
      addItem(product);
      if (user) {
        await api.post('/cart/add', { product_id: product.id, quantity: 1 });
      }
      await api.post(`/products/${product.id}/interact`, { interaction: 'cart' }).catch(() => {});
      toast.success(`${product.name.slice(0, 20)}... added to cart! 🛒`);
    } catch (err) {
      toast.error('Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error('Log in to save wishlist'); return; }
    try {
      if (wishlisted) {
        await api.delete(`/wishlists/${product.id}`);
        setWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await api.post(`/wishlists/${product.id}`);
        setWishlisted(true);
        toast.success('Saved to wishlist ❤️');
      }
    } catch (_) {}
  };

  const handleClick = () => {
    api.post(`/products/${product.id}/interact`, { interaction: 'click' }).catch(() => {});
    navigate(`/product/${product.slug}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.34, 1.56, 0.64, 1] }}
      className="product-card group"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-cream-dark" style={{ height: 220 }}>
        <img
          src={product.image_url || 'https://placehold.co/400x300/FFF8F0/FF6B6B?text=No+Image'}
          alt={product.name}
          className="card-img"
          loading="lazy"
          onError={e => { e.target.src = 'https://placehold.co/400x300/FFF8F0/FF6B6B?text=Product'; }}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discount && (
            <span className="card-badge bg-coral text-white">-{discount}%</span>
          )}
          {product.is_featured && (
            <span className="card-badge bg-amber text-ink">
              <Zap size={10} className="inline mr-0.5" />Featured
            </span>
          )}
          {product.stock === 0 && (
            <span className="card-badge bg-gray-700 text-white">Sold out</span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform z-10"
          aria-label="Wishlist"
        >
          <Heart size={15} className={wishlisted ? 'fill-coral text-coral' : 'text-gray-400'} />
        </button>

        {/* Hover Actions */}
        <div className="card-actions">
          <button
            onClick={handleAddToCart}
            disabled={adding || product.stock === 0}
            className="flex-1 flex items-center justify-center gap-2 bg-white/95 hover:bg-white text-ink text-xs font-semibold rounded-xl py-2 transition-all disabled:opacity-50"
          >
            <ShoppingCart size={13} />
            {adding ? 'Adding…' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
          <button
            onClick={e => { e.stopPropagation(); handleClick(); }}
            className="w-9 flex items-center justify-center bg-coral text-white rounded-xl hover:bg-coral-dark transition-colors"
            aria-label="Quick view"
          >
            <Eye size={14} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1">
          {product.category_name || 'General'}
        </p>
        <h3 className="font-semibold text-sm text-ink line-clamp-2 leading-snug mb-2 group-hover:text-coral transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        <StarRating value={parseFloat(product.avg_rating || 0)} count={product.review_count || 0} />

        {/* Price */}
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="font-bold text-base text-ink">
              {format(product.price)}
            </p>
            {product.original_price && product.original_price > product.price && (
              <p className="text-xs text-gray-400 line-through">
                {format(product.original_price)}
              </p>
            )}
          </div>
          {product.stock > 0 && product.stock <= 10 && (
            <span className="text-[10px] font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
              Only {product.stock} left
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}