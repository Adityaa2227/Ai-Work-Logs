/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
            bg: '#000000',      // Pure Black
            card: '#09090b',    // Zinc 950
            surface: '#18181b', // Zinc 900
            border: '#27272a',  // Zinc 800
            
            text: '#e4e4e7',    // Zinc 200
            muted: '#a1a1aa',   // Zinc 400
            
            accent: '#f59e0b',  // Golden amber 500
            accentHover: '#d97706', // Golden amber 600
            
            success: '#10b981', // Emerald 500
            warning: '#f59e0b', // Amber 500
            error: '#ef4444',   // Red 500

            // Contextual Aliases
            primary: '#f59e0b', 
            secondary: '#27272a',
        },
        fontFamily: {
            mono: ['JetBrains Mono', 'Menlo', 'monospace'], // Tech feel
            sans: ['Inter', 'system-ui', 'sans-serif'],
        }
      },
    },
    plugins: [],
  }
