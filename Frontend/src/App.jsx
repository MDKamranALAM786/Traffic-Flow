import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import "./App.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { LocationProvider } from "./context/LocationContext.jsx";
import withAuth from "./utils/withAuth.jsx";
import LandingPage from "./pages/landing.jsx";
import AuthenticationPage from "./pages/authentication.jsx";
import HomePage from "./pages/home.jsx";
import MapPage from "./pages/map.jsx";

const ProtectedMapPage = withAuth(MapPage);

export default function App() {
  return (
    <div>
      <Router>
        <AuthProvider>
          <LocationProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthenticationPage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/map" element={<ProtectedMapPage />} />
            </Routes>
          </LocationProvider>
        </AuthProvider>
      </Router>
    </div>
  );
};
