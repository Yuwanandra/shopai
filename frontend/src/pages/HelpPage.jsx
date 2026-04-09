import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Mail, Paperclip, Send, X, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useLanguageStore } from '../store/language';
import AIChat from '../components/ai/AIChat';
import { useUIStore } from '../store';
import toast from 'react-hot-toast';

const FAQS = [
  {
    q: { en: 'How do I track my order?',          id: 'Bagaimana cara melacak pesanan saya?',    ja: '注文を追跡するには？',        zh: '如何追踪我的订单？',       ru: 'Как отследить мой заказ?' },
    a: { en: 'Go to "My Orders" in your account page. Each order shows its current status — from awaiting payment, processing, shipped, to delivered.',
         id: 'Pergi ke "Pesanan Saya" di halaman akun. Setiap pesanan menampilkan status terkini — dari menunggu pembayaran, diproses, dikirim, hingga terkirim.',
         ja: 'アカウントページの「注文履歴」へ移動してください。各注文の現在のステータスが表示されます。',
         zh: '前往账户页面中的"我的订单"。每个订单都会显示当前状态。',
         ru: 'Перейдите в "Мои заказы" на странице аккаунта. Каждый заказ показывает текущий статус.' },
  },
  {
    q: { en: 'How do I get a discount coupon?',   id: 'Bagaimana cara mendapatkan kupon diskon?', ja: '割引クーポンの取得方法は？',   zh: '如何获得折扣券？',          ru: 'Как получить купон на скидку?' },
    a: { en: 'Coupons are awarded automatically! Purchase more than 10 items or spend over Rp 500,000 to earn a 10% coupon. Spend over Rp 1,000,000 for a 20% coupon.',
         id: 'Kupon diberikan otomatis! Beli lebih dari 10 produk atau habiskan lebih dari Rp 500.000 untuk mendapat kupon 10%. Lebih dari Rp 1.000.000 untuk kupon 20%.',
         ja: 'クーポンは自動的に付与されます！10点以上購入またはRp500,000以上で10%クーポン、Rp1,000,000以上で20%クーポンが獲得できます。',
         zh: '优惠券自动发放！购买超过10件或消费超过Rp 500,000可获得10%优惠券，超过Rp 1,000,000可获得20%优惠券。',
         ru: 'Купоны начисляются автоматически! Купите более 10 товаров или потратьте более Rp 500,000 для получения купона 10%.' },
  },
  {
    q: { en: 'What payment methods are accepted?', id: 'Metode pembayaran apa yang diterima?',   ja: '使用できる支払い方法は？',    zh: '支持哪些支付方式？',       ru: 'Какие способы оплаты принимаются?' },
    a: { en: 'We support bank transfers (BCA, BNI, Mandiri), GoPay, OVO, DANA, ShopeePay, QRIS, and credit cards via Midtrans.',
         id: 'Kami mendukung transfer bank (BCA, BNI, Mandiri), GoPay, OVO, DANA, ShopeePay, QRIS, dan kartu kredit via Midtrans.',
         ja: '銀行振込（BCA、BNI、Mandiri）、GoPay、OVO、DANA、ShopeePay、QRIS、クレジットカードに対応しています。',
         zh: '我们支持银行转账（BCA、BNI、Mandiri）、GoPay、OVO、DANA、ShopeePay、QRIS和信用卡。',
         ru: 'Мы принимаем банковские переводы (BCA, BNI, Mandiri), GoPay, OVO, DANA, ShopeePay, QRIS и кредитные карты.' },
  },
  {
    q: { en: 'Can I return a product?',            id: 'Apakah saya bisa mengembalikan produk?', ja: '商品を返品できますか？',       zh: '我可以退货吗？',           ru: 'Могу ли я вернуть товар?' },
    a: { en: 'Yes! We offer a 30-day return policy. Contact us via the complaint form below with your order ID and reason for return.',
         id: 'Ya! Kami menawarkan kebijakan retur 30 hari. Hubungi kami melalui formulir keluhan di bawah dengan ID pesanan dan alasan pengembalian.',
         ja: 'はい！30日間の返品ポリシーがあります。注文IDと返品理由を添えて、下記のお問い合わせフォームからご連絡ください。',
         zh: '是的！我们提供30天退货政策。请通过下面的投诉表单联系我们，提供您的订单ID和退货原因。',
         ru: 'Да! Мы предлагаем 30-дневную политику возврата. Свяжитесь с нами через форму жалоб ниже.' },
  },
  {
    q: { en: 'How does the AI recommendation work?', id: 'Bagaimana rekomendasi AI bekerja?',   ja: 'AIレコメンドはどう機能する？', zh: 'AI推荐是如何工作的？',     ru: 'Как работают рекомендации ИИ?' },
    a: { en: 'Our AI tracks your views, clicks, and purchases to understand your preferences. It then scores and ranks products based on your history, similar users\' behavior, and product tags.',
         id: 'AI kami melacak tampilan, klik, dan pembelian untuk memahami preferensi Anda. Kemudian memberi skor dan peringkat produk berdasarkan riwayat Anda.',
         ja: '私たちのAIはあなたの閲覧、クリック、購入を追跡して好みを理解します。その後、履歴に基づいて商品をスコアリングします。',
         zh: '我们的AI追踪您的浏览、点击和购买来了解您的偏好，然后根据您的历史记录对产品进行评分和排名。',
         ru: 'Наш ИИ отслеживает ваши просмотры, клики и покупки для понимания ваших предпочтений.' },
  },
];

