/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Navegacao: preto profundo com leve tom roxo (base do visual neon).
        ink: {
          950: '#050109',
          900: '#0b0614',
          800: '#140a22',
          700: '#1f1033',
          600: '#2c1748',
          500: '#3d2166',
        },
        // Acento principal da marca: roxo neon.
        brand: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
        },
        // Alias mantido para nao quebrar classes ja escritas como accent-600.
        accent: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
        },
        // Cores semanticas do dominio: dinheiro, pendencia, meta, alerta.
        // Escalas completas (50-700): tons intermediarios sao usados em estados
        // de hover e borda, e faltar um deles quebra a compilacao do Tailwind.
        money: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        pending: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        goal: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        alert: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
        },
      },
      fontFamily: {
        sans: [
          '"Segoe UI Variable Display"',
          '"Segoe UI"',
          'system-ui',
          '-apple-system',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: ['"Cascadia Mono"', 'Consolas', '"Courier New"', 'monospace'],
      },
      fontSize: {
        // Escala compacta, propria de software de gestao.
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        raised: '0 2px 4px -1px rgb(15 23 42 / 0.06), 0 4px 12px -2px rgb(15 23 42 / 0.08)',
        pop: '0 10px 32px -8px rgb(15 23 42 / 0.22)',
        sidebar: 'inset -1px 0 0 0 rgb(168 85 247 / 0.14)',
        // Brilho neon roxo: usado em botoes e destaques da navegacao.
        neon: '0 0 0 1px rgb(168 85 247 / 0.35), 0 0 18px -2px rgb(168 85 247 / 0.55)',
      },
      backgroundImage: {
        // Usado apenas no painel de navegacao e na tela de login, para dar
        // profundidade sem poluir as areas de trabalho.
        'ink-depth': 'linear-gradient(175deg, #140a22 0%, #050109 100%)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
      },
    },
  },
  plugins: [],
};
