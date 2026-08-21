/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-2': 'var(--bg-2)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        'ink-3': 'var(--ink-3)',
        accent: 'var(--accent)',
        'accent-2': 'var(--accent-2)',
        'accent-ink': 'var(--accent-ink)',
        frame: 'var(--frame)',
      },
      borderRadius: {
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        xl: 'var(--r-xl)',
        full: 'var(--r-full)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        display: 'var(--font-display)',
        mono: 'var(--font-mono)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      transitionTimingFunction: {
        glass: 'var(--ease)',
      },
    },
  },
  plugins: [],
}
