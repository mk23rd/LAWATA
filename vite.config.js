import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
    include: ['**/*.jsx', '**/*.js'] // Allow JSX in .js files
  }),
    tailwindcss(),
  ],
})