function FAQItem({ faq, index }) {
  const { language } = useLanguageStore();
  const [open, setOpen] = useState(false);
  const lang = language in faq.q ? language : 'en';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-cream/50 transition-colors"
      >
        <span className="font-semibold text-sm pr-4">{faq.q[lang]}</span>
        {open ? <ChevronUp size={16} className="text-coral shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
          {faq.a[lang]}
        </div>
      )}
    </motion.div>
  );
}

export default function HelpPage() {
  const { t } = useLanguageStore();
  const { toggleChat } = useUIStore();
  const fileRef = useRef(null);

  const [tab,  setTab]  = useState('faq');
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', file: null });
  const [sending, setSending] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSending(true);
    // Simulate sending (replace with actual email service like EmailJS or Formspree)
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    toast.success(t('sent_success'));
    setForm({ name: '', email: '', subject: '', message: '', file: null });
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="pt-20 min-h-screen page-enter">
      {/* Hero */}
      <section className="relative bg-ink py-20 text-center overflow-hidden">
        <div className="blob" style={{ background:'#FF6B6B', width:400, height:400, top:'-20%', left:'20%', opacity:0.12 }} />
        <div className="blob" style={{ background:'#4ECDC4', width:300, height:300, top:'30%', right:'10%', opacity:0.08 }} />
        <div className="relative z-10 max-w-2xl mx-auto px-6">
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
            <p className="text-coral text-sm font-semibold uppercase tracking-widest mb-3">{t('help_title')}</p>
            <h1 className="font-display font-bold text-4xl md:text-5xl text-white mb-4">{t('help_subtitle')}</h1>
            <p className="text-white/50 text-sm">Search our FAQ, chat with AI, or send us a message below.</p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Tab switcher */}
        <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm mb-10 max-w-max mx-auto">
          {[
            { id: 'faq',       label: 'FAQ',             icon: ChevronDown },
            { id: 'ai',        label: t('ask_ai'),        icon: Sparkles },
            { id: 'complaint', label: t('send_complaint'), icon: Mail },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === id ? 'bg-coral text-white shadow-md' : 'text-gray-500 hover:text-ink'
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* FAQ */}
        {tab === 'faq' && (
          <div className="space-y-3">
            <h2 className="section-title mb-6 text-center">Frequently Asked Questions</h2>
            {FAQS.map((faq, i) => <FAQItem key={i} faq={faq} index={i} />)}
            <div className="text-center pt-6">
              <p className="text-gray-400 text-sm mb-4">Can't find your answer?</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button onClick={() => setTab('ai')} className="btn-primary px-6 py-2.5 text-sm">
                  <Sparkles size={15} /> Ask ShopBot AI
                </button>
                <button onClick={() => setTab('complaint')} className="btn-outline px-6 py-2.5 text-sm">
                  <Mail size={15} /> Contact Us
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Chat tab */}
        {tab === 'ai' && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            className="bg-white rounded-3xl shadow-sm overflow-hidden"
            style={{ height: 520 }}
          >
            <div className="bg-ink flex items-center gap-3 px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-coral flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">ShopBot AI</p>
                <p className="text-white/40 text-xs">Ask me anything about ShopAI</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-white/40 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse-slow" />
                Online
              </div>
            </div>
            <div className="p-6 text-center text-gray-400 flex flex-col items-center justify-center" style={{ height: 380 }}>
              <Sparkles size={40} className="text-coral/30 mb-4" />
              <p className="font-semibold text-ink mb-2">Chat with ShopBot</p>
              <p className="text-sm mb-6">Click the button below to open the AI chat — ask about products, orders, shipping, and more!</p>
              <button onClick={toggleChat} className="btn-primary px-8 py-3 rounded-2xl shadow-xl shadow-coral/25">
                <Sparkles size={16} /> Open ShopBot Chat
              </button>
            </div>
          </motion.div>
        )}

        {/* Complaint form */}
        {tab === 'complaint' && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
            <div className="bg-white rounded-3xl shadow-sm p-8">
              <div className="flex items-center gap-3 mb-7">
                <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center">
                  <Mail size={18} className="text-coral" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl">{t('send_complaint')}</h2>
                  <p className="text-gray-400 text-sm">We'll reply to your email within 24 hours.</p>
                </div>
              </div>

              <form onSubmit={handleSend} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">{t('your_name')} *</label>
                    <input value={form.name} onChange={e=>set('name',e.target.value)}
                      className="input-field" placeholder="John Doe" required />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">{t('your_email')} *</label>
                    <input type="email" value={form.email} onChange={e=>set('email',e.target.value)}
                      className="input-field" placeholder="you@example.com" required />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">{t('subject')}</label>
                  <select value={form.subject} onChange={e=>set('subject',e.target.value)} className="input-field">
                    <option value="">Select a topic…</option>
                    <option value="order">Order Issue</option>
                    <option value="payment">Payment Problem</option>
                    <option value="product">Product Question</option>
                    <option value="return">Return / Refund</option>
                    <option value="account">Account Help</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">{t('message')} *</label>
                  <textarea
                    value={form.message} onChange={e=>set('message',e.target.value)}
                    className="input-field resize-none" rows={5}
                    placeholder="Describe your issue in detail…" required
                  />
                </div>

                {/* File attachment */}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">{t('attachment')}</label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-2xl p-5 text-center cursor-pointer hover:border-coral hover:bg-coral/5 transition-all"
                  >
                    {form.file ? (
                      <div className="flex items-center justify-center gap-3">
                        <Paperclip size={16} className="text-coral" />
                        <span className="text-sm font-medium text-ink">{form.file.name}</span>
                        <span className="text-xs text-gray-400">({(form.file.size / 1024).toFixed(1)} KB)</span>
                        <button type="button" onClick={e => { e.stopPropagation(); set('file', null); fileRef.current.value=''; }}
                          className="text-gray-400 hover:text-red-400">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Paperclip size={22} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm text-gray-400">Click to attach a file</p>
                        <p className="text-xs text-gray-300 mt-1">PNG, JPG, PDF up to 5MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileRef} type="file" className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={e => set('file', e.target.files?.[0] || null)}
                  />
                </div>

                <button type="submit" disabled={sending}
                  className="btn-primary w-full justify-center py-3.5 text-base rounded-2xl shadow-xl shadow-coral/25"
                >
                  {sending ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('sending')}</>
                  ) : (
                    <><Send size={16} />{t('send')}</>
                  )}
                </button>

                <p className="text-center text-xs text-gray-400">
                  Or email us directly at{' '}
                  <a href="mailto:hello@shopai.id" className="text-coral hover:underline font-medium">
                    hello@shopai.id
                  </a>
                </p>
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}