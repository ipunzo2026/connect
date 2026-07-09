/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#090a0f', // Fondo oscuro azulado premium
          card: '#121420', // Tarjetas oscuras
          border: 'rgba(255, 255, 255, 0.08)',
          text: '#f8fafc',
          muted: '#94a3b8',
          accent: '#06b6d4', // Cyan
          accentHover: '#0891b2',
          success: '#10b981', // Verde esmeralda para pagos al corriente
          warning: '#f59e0b', // Amarillo ámbar para pagos pendientes
          danger: '#ef4444', // Rojo para pagos vencidos
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(6, 182, 212, 0.15)',
        'neon-card': '0 10px 30px -10px rgba(0, 0, 0, 0.7)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
        'accent-gradient': 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
        'card-gradient': 'linear-gradient(180deg, #131524 0%, #0d0f1a 100%)',
      }
    },
  },
  plugins: [],
};
