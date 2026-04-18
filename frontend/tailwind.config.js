/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        glass: 'rgba(255,255,255,0.05)',
        neon: {
          purple: '#a855f7',
          blue: '#3b82f6',
          cyan: '#06b6d4',
          pink: '#ec4899',
        },
      },
      backgroundImage: {
        'hostel-gradient': 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        neon: '0 0 15px rgba(168,85,247,0.5)',
        'neon-blue': '0 0 15px rgba(59,130,246,0.5)',
        'neon-cyan': '0 0 15px rgba(6,182,212,0.5)',
      },
    },
  },
  plugins: [],
}
