import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-cream">
      {/* Animated 404 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 14, stiffness: 200 }}
        className="relative mb-8"
      >
        <span
          className="font-display font-bold select-none"
          style={{ fontSize: 'clamp(6rem, 20vw, 14rem)', lineHeight: 1, color: 'transparent',
            WebkitTextStroke: '2px #FF6B6B', opacity: 0.15 }}
        >
          404
        </span>
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span style={{ fontSize: 'clamp(3rem, 10vw, 7rem)' }}>🛒</span>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="font-display font-bold text-3xl md:text-4xl text-ink mb-3">
          Page not found
        </h1>
        <p className="text-gray-400 mb-8 max-w-sm mx-auto">
          Looks like this page went out of stock. Let's get you back to shopping!
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/" className="btn-primary px-6 py-3 rounded-2xl">
            <Home size={16} /> Go Home
          </Link>
          <Link to="/shop" className="btn-outline px-6 py-3 rounded-2xl">
            Browse Shop <ArrowRight size={16} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
