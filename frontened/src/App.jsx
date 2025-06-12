import { Routes, Route } from "react-router-dom"
import ProductPage from "./pages/ProductPage";
import SettingsPage from "./pages/SettingsPage";
import VerticalTabLayout from "./pages/VerticleTab";
import DoctorDashboard from "./pages/DoctorDashboard";
import PublicWebsite from "./pages/PublicWebsite";






function App() {

  return(
    <div className="min-h-screen bg-base-200 transition-colors duration-300"> 
          

       <Routes>
        <Route path="/" element={<PublicWebsite/>} />
        <Route path="/doctordashboard" element={<DoctorDashboard/>} />
        <Route path="/products/:id" element={<ProductPage/>} />
        <Route path="*" element={<h1 className="text-3xl text-center mt-10">404 Not Found</h1>} />
       </Routes>

    </div>
  )

}
export default App
