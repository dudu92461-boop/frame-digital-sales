/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta do sistema: cinza-escuro para navegacao, branco para conteudo,
        // azul apenas como acento de acao/selecao.
        ink: {
          950: '#0d0f13',
          900: '#131720',
          800: '#1b202b',
          700: '#252b39',
          600: '#39414f',
        },
        accent: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      fontFamily: {
        sans: [
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
        card: '0 1px 2px 0 rgb(15 23 42 / 0.05)',
        pop: '0 8px 24px -6px rgb(15 23 42 / 0.18)',
      },
    },
  },
  plugins: [],
};
