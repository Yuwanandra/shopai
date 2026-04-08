import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Heart, Star, ChevronRight, Send, Minus, Plus, Shield, Truck, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore, useCartStore } from '../store';
import { useCurrencyStore } from '../store/currency';
import { StarRating } from '../components/products/ProductCard';
import ProductCard from '../components/products/ProductCard';
import toast from 'react-hot-toast';

function ReviewForm({ productId, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hover,  setHover]  = useState(0);
  const [title,  setTitle]  = useState('');
  const [body,   setBody]   = useState('');
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: () => api.post(`/reviews/product/${productId}`, { rating, title, body }),
    onSuccess: () => {
      toast.success('Review posted! Thank you 🌟');
      qc.invalidateQueries(['reviews', productId]);
      qc.invalidateQueries(['product']);
      onSuccess?.();
      setRating(0); setTitle(''); setBody('');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to post review'),
  });

  return (
    <div className="bg-cream rounded-2xl p-6">
      <h3 className="font-semibold mb-4">Write a Review</h3>
      {/* Star selector */}
      <div className="flex gap-2 mb-4">
        {[1,2,3,4,5].map(i => (
          <button key={i} onClick={() => setRating(i)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}>
            <Star size={28} className={`transition-colors ${i <= (hover || rating) ? 'text-amber fill-amber' : 'text-gray-300 fill-gray-200'}`} />
          </button>
        ))}
      </div>
      <input
        value={title} onChange={e => setTitle(e.target.value)}
        placeholder="Review title (optional)"
        className="input-field mb-3"
      />
      <textarea
        value={body} onChange={e => setBody(e.target.value)}
        placeholder="Share your experience with this product…"
        rows={4}
        className="input-field resize-none mb-4"
      />
      <button
        onClick={() => mut.mutate()}
        disabled={rating === 0 || mut.isPending}
        className="btn-primary w-full justify-center"
      >
        <Send size={16} />
        {mut.isPending ? 'Posting…' : 'Post Review'}
      </button>
    </div>
  );
}

