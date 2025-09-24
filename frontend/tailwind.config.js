/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1E3A8A',     // Azul oscuro
        secondary: '#FFA024',   // Naranja
        gray: '#6B7280',        // Gris medio
        light: '#F5F5F5',       // Gris muy claro
        dark: '#2E2E2E',        // Gris muy oscuro
        
        // Variaciones de los colores principales (generadas)
        'primary-light': '#4F6DB3',
        'primary-dark': '#152A65',
        
        'secondary-light': '#FFB854',
        'secondary-dark': '#E68600',
        
        // Colores utilitarios comunes
        error: '#ef4444',
        success: '#22c55e',
        warning: '#f59e0b',
        info: '#3b82f6',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
    },
  },
  plugins: [],
}