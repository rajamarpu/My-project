export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--color-canvas)',
        surface: 'var(--color-surface)',
        foreground: 'var(--color-text)',
        muted: 'var(--color-text-muted)',
        border: 'var(--color-border)',
        action: 'var(--color-action)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        info: 'var(--color-info)',
        rich: 'var(--color-text)',
        halo: 'var(--color-info-soft)',
        aurora: 'var(--color-info)',
        cyanGlow: 'var(--color-info)',
        gold: 'var(--color-warning)',
        ice: 'var(--color-surface)',
      },
      boxShadow: {
        glow: 'var(--shadow-lg)',
        soft: 'var(--shadow-md)',
      },
      backgroundImage: {
        'hero-gradient': 'var(--gradient-page)',
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
