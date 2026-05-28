/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
            bg: '#070a13',       // Dark premium obsidian space navy
            card: '#0f172a',     // Slate 900
            surface: '#1e293b',  // Slate 800
            border: 'rgba(255, 255, 255, 0.06)', // Elegant glass borders
            
            text: '#f8fafc',     // Slate 50
            muted: '#94a3b8',    // Slate 400
            
            accent: '#6366f1',   // Indigo 500 (premium and modern)
            accentHover: '#4f46e5', // Indigo 600
            
            success: '#10b981', // Emerald 500
            warning: '#f59e0b', // Amber 500
            error: '#ef4444',   // Red 500

            // Contextual Aliases
            primary: '#6366f1', 
            secondary: '#1e293b',
        },
        fontFamily: {
            mono: ['JetBrains Mono', 'Menlo', 'monospace'],
            sans: ['Inter', 'system-ui', 'sans-serif'],
        }
      },
    },
    plugins: [],
  }