export default function ProductPage() {
  const { slug } = useParams();
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  const { format } = useCurrencyStore();

  const [qty,       setQty]       = useState(1);
  const [showForm,  setShowForm]  = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn:  () => api.get(`/products/${slug}`).then(r => r.data),
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', data?.product?.id],
    queryFn:  () => api.get(`/reviews/product/${data.product.id}`).then(r => r.data),
    enabled: !!data?.product?.id,
  });

  const { data: recData } = useQuery({
    queryKey: ['recommendations', data?.product?.id],
    queryFn:  () => api.get(`/recommendations?product_id=${data.product.id}&limit=4`).then(r => r.data),
    enabled: !!data?.product?.id,
  });

  const handleAddToCart = async () => {
    const p = data?.product;
    if (!p || p.stock === 0) return;
    addItem(p, qty);
    if (user) {
      await api.post('/cart/add', { product_id: p.id, quantity: qty }).catch(() => {});
    }
    await api.post(`/products/${p.id}/interact`, { interaction: 'cart' }).catch(() => {});
    toast.success(`Added ${qty}x ${p.name.slice(0,20)}… 🛒`);
  };

  if (isLoading) {
    return (
      <div className="pt-20 max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="skeleton h-[500px] rounded-3xl" />
          <div className="space-y-4">
            {[60,40,80,30,50].map((w,i) => <div key={i} className={`skeleton h-6 w-${w}/100 rounded`} />)}
          </div>
        </div>
      </div>
    );
  }

  const product = data?.product;
  if (!product) return <div className="pt-32 text-center text-gray-400">Product not found.</div>;

  const images = [product.image_url, ...(product.images || [])].filter(Boolean);
  const discount = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100) : null;

  return (
    <div className="pt-20 page-enter">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Link to="/"    className="hover:text-coral">Home</Link>  <ChevronRight size={12} />
          <Link to="/shop" className="hover:text-coral">Shop</Link>  <ChevronRight size={12} />
          {product.category_name && (
            <><Link to={`/shop/${product.category_slug}`} className="hover:text-coral">{product.category_name}</Link> <ChevronRight size={12} /></>
          )}
          <span className="text-ink truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Gallery */}
          <div>
            <motion.div
              key={activeImg}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl overflow-hidden bg-cream-dark aspect-square mb-4 shadow-lg"
            >
              <img
                src={images[activeImg] || 'https://placehold.co/600x600/FFF8F0/FF6B6B?text=Product'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`rounded-2xl overflow-hidden w-20 h-20 border-2 transition-all ${
                      i === activeImg ? 'border-coral shadow-md' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.category_name && (
              <Link to={`/shop/${product.category_slug}`}
                className="inline-block text-xs font-semibold text-coral uppercase tracking-wide bg-coral/10 px-3 py-1 rounded-full mb-4 hover:bg-coral/20 transition-colors"
              >
                {product.category_name}
              </Link>
            )}

            <h1 className="font-display font-bold text-3xl md:text-4xl text-ink leading-tight mb-4">{product.name}</h1>

            {/* Rating summary */}
            <div className="flex items-center gap-3 mb-6">
              <StarRating value={parseFloat(product.avg_rating || 0)} count={product.review_count || 0} size="lg" />
              <span className="text-sm text-gray-400">{product.view_count?.toLocaleString()} views</span>
            </div>

            {/* Price */}
            <div className="flex items-end gap-3 mb-6">
              <span className="font-display font-bold text-4xl text-ink">
                {format(product.price)}
              </span>
              {discount && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    {format(product.original_price)}
                  </span>
                  <span className="bg-coral text-white text-sm font-bold px-3 py-1 rounded-full">-{discount}%</span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-500 leading-relaxed mb-8">{product.description}</p>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {product.tags.map(tag => (
                  <Link key={tag} to={`/shop?q=${tag}`} className="chip text-xs">{tag}</Link>
                ))}
              </div>
            )}

            {/* Qty + Add to Cart */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-3 bg-cream-dark rounded-2xl px-4 py-3">
                <button onClick={() => setQty(q => Math.max(1, q-1))} className="text-ink hover:text-coral transition-colors">
                  <Minus size={16} />
                </button>
                <span className="font-semibold w-6 text-center text-sm">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q+1))} className="text-ink hover:text-coral transition-colors">
                  <Plus size={16} />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="btn-primary flex-1 justify-center rounded-2xl py-3.5 text-base shadow-xl shadow-coral/25 disabled:opacity-50"
              >
                <ShoppingCart size={20} />
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>

            {/* Stock */}
            {product.stock > 0 && product.stock <= 10 && (
              <p className="text-orange-500 text-sm font-medium mb-4">⚡ Only {product.stock} left in stock!</p>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-6">
              {[
                { icon: Shield, text: 'Secure Payment' },
                { icon: Truck,  text: 'Fast Shipping' },
                { icon: RefreshCw, text: '30-Day Returns' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex flex-col items-center gap-1.5 text-center">
                  <Icon size={20} className="text-coral" />
                  <span className="text-xs text-gray-400 font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-title">Customer Reviews</h2>
            {user && (
              <button onClick={() => setShowForm(f => !f)} className="btn-outline text-sm">
                {showForm ? 'Cancel' : 'Write Review'}
              </button>
            )}
          </div>

          {showForm && user && (
            <div className="mb-8">
              <ReviewForm productId={product.id} onSuccess={() => setShowForm(false)} />
            </div>
          )}

          {/* Rating breakdown */}
          {product.review_count > 0 && (
            <div className="bg-white rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center gap-8">
              <div className="text-center">
                <p className="font-display font-bold text-5xl text-ink">{parseFloat(product.avg_rating).toFixed(1)}</p>
                <StarRating value={parseFloat(product.avg_rating)} count={0} size="lg" />
                <p className="text-sm text-gray-400 mt-1">{product.review_count} reviews</p>
              </div>
              <div className="flex-1 w-full">
                {[5,4,3,2,1].map(s => {
                  const count = reviewsData?.reviews?.filter(r => r.rating === s).length || 0;
                  const pct   = product.review_count ? Math.round(count / product.review_count * 100) : 0;
                  return (
                    <div key={s} className="flex items-center gap-3 mb-2">
                      <span className="text-xs text-gray-400 w-4">{s}</span>
                      <Star size={12} className="text-amber fill-amber" />
                      <div className="flex-1 bg-cream-dark rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-amber rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 w-8">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Review list */}
          <div className="space-y-4">
            {reviewsData?.reviews?.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Star size={32} className="mx-auto mb-3 text-gray-300" />
                <p>No reviews yet. Be the first!</p>
              </div>
            )}
            {(reviewsData?.reviews || []).map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-coral/15 flex items-center justify-center">
                      {review.avatar_url
                        ? <img src={review.avatar_url} className="w-full h-full object-cover rounded-full" alt="" />
                        : <span className="text-coral font-bold text-sm">{review.username?.[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{review.username}</p>
                      {review.is_verified && (
                        <span className="text-[10px] text-teal font-medium">✓ Verified Purchase</span>
                      )}
                    </div>
                  </div>
                  <StarRating value={review.rating} count={0} />
                </div>
                {review.title && <p className="font-semibold text-sm mb-1">{review.title}</p>}
                {review.body && <p className="text-sm text-gray-500 leading-relaxed">{review.body}</p>}
                <p className="text-xs text-gray-300 mt-3">{new Date(review.created_at).toLocaleDateString('id-ID', { year:'numeric', month:'long', day:'numeric' })}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Similar products */}
        {recData?.recommendations?.length > 0 && (
          <div className="mt-20">
            <h2 className="section-title mb-8">You Might Also Like</h2>
            <div className="products-grid">
              {recData.recommendations.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}