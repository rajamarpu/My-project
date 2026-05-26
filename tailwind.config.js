export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rich: '#083E57',
        halo: '#EAFBF8',
        aurora: '#10B9A7',
        cyanGlow: '#16A9D8',
        gold: '#F97316',
        ice: '#F7FAFC',
      },
      boxShadow: {
        glow: '0 20px 70px rgba(16, 185, 167, 0.2)',
        soft: '0 10px 40px rgba(8, 62, 87, 0.16)',
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(circle at top, rgba(249,115,22,0.16), transparent 35%), radial-gradient(circle at right, rgba(16,185,167,0.16), transparent 25%), linear-gradient(180deg, rgba(247,250,252,1) 0%, rgba(234,251,248,1) 100%)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        shimmer: 'shimmer 2.8s linear infinite',
      },
    },
  },
  plugins: [],
}
