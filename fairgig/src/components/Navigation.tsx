import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// Import your pages
import Login from "./Login";
import Signup from "./Signup";

const Navigation: React.FC = () => {
  return (
    <Router>
      {/* Navigation Links */}
      <nav style={styles.nav}>
        <Link to="/login" style={styles.link}>Login</Link>
        <Link to="/signup" style={styles.link}>Sign Up</Link>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
};

// Simple inline styles (you can move this to CSS later)
const styles: { [key: string]: React.CSSProperties } = {
  nav: {
    display: "flex",
    gap: "20px",
    padding: "15px",
    background: "#f5f5f5",
  },
  link: {
    textDecoration: "none",
    color: "#333",
    fontWeight: "bold",
  },
};

export default Navigation;