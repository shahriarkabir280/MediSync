
import { Routes, Route } from "react-router-dom"
import { lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import LoginForm from "./components/LoginForm";

// Lazy load pages for better performance
const DoctorDashboard = lazy(() => import("./pages/DoctorDashboard"));
const PublicWebsite = lazy(() => import("./pages/PublicWebsite"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const DiagnosticDashboard = lazy(() => import("./pages/DiagnosticCenter/DiagnosticDashboard"));
const PatientDashboard = lazy(() => import("./pages/PatientDashboard/PatientDashboard"));
const PatientSignup = lazy(() => import("./pages/PatientSignup"));
const PatientLogin = lazy(() => import("./pages/PatientLogin"));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
);

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <DoctorLogin />;
};

// Doctor Login Component
const DoctorLogin = () => {
  const { login, loading, error } = useAuth();

  const handleLogin = async (credentials) => {
    await login(credentials);
  };

  return <LoginForm onLogin={handleLogin} loading={loading} error={error} />;
};

function App() {

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/doctor/:slug" element={<PublicWebsite />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/diagnostic-center" element={<DiagnosticDashboard />} />
              <Route path="/patient-dashboard" element={<PatientDashboard />} />
              <Route path="/patient-signup" element={<PatientSignup />} />
              <Route path="/patient-login" element={<PatientLogin />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DoctorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<h1 className="text-3xl text-center mt-10">404 Not Found</h1>} />
            </Routes>
          </Suspense>
        </div>
      </AuthProvider>
    </ThemeProvider>
  )

}
export default App
