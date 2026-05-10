import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import "./App.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import LandingPage from "./pages/landing.jsx";
import AuthenticationPage from "./pages/authentication.jsx";

export default function App() {
  return (
    <div>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthenticationPage />} />
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
};
