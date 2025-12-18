import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client';
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { reportWebVitals } from './utils/performance';

// Global error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent the default behavior (which would log to console)
  event.preventDefault();
});

// Global error handling for other errors
window.addEventListener('error', function(event) {
  console.error('Global error:', event.error);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
)

// Report web vitals in development
if (process.env.NODE_ENV === 'development') {
  reportWebVitals((metric) => {
    console.log(`[Web Vital] ${metric.name}:`, metric.value);
  });
}
