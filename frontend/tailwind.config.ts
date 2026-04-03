import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './stores/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-display)', 'Arial', 'sans-serif'],
        serif: ['var(--font-body)', 'Georgia', 'serif'],
        display: ['var(--font-display)', 'Arial', 'sans-serif'],
        body: ['var(--font-body)', 'Georgia', 'serif'],
      },
      boxShadow: {
        panel: '0 20px 60px rgba(4, 9, 14, 0.35)',
      },
      colors: {
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        shell: 'rgb(var(--color-shell) / <alpha-value>)',
        panel: 'rgb(var(--color-panel) / <alpha-value>)',
        mist: 'rgb(var(--color-mist) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};

export default config;
