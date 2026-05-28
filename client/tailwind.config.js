/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
            bg: '#09090b',
            card: '#18181b',
            surface: '#27272a',
            border: 'rgba(63, 63, 70, 0.5)',

            text: '#fafafa',
            muted: '#a1a1aa',

            accent: '#818cf8',
            accentHover: '#6366f1',

            success: '#34d399',
            warning: '#fbbf24',
            error: '#f87171',

            primary: '#818cf8',
            secondary: '#27272a',
        },
        fontFamily: {
            mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace'],
            sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        },
        fontSize: {
            'xxs': ['0.625rem', { lineHeight: '0.875rem' }],
        },
        animation: {
            'fade-in': 'fadeIn 0.3s ease-out',
            'slide-in': 'slideIn 0.2s ease-out',
            'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        keyframes: {
            fadeIn: {
                '0%': { opacity: '0', transform: 'translateY(4px)' },
                '100%': { opacity: '1', transform: 'translateY(0)' },
            },
            slideIn: {
                '0%': { opacity: '0', transform: 'translateX(8px)' },
                '100%': { opacity: '1', transform: 'translateX(0)' },
            },
        },
      },
    },
    plugins: [],
  }
