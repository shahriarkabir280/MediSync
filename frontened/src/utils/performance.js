/**
 * Performance monitoring utilities
 */

// Measure component render time
export const measureRender = (componentName, callback) => {
  const start = performance.now();
  const result = callback();
  const end = performance.now();

  if (import.meta.env.DEV) {
    console.log(`[Performance] ${componentName} rendered in ${(end - start).toFixed(2)}ms`);
  }

  return result;
};

// Debounce function for expensive operations
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for frequent events
export const throttle = (func, limit = 300) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Lazy load images with Intersection Observer
export const lazyLoadImage = (imgElement) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.getAttribute('data-src');
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
        }
        observer.unobserve(img);
      }
    });
  });

  observer.observe(imgElement);
};

// Report Web Vitals (Core Web Vitals)
export const reportWebVitals = (onPerfEntry) => {
  // Skip if web-vitals is not available
  if (!onPerfEntry || !(onPerfEntry instanceof Function)) {
    return;
  }

  // Try to use Performance Observer API instead
  try {
    if ('PerformanceObserver' in window) {
      // Observe navigation timing
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          onPerfEntry({
            name: entry.name,
            value: entry.duration,
            entryType: entry.entryType
          });
        }
      });
      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
    }
  } catch (error) {
    // Performance Observer not supported
    console.debug('Performance monitoring not available');
  }
};

// Log performance metrics
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.addEventListener('load', () => {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    const connectTime = perfData.responseEnd - perfData.requestStart;
    const renderTime = perfData.domComplete - perfData.domLoading;

    console.log('📊 Performance Metrics:');
    console.log(`  Page Load Time: ${pageLoadTime}ms`);
    console.log(`  Connection Time: ${connectTime}ms`);
    console.log(`  Render Time: ${renderTime}ms`);
  });
}
