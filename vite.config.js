import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { qrcode } from 'vite-plugin-qrcode';
export default defineConfig({
  plugins: [react(), tailwindcss(),qrcode()],
  server: {
    host:true,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
});
