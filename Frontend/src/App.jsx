import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import "./App.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import LandingPage from "./pages/landing.jsx";
import AuthenticationPage from "./pages/authentication.jsx";
import HomePage from "./pages/home.jsx";

export default function App() {
  return (
    <div>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthenticationPage />} />
            <Route path="/home" element={<HomePage />} />
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
};
