import React from "react";
import { useNavigate } from "react-router-dom";

const Navigation: React.FC = () => {
  const navigate = useNavigate();

  // functions to change pages
  const goHome = () => navigate("/");
  const goLogin = () => navigate("/login");
  const goSignup = () => navigate("/signup");
  const goDashboard = () => navigate("/dashboard");

  return (
    <nav style={{ padding: "10px", background: "#eee" }}>
      <button onClick={goHome}>Home</button>
      <button onClick={goLogin}>Login</button>
      <button onClick={goSignup}>Signup</button>
      <button onClick={goDashboard}>Dashboard</button>
    </nav>
  );
};

export default Navigation;