import { HashRouter as Router, Routes, Route } from "react-router-dom";

import "./App.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import LandingPage from "./pages/landing.jsx";

export default function App() {
  return (
    <div>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
};
