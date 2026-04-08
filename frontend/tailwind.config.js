/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Clash Display"', '"Cabinet Grotesk"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink:    { DEFAULT:'#0D0D0D', 50:'#1A1A2E', 100:'#16213E', 200:'#0F3460' },
        coral:  { DEFAULT:'#FF6B6B', light:'#FF8E8E', dark:'#E85555' },
        amber:  { DEFAULT:'#FFB347', light:'#FFC67A', dark:'#E8960A' },
        teal:   { DEFAULT:'#4ECDC4', light:'#7EDDD7', dark:'#36B5AC' },
        cream:  { DEFAULT:'#FFF8F0', 50:'#FFFDF9' },
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
      animation: {
        'float':     'float 6s ease-in-out infinite',
        'shimmer':   'shimmer 1.5s linear infinite',
        'pulse-slow':'pulse 3s ease-in-out infinite',
        'slide-up':  'slideUp 0.5s ease forwards',
        'fade-in':   'fadeIn 0.4s ease forwards',
        'spin-slow':  'spin 8s linear infinite',
      },
      keyframes: {
        float:    { '0%,100%':{ transform:'translateY(0)' }, '50%':{ transform:'translateY(-12px)' } },
        shimmer:  { '0%':{ backgroundPosition:'-200% 0' }, '100%':{ backgroundPosition:'200% 0' } },
        slideUp:  { from:{ opacity:0, transform:'translateY(20px)' }, to:{ opacity:1, transform:'translateY(0)' } },
        fadeIn:   { from:{ opacity:0 }, to:{ opacity:1 } },
      },
    },
  },
  plugins: [],
};
