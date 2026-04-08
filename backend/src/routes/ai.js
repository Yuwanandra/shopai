const router = require('express').Router();
const Groq   = require('groq-sdk');
const db     = require('../db');
const { optionalAuth } = require('../middleware/auth');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are ShopBot, an intelligent shopping assistant for ShopAI — an Indonesian e-commerce platform.

Your specialities:
1. Help users find products by describing their needs
2. Compare products across multiple dimensions (price, rating, features)
3. Make budget-based recommendations (support both IDR/Rp and USD/$)
4. Suggest complementary items that go well together
5. Explain product categories and help navigate the store

Personality: Friendly, enthusiastic, knowledgeable. Use occasional Indonesian phrases naturally (e.g., "Tentu saja!", "Mantap!").
Always end with 1-2 follow-up suggestions prefixed with "💡 Try asking:".
Only discuss shopping-related topics. Never invent products or prices.`;

const SUGGESTIONS = [
  "Compare items",
  "Find electronics under Rp 500.000",
  "What's trending today?",
  "Help me choose a gift",
  "Show me best-rated products",
  "I have Rp 200.000 budget",
  "What items are on sale?",
  "Recommend items similar to what I viewed",
];

// Get suggestions
router.get('/suggestions', (req, res) => {
  res.json({ suggestions: SUGGESTIONS });
});

// Chat
router.post('/chat', optionalAuth, async (req, res) => {
  const { messages } = req.body;
  if (!messages?.length) return res.status(400).json({ error: 'Messages required' });

  try {
    // Fetch recent products for context
    const { rows: recentProducts } = await db.query(`
      SELECT name, price, avg_rating, slug
      FROM products WHERE is_active=TRUE
      ORDER BY purchase_count DESC LIMIT 15
    `);

    const contextStr = recentProducts.length
      ? `\n\nTop products right now:\n${recentProducts.map(p =>
          `- ${p.name} | Rp ${Number(p.price).toLocaleString('id-ID')} | ⭐${p.avg_rating}`
        ).join('\n')}`
      : '';

    // Set up SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Build messages for Groq
    // Filter out leading assistant messages — Groq needs user message first
    const formattedMessages = messages.map(m => ({
      role:    m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    // Remove leading assistant messages
    while (formattedMessages.length > 0 && formattedMessages[0].role === 'assistant') {
      formattedMessages.shift();
    }

    // Stream response
    const stream = await groq.chat.completions.create({
      model:    'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + contextStr },
        ...formattedMessages,
      ],
      stream:     true,
      max_tokens: 1024,
      temperature: 0.7,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

  } catch (err) {
    console.error('AI Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'AI service temporarily unavailable' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`);
      res.end();
    }
  }
});

module.exports = router;