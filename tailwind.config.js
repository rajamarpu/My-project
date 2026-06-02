export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rich: '#111827',
        halo: '#EFF6FF',
        aurora: '#3B82F6',
        cyanGlow: '#2563EB',
        gold: '#F59E0B',
        ice: '#FFFFFF',
      },
      boxShadow: {
        glow: '0 24px 70px rgba(37, 99, 235, 0.2)',
        soft: '0 18px 45px rgba(17, 24, 39, 0.08)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(180deg, rgba(239,246,255,1) 0%, rgba(255,255,255,1) 100%)',
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
