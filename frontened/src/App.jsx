import { Routes, Route } from "react-router-dom"
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProductPage from "./pages/ProductPage";
import SettingsPage from "./pages/SettingsPage";
import VerticalTabLayout from "./pages/VerticleTab";
import DoctorDashboard from "./pages/DoctorDashboard";
import PublicWebsite from "./pages/PublicWebsite";
import LoginForm from "./components/LoginForm";

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
      </div>
    </AuthProvider>
  )

}
export default App
