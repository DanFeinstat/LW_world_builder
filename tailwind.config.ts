import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Dark mode is handled entirely by CSS variables + [data-theme] attribute.
  // We never use Tailwind's dark: variant — the variable values flip automatically.
  darkMode: 'class', // disabled in practice; kept to avoid purging dark: classes if ever used
  theme: {
    // --- Colors ---
    // All mapped to CSS variables so dark mode flips automatically via [data-theme].
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      black: '#000000',

      dm: 'var(--color-dm)',
      'dm-subtle': 'var(--color-dm-subtle)',
      'dm-hover': 'var(--color-dm-hover)',
      player: 'var(--color-player)',
      'player-subtle': 'var(--color-player-subtle)',

      npc: 'var(--color-npc)',
      location: 'var(--color-location)',
      faction: 'var(--color-faction)',
      lore: 'var(--color-lore)',
      quest: 'var(--color-quest)',

      surface: 'var(--color-surface)',
      'surface-raised': 'var(--color-surface-raised)',
      'surface-sunken': 'var(--color-surface-sunken)',
      border: 'var(--color-border)',
      'border-strong': 'var(--color-border-strong)',
      'text-primary': 'var(--color-text-primary)',
      'text-secondary': 'var(--color-text-secondary)',
      'text-muted': 'var(--color-text-muted)',

      danger: 'var(--color-danger)',
      'danger-subtle': 'var(--color-danger-subtle)',
      'danger-hover': 'var(--color-danger-hover)',
      success: 'var(--color-success)',
      'success-subtle': 'var(--color-success-subtle)',
      warning: 'var(--color-warning)',
      'warning-subtle': 'var(--color-warning-subtle)',
    },

    // --- Spacing ---
    // Literal values (spacing doesn't change with theme).
    // Matches our token scale 1:1.
    spacing: {
      px: '1px',
      0: '0',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      5: '20px',
      6: '24px',
      8: '32px',
      10: '40px',
      12: '48px',
    },

    // --- Border radius ---
    borderRadius: {
      none: '0',
      sm: '4px',
      DEFAULT: '8px',
      md: '8px',
      lg: '12px',
      full: '9999px',
    },

    // --- Shadows (use variables — values differ in dark mode) ---
    boxShadow: {
      sm: 'var(--shadow-sm)',
      DEFAULT: 'var(--shadow-md)',
      md: 'var(--shadow-md)',
      lg: 'var(--shadow-lg)',
      none: 'none',
    },

    // --- Typography ---
    fontFamily: {
      display: 'var(--font-display)',
      body: 'var(--font-body)',
      ui: 'var(--font-ui)',
      mono: 'var(--font-mono)',
    },

    fontSize: {
      xs: '11px',
      sm: '13px',
      base: '15px',
      md: '17px',
      lg: '20px',
      xl: '24px',
      '2xl': '30px',
    },

    lineHeight: {
      tight: '1.3',
      base: '1.6',
      loose: '1.8',
    },

    // --- Transitions ---
    transitionDuration: {
      fast: '120ms',
      base: '200ms',
      slow: '350ms',
    },
    transitionTimingFunction: {
      DEFAULT: 'ease',
    },

    extend: {
      // --- Z-index ---
      zIndex: {
        base: '0',
        raised: '10',
        dropdown: '100',
        modal: '200',
        toast: '300',
      },

      // --- Keyframes + animations ---
      keyframes: {
        slideIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-in': 'slideIn 200ms ease forwards',
      },
    },
  },
  plugins: [],
} satisfies Config
