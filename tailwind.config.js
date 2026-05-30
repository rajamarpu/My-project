export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rich: '#0F172A',
        halo: '#EEF2FF',
        aurora: '#6366F1',
        cyanGlow: '#4F46E5',
        gold: '#F59E0B',
        ice: '#F8FAFC',
      },
      boxShadow: {
        glow: '0 24px 70px rgba(79, 70, 229, 0.22)',
        soft: '0 18px 45px rgba(15, 23, 42, 0.1)',
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(circle at top, rgba(79,70,229,0.16), transparent 35%), radial-gradient(circle at right, rgba(139,92,246,0.14), transparent 25%), linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(238,242,255,1) 100%)',
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
