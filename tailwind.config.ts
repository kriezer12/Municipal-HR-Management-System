import type { Config } from 'tailwindcss'
import defaultConfig from 'tailwindcss/defaultConfig'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1C313A',
          light: '#2C6159',
        },
      },
    },
  },
  plugins: [],
}
export default config
