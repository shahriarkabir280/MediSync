import { Routes, Route } from "react-router-dom"
import { lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginForm from "./components/LoginForm";

// Lazy load pages for better performance
const ProductPage = lazy(() => import("./pages/ProductPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const VerticalTabLayout = lazy(() => import("./pages/VerticleTab"));
const DoctorDashboard = lazy(() => import("./pages/DoctorDashboard"));
const PublicWebsite = lazy(() => import("./pages/PublicWebsite"));

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

  return(
    <AuthProvider>
      <div className="min-h-screen bg-base-200 transition-colors duration-300"> 
        <Suspense fallback={<PageLoader />}>
          <Routes>
             {/*
            <Route path="/" element={<PublicWebsite/>} />*/}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <DoctorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/products/:id" element={<ProductPage/>} />
            <Route path="*" element={<h1 className="text-3xl text-center mt-10">404 Not Found</h1>} />
          </Routes>
        </Suspense>
      </div>
    </AuthProvider>
  )

}
export default App
