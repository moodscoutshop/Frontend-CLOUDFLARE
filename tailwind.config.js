/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Industrial Tech-Sleek Theme
        cream: {
          50: '#FDFDF8',   // Main background
          100: '#F8F7F2',
          200: '#EEEFE9',  // Section gray
        },
        taupe: {
          100: '#E8E4D9',
          200: '#E0DCCE',  // Navbar color
          300: '#D4CFC0',
          400: '#C5BFAE',
        },
        amber: {
          primary: '#EB9D2A',   // Button1 bg
          shadow: '#CD8407',    // Button1 shadow
          border: '#B17816',    // Button border
        },
        ink: {
          DEFAULT: '#1D1F20',   // Dark font
          light: '#3D3F40',
          muted: '#5D5F60',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'btn-primary': '0 2px 0 0 #CD8407',
        'btn-secondary': '0 2px 0 0 #EB9D2A',
        'btn-primary-hover': '0 4px 0 0 #CD8407',
        'btn-secondary-hover': '0 4px 0 0 #EB9D2A',
      }
    },
  },
  plugins: [],
}