require('dotenv').config();
const db = require('../db');

const PRODUCTS = [
  // Electronics
  { name: 'Sony WH-1000XM5 Headphones', category: 'electronics', price: 4200000, original: 4999000, stock: 50, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop', tags: ['headphones','sony','wireless','noise-cancelling'], desc: 'Industry-leading noise canceling with Dual Noise Sensor technology. 30-hour battery life with quick charging.' },
  { name: 'Samsung Galaxy A54 5G', category: 'electronics', price: 5499000, original: 5999000, stock: 30, image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&h=600&fit=crop', tags: ['samsung','smartphone','5g','android'], desc: 'Awesome 50MP triple camera system. Super AMOLED display with 120Hz refresh rate.' },
  { name: 'Apple AirPods Pro (2nd Gen)', category: 'electronics', price: 3799000, original: null, stock: 25, image: 'https://images.unsplash.com/photo-1588423771073-b8903fead85b?w=600&h=600&fit=crop', tags: ['apple','airpods','wireless','earbuds'], desc: 'Up to 2x more active noise cancellation. Adaptive Transparency mode. Personalized Spatial Audio.' },
  { name: 'Logitech MX Master 3S Mouse', category: 'electronics', price: 1299000, original: 1599000, stock: 100, image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=600&fit=crop', tags: ['logitech','mouse','wireless','productivity'], desc: 'Ultra-quiet clicks. 8K DPI optical sensor. Works on any surface including glass.' },
  { name: 'iPad Air 5th Gen Wi-Fi 64GB', category: 'electronics', price: 9499000, original: 10299000, stock: 15, image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&h=600&fit=crop', tags: ['apple','ipad','tablet'], desc: 'Powerful M1 chip. Stunning 10.9-inch Liquid Retina display. 12MP Ultra Wide front camera.' },
  { name: 'Mechanical Keyboard Keychron K2', category: 'electronics', price: 1199000, original: 1399000, stock: 60, image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&h=600&fit=crop', tags: ['keyboard','mechanical','wireless','gaming'], desc: 'Compact 75% layout with Bluetooth 5.1. Hot-swappable RGB backlit. Compatible with Mac & Windows.' },

  // Fashion
  { name: 'Nike Air Force 1 Low White', category: 'fashion', price: 1499000, original: 1799000, stock: 80, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop', tags: ['nike','shoes','sneakers','white'], desc: 'The radiance lives on in the Nike Air Force 1. Clean leather upper with Air-Sole unit.' },
  { name: 'Adidas Ultraboost 22 Running', category: 'fashion', price: 2299000, original: 2799000, stock: 45, image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&h=600&fit=crop', tags: ['adidas','running','shoes','ultraboost'], desc: 'Incredible energy return with BOOST midsole. Breathable Primeknit+ upper that wraps your foot.' },
  { name: 'Uniqlo Merino Wool V-Neck Sweater', category: 'fashion', price: 499000, original: 599000, stock: 120, image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=600&fit=crop', tags: ['uniqlo','sweater','wool','casual'], desc: 'Extra Fine Merino wool. Lightweight and warm. Anti-odor and moisture-wicking.' },
  { name: 'Levi\'s 501 Original Fit Jeans', category: 'fashion', price: 899000, original: 1099000, stock: 70, image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=600&fit=crop', tags: ['levis','jeans','denim','casual'], desc: 'The original jean since 1873. Straight leg through seat, thigh, and leg opening. Button fly.' },

  // Home & Living
  { name: 'IKEA KALLAX Shelf Unit 4x4', category: 'home-living', price: 1799000, original: null, stock: 20, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop', tags: ['ikea','shelf','storage','furniture'], desc: 'Versatile storage unit that can stand freely or be wall-mounted. Can be used as a room divider.' },
  { name: 'Xiaomi Smart LED Bulb (4-Pack)', category: 'home-living', price: 289000, original: 349000, stock: 200, image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=600&fit=crop', tags: ['xiaomi','smart','led','home-automation'], desc: '16 million colors. Voice control via Google & Alexa. Schedule and automation support.' },
  { name: 'Nespresso Essenza Mini Coffee', category: 'home-living', price: 1999000, original: 2299000, stock: 35, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=600&fit=crop', tags: ['nespresso','coffee','kitchen','appliance'], desc: 'Compact design with 19-bar pressure. Heats up in just 25 seconds. Two programmable cup sizes.' },

  // Sports
  { name: 'Decathlon Tarmak Basketball NBA', category: 'sports', price: 349000, original: null, stock: 150, image: 'https://images.unsplash.com/photo-1546519638405-a9f1e1d010f9?w=600&h=600&fit=crop', tags: ['basketball','sports','decathlon','outdoor'], desc: 'Official NBA licensed. Durable rubber cover for outdoor use. Deep channel design for better control.' },
  { name: 'Yoga Mat Premium 6mm Non-Slip', category: 'sports', price: 399000, original: 499000, stock: 90, image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=600&fit=crop', tags: ['yoga','mat','fitness','exercise'], desc: 'Extra thick 6mm cushioning. Eco-friendly TPE material. Non-slip texture on both sides.' },
  { name: 'Garmin Forerunner 255 GPS Watch', category: 'sports', price: 4599000, original: 4999000, stock: 18, image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&h=600&fit=crop', tags: ['garmin','smartwatch','running','gps'], desc: 'Multi-band GPS for accurate tracking. Up to 14 days battery life. Advanced sleep monitoring.' },

  // Books
  { name: 'Atomic Habits - James Clear', category: 'books', price: 129000, original: 159000, stock: 300, image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=600&fit=crop', tags: ['self-help','habits','productivity','bestseller'], desc: 'A proven framework for improving every day. Learn how tiny 1% improvements compound into remarkable results.' },
  { name: 'The Psychology of Money', category: 'books', price: 119000, original: 149000, stock: 250, image: 'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=600&h=600&fit=crop', tags: ['finance','money','psychology','investing'], desc: 'Timeless lessons on wealth, greed, and happiness by Morgan Housel. 19 short stories about the strange ways people think about money.' },

  // Beauty
  { name: 'The Ordinary Niacinamide 10% Serum', category: 'beauty', price: 189000, original: 219000, stock: 180, image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&h=600&fit=crop', tags: ['skincare','serum','niacinamide','the-ordinary'], desc: 'Reduces appearance of blemishes and congestion. Balances visible sebum activity. Minimizes pores.' },
  { name: 'Wardah Instaperfect Matte Lipstick', category: 'beauty', price: 89000, original: 109000, stock: 220, image: 'https://images.unsplash.com/photo-1586495777744-4e6232bf2ebb?w=600&h=600&fit=crop', tags: ['lipstick','wardah','makeup','matte'], desc: 'Long-lasting matte formula. Enriched with Vitamin E for lip care. 24 bold shades available.' },
];

async function seed() {
  console.log('🌱 Seeding products...');
  try {
    // Get categories
    const { rows: cats } = await db.query('SELECT id, slug FROM categories');
    const catMap = Object.fromEntries(cats.map(c => [c.slug, c.id]));

    for (const p of PRODUCTS) {
      const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now() + Math.floor(Math.random()*1000);
      await db.query(`
        INSERT INTO products (name, slug, description, price, original_price, stock, category_id, image_url, tags, is_active, is_featured, sku)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE,$10,$11)
        ON CONFLICT (slug) DO NOTHING
      `, [
        p.name, slug, p.desc, p.price, p.original || null, p.stock,
        catMap[p.category] || null,
        p.image, p.tags,
        Math.random() > 0.7, // 30% featured
        `SKU-${Math.random().toString(36).slice(2,10).toUpperCase()}`,
      ]);
      process.stdout.write('.');
    }

    console.log('\n✅ Seeded', PRODUCTS.length, 'products');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
