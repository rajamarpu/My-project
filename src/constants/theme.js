export const themeTokens = {
  colors: {
    background: '#F7FAFC',
    backgroundDeep: '#083E57',
    surface: 'rgba(255, 255, 255, 0.9)',
    surfaceStrong: 'rgba(255, 255, 255, 0.98)',
    border: 'rgba(8, 62, 87, 0.14)',
    text: '#102A43',
    textMuted: '#627D98',
    orange: '#F97316',
    teal: '#10B9A7',
    cyan: '#16A9D8',
    blue: '#0E7CC1',
    navy: '#083E57',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#FB7185',
  },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    headingWeight: 700,
    bodyWeight: 400,
    lineHeight: 1.6,
  },
  radii: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.25rem',
    full: '999px',
  },
  shadows: {
    soft: '0 20px 70px rgba(2, 6, 23, 0.42)',
    glow: '0 20px 70px rgba(34, 211, 238, 0.22)',
    neon: '0 0 0 1px rgba(34, 211, 238, 0.22), 0 24px 80px rgba(139, 92, 246, 0.2)',
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  gradients: {
    brand: 'linear-gradient(135deg, #F97316 0%, #16A9D8 48%, #10B9A7 100%)',
    hero: 'radial-gradient(circle at 18% 8%, rgba(249, 115, 22, 0.14), transparent 30rem), radial-gradient(circle at 78% 22%, rgba(16, 185, 167, 0.16), transparent 28rem), #F7FAFC',
    hologram: 'linear-gradient(135deg, rgba(249, 115, 22, 0.14), rgba(22, 169, 216, 0.12), rgba(16, 185, 167, 0.14))',
  },
  animation: {
    fast: '160ms',
    base: '240ms',
    slow: '420ms',
    ease: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  },
}

export default themeTokens
