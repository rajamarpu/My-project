export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rich: '#0B1220',
        halo: '#1F2937',
        aurora: '#6D28D9',
        cyanGlow: '#38BDF8',
        gold: '#FBBF24',
        ice: '#E0F2FE',
      },
      boxShadow: {
        glow: '0 20px 70px rgba(13, 24, 39, 0.35)',
        soft: '0 10px 40px rgba(15, 23, 42, 0.18)',
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(circle at top, rgba(59,130,246,0.22), transparent 35%), radial-gradient(circle at right, rgba(220,38,38,0.14), transparent 25%), linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(7,12,24,1) 100%)',
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
