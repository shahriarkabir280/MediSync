import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ["abrielle-untrammeled-odessa.ngrok-free.dev"],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT || 5173,
    strictPort: false
  },
  build: {
    // Enable code splitting for better performance
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'react-hot-toast'],
          'socket-vendor': ['socket.io-client'],
          // Split large dashboard tabs into separate chunks
          'dashboard-core': [
            './src/pages/DoctorDashboardTabs/AppointmentTab.jsx',
            './src/pages/DoctorDashboardTabs/PatientTab.jsx',
            './src/pages/DoctorDashboardTabs/ProfileTab.jsx'
          ],
          'dashboard-features': [
            './src/pages/DoctorDashboardTabs/ChatTab.jsx',
            './src/pages/DoctorDashboardTabs/BlogsTab.jsx',
            './src/pages/DoctorDashboardTabs/NotificationTab.jsx'
          ],
          'dashboard-extended': [
            './src/pages/DoctorDashboardTabs/LabratoryTab.jsx',
            './src/pages/DoctorDashboardTabs/AnalyticsTab.jsx'
          ]
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable minification
    minify: 'esbuild',
    // Enable source maps for production debugging (optional, disable for smaller builds)
    sourcemap: false,
    // Target modern browsers for smaller bundle
    target: 'es2015'
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react', 'socket.io-client']
  }
})
